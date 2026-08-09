import { once } from 'node:events';
import { createServer } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestServer {
	baseUrl: string;
	databasePath: string;
	restart: () => Promise<void>;
	stop: () => Promise<void>;
}

async function availablePort(): Promise<number> {
	const server = createServer();
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Could not allocate a test port');
	}
	server.close();
	await once(server, 'close');
	return address.port;
}

async function waitUntilReady(process: ChildProcess, baseUrl: string): Promise<void> {
	let output = '';
	process.stdout?.on('data', (chunk) => (output += chunk.toString()));
	process.stderr?.on('data', (chunk) => (output += chunk.toString()));

	for (let attempt = 0; attempt < 100; attempt += 1) {
		if (process.exitCode !== null) {
			throw new Error(`Test server exited before becoming ready:\n${output}`);
		}

		try {
			await fetch(baseUrl);
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 25));
		}
	}

	throw new Error(`Test server did not become ready:\n${output}`);
}

export async function startTestServer(overrides: NodeJS.ProcessEnv = {}): Promise<TestServer> {
	const directory = await mkdtemp(join(tmpdir(), 'gettyping-'));
	const databasePath = join(directory, 'test.sqlite');
	const port = await availablePort();
	const baseUrl = `http://127.0.0.1:${port}`;
	const launch = async (): Promise<ChildProcess> => {
		const process = spawn(globalThis.process.execPath, ['build'], {
			cwd: globalThis.process.cwd(),
			env: {
				...globalThis.process.env,
				...overrides,
				DATABASE_PATH: databasePath,
				HOST: '127.0.0.1',
				ORIGIN: baseUrl,
				PORT: String(port)
			},
			stdio: ['ignore', 'pipe', 'pipe']
		});
		await waitUntilReady(process, baseUrl);
		return process;
	};
	const terminate = async (process: ChildProcess): Promise<void> => {
		if (process.exitCode === null) {
			process.kill('SIGTERM');
			await once(process, 'exit');
		}
	};

	let child = await launch();

	return {
		baseUrl,
		databasePath,
		restart: async () => {
			await terminate(child);
			child = await launch();
		},
		stop: async () => {
			await terminate(child);
			await rm(directory, { recursive: true, force: true });
		}
	};
}

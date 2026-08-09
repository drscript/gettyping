import { once } from 'node:events';
import { createServer } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TestServer {
	baseUrl: string;
	databasePath: string;
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
	const child = spawn(process.execPath, ['build'], {
		cwd: process.cwd(),
		env: {
			...process.env,
			...overrides,
			DATABASE_PATH: databasePath,
			HOST: '127.0.0.1',
			ORIGIN: baseUrl,
			PORT: String(port)
		},
		stdio: ['ignore', 'pipe', 'pipe']
	});

	await waitUntilReady(child, baseUrl);

	return {
		baseUrl,
		databasePath,
		stop: async () => {
			if (child.exitCode === null) {
				child.kill('SIGTERM');
				await once(child, 'exit');
			}
			await rm(directory, { recursive: true, force: true });
		}
	};
}

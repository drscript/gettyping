import { getRuntimeConfiguration } from '$lib/server/runtime/configuration';
import { generationRandom } from '$lib/server/runtime/random';
import { error, json } from '@sveltejs/kit';

export function GET() {
	if (process.env.ENABLE_TEST_API !== 'true') {
		error(404, 'Not found');
	}

	return json({
		configuration: getRuntimeConfiguration(),
		randomSequence: Array.from({ length: 5 }, () => generationRandom.next())
	});
}

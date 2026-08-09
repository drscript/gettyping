export interface AttemptConfiguration {
	tokenTtlMs: number;
	outstandingTokenCap: number;
	eventCountCeiling: number;
}

function positiveIntegerFromEnvironment(name: string, defaultValue: number): number {
	const rawValue = process.env[name];
	if (rawValue === undefined) return defaultValue;

	const value = Number(rawValue);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} has an invalid value: ${rawValue}`);
	}

	return value;
}

export function getAttemptConfiguration(): AttemptConfiguration {
	return {
		tokenTtlMs: positiveIntegerFromEnvironment('ATTEMPT_TOKEN_TTL_MS', 30 * 60 * 1000),
		outstandingTokenCap: positiveIntegerFromEnvironment('OUTSTANDING_TOKEN_CAP', 3),
		eventCountCeiling: positiveIntegerFromEnvironment('EVENT_COUNT_CEILING', 2000)
	};
}

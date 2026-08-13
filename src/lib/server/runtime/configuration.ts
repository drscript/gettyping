export interface RuntimeConfiguration {
	targetingAggressiveness: number;
	weakKeyDecayFactor: number;
	speedTestFloorWpm: number;
	consecutiveFailureCount: number;
	stretchOfferCount: number;
	stretchLengthFactor: number;
	leaderboardDisplayThreshold: number;
	netWpmCeiling: number;
	latencyClampMs: number;
}

function numberFromEnvironment(
	name: string,
	defaultValue: number,
	validate: (value: number) => boolean
): number {
	const rawValue = process.env[name];
	if (rawValue === undefined) return defaultValue;

	const value = Number(rawValue);
	if (!Number.isFinite(value) || !validate(value)) {
		throw new Error(`${name} has an invalid value: ${rawValue}`);
	}

	return value;
}

const isProbability = (value: number) => value >= 0 && value <= 1;
const isDecayFactor = (value: number) => value > 0 && value < 1;
const isPositive = (value: number) => value > 0;
const isPositiveInteger = (value: number) => Number.isInteger(value) && value > 0;
const isFraction = (value: number) => value > 0 && value <= 1;

export function getRuntimeConfiguration(): RuntimeConfiguration {
	const consecutiveFailureCount = numberFromEnvironment(
		'CONSECUTIVE_FAILURE_COUNT',
		3,
		isPositiveInteger
	);
	const stretchOfferCount = numberFromEnvironment('STRETCH_OFFER_COUNT', 2, isPositiveInteger);
	if (stretchOfferCount >= consecutiveFailureCount) {
		throw new Error(
			`stretchOfferCount (${stretchOfferCount}) must be less than consecutiveFailureCount (${consecutiveFailureCount})`
		);
	}

	return {
		targetingAggressiveness: numberFromEnvironment('TARGETING_AGGRESSIVENESS', 0.75, isProbability),
		weakKeyDecayFactor: numberFromEnvironment('WEAK_KEY_DECAY_FACTOR', 0.9, isDecayFactor),
		speedTestFloorWpm: numberFromEnvironment('SPEED_TEST_FLOOR_WPM', 15, isPositive),
		consecutiveFailureCount,
		stretchOfferCount,
		stretchLengthFactor: numberFromEnvironment('STRETCH_LENGTH_FACTOR', 0.5, isFraction),
		leaderboardDisplayThreshold: numberFromEnvironment(
			'LEADERBOARD_DISPLAY_THRESHOLD',
			5,
			isPositiveInteger
		),
		netWpmCeiling: numberFromEnvironment('NET_WPM_CEILING', 250, isPositive),
		latencyClampMs: numberFromEnvironment('LATENCY_CLAMP_MS', 3000, isPositive)
	};
}

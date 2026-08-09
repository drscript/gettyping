export type TrackFlex = 'learn' | 'speed-test-practice';

export type CharacterFeedbackState = 'correct' | 'incorrect' | 'current' | 'pending';

export interface CharacterFeedbackItem {
	character: string;
	state: CharacterFeedbackState;
}

export const typingKeys = [
	'shift',
	' ',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	';',
	"'",
	',',
	'.',
	'/',
	'!',
	'?',
	':'
] as const;

export type TypingKey = (typeof typingKeys)[number];

export function isSpaceKey(key: string): key is ' ' {
	return key === ' ';
}

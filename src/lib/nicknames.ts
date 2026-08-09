export interface CuratedNickname {
	nickname: string;
	icon: string;
}

export const curatedNicknames: CuratedNickname[] = [
	{ nickname: 'BraveOtter', icon: '🦦' },
	{ nickname: 'SunnyFox', icon: '🦊' },
	{ nickname: 'MintPanda', icon: '🐼' },
	{ nickname: 'SwiftRobin', icon: '🐦' },
	{ nickname: 'HappyTurtle', icon: '🐢' },
	{ nickname: 'BrightTiger', icon: '🐯' },
	{ nickname: 'CloudKoala', icon: '🐨' },
	{ nickname: 'KindBadger', icon: '🦡' },
	{ nickname: 'CosyPenguin', icon: '🐧' },
	{ nickname: 'DaringDolphin', icon: '🐬' },
	{ nickname: 'JollyGecko', icon: '🦎' },
	{ nickname: 'CalmLlama', icon: '🦙' }
];

export function isCuratedNickname(nickname: string): boolean {
	return curatedNicknames.some((candidate) => candidate.nickname === nickname);
}

const blockedTerms = [
	'damn',
	'fuck',
	'shit',
	'bitch',
	'cunt',
	'dick',
	'prick',
	'whore',
	'slut'
];

const allowedNickname = /^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u;

export function normalizeNickname(value: FormDataEntryValue | null): string | undefined {
	if (typeof value !== 'string') return undefined;

	const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
	if (normalized.length < 2 || normalized.length > 24) return undefined;
	if (!allowedNickname.test(normalized)) return undefined;

	return normalized;
}

export function typedNicknameIsAllowed(nickname: string): boolean {
	const searchable = nickname.toLocaleLowerCase('en').replace(/[^a-z0-9]/g, '');
	return !blockedTerms.some((term) => searchable.includes(term));
}

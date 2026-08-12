export const transferCodeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const transferCodeLength = 8;

export function isWellFormedTransferCode(candidate: string): boolean {
	if (candidate.length !== transferCodeLength) return false;
	return [...candidate].every((character) => transferCodeAlphabet.includes(character));
}

export function formatTransferCodeForDisplay(code: string): string {
	return `${code.slice(0, 4)}-${code.slice(4)}`;
}

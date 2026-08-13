interface KeyPosition {
	row: number;
	x: number;
}

// Row offsets approximate the physical ANSI QWERTY stagger: each letter row's
// leading modifier key (Tab 1.5U, Caps Lock 1.75U, Left Shift 2.25U) shares the
// same left margin as the row above it, so each row drifts right by that key's
// width relative to the number row.
const rowOffsets = [0, 0.5, 0.75, 1.25];
const keyboardRows: readonly (readonly string[])[] = [
	[...'1234567890'],
	[...'qwertyuiop'],
	[...'asdfghjkl', ';', "'"],
	[...'zxcvbnm', ',', '.', '/']
];

const keyPositions = new Map<string, KeyPosition>();
keyboardRows.forEach((row, rowIndex) => {
	row.forEach((key, columnIndex) => {
		keyPositions.set(key, { row: rowIndex, x: columnIndex + rowOffsets[rowIndex] });
	});
});
// Shifted punctuation shares its unshifted key's physical position.
keyPositions.set('!', keyPositions.get('1')!);
keyPositions.set('?', keyPositions.get('/')!);

function isAdjacent(a: KeyPosition, b: KeyPosition): boolean {
	const rowDelta = Math.abs(a.row - b.row);
	if (rowDelta === 0) return Math.abs(a.x - b.x) === 1;
	if (rowDelta === 1) return Math.abs(a.x - b.x) < 1;
	return false;
}

/** Every character key the Practice curriculum can teach, excluding `shift`. */
export const characterKeys: readonly string[] = [
	...'abcdefghijklmnopqrstuvwxyz',
	...'0123456789',
	';',
	',',
	'.',
	"'",
	'?',
	'!'
];

/** Each character key's physical QWERTY neighbours (horizontal, vertical, diagonal). */
export const qwertyNeighbours: ReadonlyMap<string, readonly string[]> = new Map(
	characterKeys.map((key) => {
		const position = keyPositions.get(key)!;
		return [
			key,
			characterKeys.filter(
				(other) => other !== key && isAdjacent(position, keyPositions.get(other)!)
			)
		] as const;
	})
);

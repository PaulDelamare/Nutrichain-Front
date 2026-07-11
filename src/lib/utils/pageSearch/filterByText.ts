export function matchesTextQuery(
	values: (string | number | undefined | null)[],
	query: string
): boolean {
	if (!query.trim()) return true;
	const q = query.trim().toLowerCase();
	return values.some((v) => v != null && String(v).toLowerCase().includes(q));
}

export function filterRowsByText<T>(
	rows: T[],
	query: string,
	pickFields: (row: T) => (string | number | undefined | null)[]
): T[] {
	if (!query.trim()) return rows;
	return rows.filter((row) => matchesTextQuery(pickFields(row), query));
}

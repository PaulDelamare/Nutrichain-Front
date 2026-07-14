export function safeRedirect(path: string | null | undefined, fallback: string): string {
	if (!path) return fallback;
	const trimmed = path.trim();
	if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
	if (trimmed.includes('://')) return fallback;
	return trimmed;
}

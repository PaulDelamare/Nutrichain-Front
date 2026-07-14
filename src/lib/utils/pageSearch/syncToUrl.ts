import { goto } from '$app/navigation';

export function schedulePageSearchNavigation(
	pathname: string,
	searchParams: URLSearchParams,
	param: string,
	query: string,
	delayMs = 400
): () => void {
	const next = query.trim();
	const current = (searchParams.get(param) ?? '').trim();
	if (next === current) return () => {};

	const timer = setTimeout(() => {
		const params = new URLSearchParams(searchParams);
		if (next) params.set(param, next);
		else params.delete(param);
		const qs = params.toString();
		goto(`${pathname}${qs ? `?${qs}` : ''}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, delayMs);

	return () => clearTimeout(timer);
}

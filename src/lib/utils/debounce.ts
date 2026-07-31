/**
 * Reporte l'exécution de `fn` jusqu'à `delayMs` sans nouvel appel : les appels rapprochés (frappe
 * clavier) sont fusionnés en un seul. `cancel()` abandonne un déclenchement en attente — utile au
 * démontage d'un composant ou quand une action immédiate (un select) prend le relais.
 */
export function debounce<Args extends unknown[]>(
	fn: (...args: Args) => void,
	delayMs: number
): ((...args: Args) => void) & { cancel: () => void } {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const run = (...args: Args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delayMs);
	};

	run.cancel = () => clearTimeout(timer);

	return run;
}

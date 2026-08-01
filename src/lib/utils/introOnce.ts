const played = new Set<string>();

/**
 * Vrai la première fois (par `key`) qu'une vue est montée côté client durant cette session d'app,
 * puis faux : une animation d'entrée ne rejoue pas quand on revient sur la page (navigation SPA ou
 * retour arrière). Au rendu serveur, toujours vrai — sans rien consommer, pour rester déterministe
 * et ne pas partager d'état entre requêtes.
 */
export function consumeIntroOnce(key: string, isBrowser: boolean): boolean {
	if (!isBrowser) return true;
	if (played.has(key)) return false;
	played.add(key);
	return true;
}

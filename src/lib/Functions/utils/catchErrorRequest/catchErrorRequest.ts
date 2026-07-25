type ErrorWithExtra = Error & {
	response?: unknown;
	request?: unknown;
	code?: unknown;
};

export function catchErrorRequest(error: unknown, context?: string): void {
	const contextMsg = context ? `[${context}] ` : '';

	if (error instanceof Error) {
		const err = error as ErrorWithExtra;
		console.error(`${contextMsg} Erreur:`, {
			name: err.name,
			message: err.message,
			stack: err.stack,
			...(typeof err.response === 'object' && err.response !== null
				? { response: err.response }
				: {}),
			...(typeof err.request === 'object' && err.request !== null ? { request: err.request } : {}),
			...(typeof err.code !== 'undefined' ? { code: err.code } : {})
		});
	} else if (typeof error === 'object' && error !== null) {
		console.error(`${contextMsg} Erreur objet:`, JSON.stringify(error, null, 2));
	} else {
		console.error(`${contextMsg} Erreur inconnue:`, error);
	}
}

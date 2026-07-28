export type NcStatus = 'en_cours' | 'quarantaine';

export type NcRow = {
	id: string;
	type: string;
	lot: string;
	statut: NcStatus;
};

export type QuarantineLot = {
	/** Identifiant technique — lien vers la fiche et formulaire de levée. Jamais affiché (#81). */
	id: string;
	/** Le numéro lu sur l'étiquette : c'est ce que voit l'opérateur. */
	numero: string;
	detail: string;
};

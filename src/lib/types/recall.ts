export type RecallStatus = 'en_cours' | 'cloture';

export type Recall = {
	id: string;
	produit: string;
	statut: RecallStatus;
	lots: string;
	sites: string;
	progressLabel: string;
	progress: number;
	etape: string;
	etapeTitre: string;
	etapeDetail: string;
};

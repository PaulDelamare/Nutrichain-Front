export type SyncState = 'ok' | 'latence';

export type Connector = {
	name: string;
	statut: SyncState;
	lines: string[];
};

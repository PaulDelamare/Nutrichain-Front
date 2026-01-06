export interface User {
	id: string;
	firstname: string;
	lastname: string;
	email: string;
	createdAt?: Date;
	updatedAt?: Date;
	error?: string;
	firstLogin?: boolean;
}
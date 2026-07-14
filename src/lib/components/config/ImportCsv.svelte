<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ImportReport } from '$lib/Api/connectors.server';

	type Props = {
		/** Action SvelteKit, ex. `?/importProducts`. */
		action: string;
		/** Colonnes attendues, affichées en aide. */
		columns: string;
		/** Rapport de cet import (null si pas encore lancé ou autre import). */
		report: ImportReport | null;
		/** Message d'erreur de cet import (null sinon). */
		error: string | null;
		envoi: boolean;
		pendant: () => (o: { update: () => Promise<void> }) => Promise<void>;
	};

	let { action, columns, report, error, envoi, pendant }: Props = $props();

	const lignesEnErreur = $derived(report ? report.results.filter((r) => r.status === 'error') : []);
</script>

<form method="POST" {action} enctype="multipart/form-data" class="import" use:enhance={pendant}>
	<label class="file">
		<span>Importer un CSV</span>
		<input type="file" name="file" accept=".csv,text/csv" required />
	</label>
	<button type="submit" disabled={envoi}>Importer</button>
	<p class="cols">Colonnes attendues : {columns}</p>
</form>

{#if error}
	<p class="error" role="alert">{error}</p>
{/if}

{#if report}
	<p class="summary" class:has-errors={report.errors > 0}>
		{report.created} créé(s), {report.updated} mis à jour, {report.errors} en erreur (sur {report.total}).
	</p>
	{#if lignesEnErreur.length > 0}
		<ul class="errors">
			{#each lignesEnErreur as r (r.line)}
				<li>Ligne {r.line} : {r.message}</li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.import {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px dashed #e2e8f0;
	}

	.file {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1 1 12rem;
	}

	.file span {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--nc-text-muted);
	}

	input[type='file'] {
		font-size: 0.8125rem;
	}

	button {
		padding: 0.45rem 0.9rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark, #1b6b5c);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.cols {
		flex-basis: 100%;
		margin: 0;
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
	}

	.summary {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--nc-brand-dark);
	}

	.summary.has-errors {
		color: #92400e;
	}

	.error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #991b1b;
	}

	.errors {
		margin: 0.35rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		color: #991b1b;
	}
</style>

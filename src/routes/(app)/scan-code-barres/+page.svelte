<script lang="ts">
	import PageHead from '$lib/components/page/PageHead.svelte';
	import BarcodeScanner from '$lib/components/scan/BarcodeScanner.svelte';
	import StatusBadge from '$lib/components/lots/StatusBadge.svelte';
	import type { LotRow } from '$lib/types/lot';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let manual = $state('');
	let scanned = $state<string | null>(null);

	function normalize(value: string): string {
		return value.trim().toLowerCase();
	}

	const matches = $derived.by<LotRow[]>(() => {
		const code = normalize(scanned ?? '');
		if (!code) return [];

		const byId = data.lots.filter((lot) => normalize(lot.id) === code);
		if (byId.length > 0) return byId;

		return data.lots.filter((lot) => normalize(lot.gtin) === code);
	});

	function submitManual(event: SubmitEvent) {
		event.preventDefault();
		if (manual.trim()) scanned = manual.trim();
	}

	function onDetect(code: string) {
		scanned = code;
		manual = code;
	}

	function reset() {
		scanned = null;
		manual = '';
	}
</script>

<PageHead
	heading="Scan de code-barres"
	description="Scannez un GTIN ou un identifiant de lot pour accéder instantanément à sa fiche."
/>

{#if data.error}
	<p class="warn">API indisponible — {data.error}</p>
{/if}

<div class="layout">
	<section class="panel">
		<h3>Caméra</h3>
		<BarcodeScanner ondetect={onDetect} />

		<form class="manual" onsubmit={submitManual}>
			<label for="code">Saisie manuelle</label>
			<div class="row">
				<input
					id="code"
					type="text"
					inputmode="numeric"
					placeholder="GTIN ou identifiant de lot"
					bind:value={manual}
					autocomplete="off"
				/>
				<button type="submit" class="btn">Rechercher</button>
			</div>
		</form>
	</section>

	<section class="panel">
		<div class="result-head">
			<h3>Résultat</h3>
			{#if scanned}
				<button type="button" class="link" onclick={reset}>Réinitialiser</button>
			{/if}
		</div>

		{#if !scanned}
			<p class="empty">Aucun code scanné pour le moment.</p>
		{:else}
			<p class="code">Code : <strong>{scanned}</strong></p>

			{#if matches.length === 0}
				<p class="empty">Aucun lot ne correspond à ce code dans votre organisation.</p>
			{:else}
				<ul class="hits">
					{#each matches as lot (lot.id)}
						<li class="hit">
							<div>
								<p class="hit-produit">{lot.produit}</p>
								<p class="hit-meta">Lot {lot.id} · GTIN {lot.gtin}</p>
							</div>
							<div class="hit-right">
								<StatusBadge statut={lot.statut} />
								<a class="btn" href="/fiche-lot/{encodeURIComponent(lot.id)}">Ouvrir la fiche</a>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</section>
</div>

<style>
	.warn {
		margin: 0 0 0.75rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fef9c3;
		color: #854d0e;
		font-size: 0.8125rem;
	}

	.layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.25rem;
	}

	.panel {
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.manual {
		margin-top: 1.25rem;
	}

	.manual label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.row {
		display: flex;
		gap: 0.5rem;
	}

	.row input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: var(--nc-text);
		background: #fff;
	}

	.row input:focus {
		outline: none;
		border-color: var(--nc-brand-border-focus);
		box-shadow: 0 0 0 3px var(--nc-brand-ring);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		white-space: nowrap;
	}

	.btn:hover {
		background: var(--nc-brand-hover);
	}

	.result-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.link {
		border: none;
		background: none;
		color: var(--nc-brand);
		font-size: 0.8125rem;
		cursor: pointer;
	}

	.empty {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.code {
		margin: 0 0 1rem;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.code strong {
		color: var(--nc-text);
	}

	.hits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.hit {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.hit-produit {
		margin: 0 0 0.15rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.hit-meta {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.hit-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
</style>

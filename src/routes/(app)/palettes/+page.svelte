<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import { badgeLot, grouperSscc } from '$lib/utils/palettes/affichage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHead
	heading="Palettes"
	description="Retrouver une palette par son SSCC et imprimer son étiquette"
/>

<form method="GET" class="recherche">
	<label class="champ">
		<span>SSCC de la palette</span>
		<input
			name="sscc"
			value={data.saisie}
			placeholder="18 chiffres, ou le code lu sur l’étiquette"
			autocomplete="off"
			inputmode="numeric"
		/>
	</label>
	<button type="submit">Rechercher</button>
</form>

{#if data.resultat.etat === 'invalide'}
	<p class="message erreur">
		« {data.resultat.saisie} » n’a pas la forme d’un SSCC. Attendu : 18 chiffres, ou 20 si la lecture
		a conservé le préfixe <code>00</code>.
	</p>
{:else if data.resultat.etat === 'erreur'}
	<p class="message erreur">{data.resultat.message}</p>
{:else if data.resultat.etat === 'trouvee'}
	{@const palette = data.resultat.palette}
	{@const emplacement = data.resultat.emplacement}
	<section class="palette">
		<header>
			<div>
				<h2>{grouperSscc(palette.sscc)}</h2>
				<p class="meta">
					{palette.lots.length} lot{palette.lots.length > 1 ? 's' : ''}
					{#if palette.positions_divergentes}
						· <span class="divergent">emplacements divergents</span>
					{:else if palette.id_materiel}
						· rangée{emplacement ? ` dans ${emplacement}` : ''}
					{:else}
						· pas encore rangée
					{/if}
				</p>
			</div>
			<a
				class="imprimer"
				href={resolve('/(app)/palettes/[id]/label', { id: palette.id })}
				target="_blank"
				rel="noopener"
			>
				Imprimer l’étiquette
			</a>
		</header>

		{#if palette.contient_lot_rappele}
			<p class="message rappel">
				Cette palette porte un lot sous rappel. Elle ne doit pas être expédiée.
			</p>
		{/if}

		{#if palette.lots.length === 0}
			<p class="message">Cette palette ne porte plus aucun lot.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Produit</th>
						<th>Numéro de lot</th>
						<th>Quantité</th>
						<th>État</th>
					</tr>
				</thead>
				<tbody>
					{#each palette.lots as lot (lot.id)}
						<tr>
							<td>{lot.produit}</td>
							<td class="mono">{lot.numero_lot}</td>
							<td>{lot.quantite} {lot.unite}</td>
							<td>
								<span class="badge" style="--couleur: {badgeLot(lot.statut).couleur}">
									{badgeLot(lot.statut).label}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
{/if}

<style>
	.recherche {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		margin-bottom: 1.25rem;
	}
	.champ {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
		max-width: 28rem;
	}
	.champ span {
		font-size: 0.8rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	input {
		padding: 0.6rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
	}
	button,
	.imprimer {
		padding: 0.6rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #0d9488;
		color: #fff;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
	}
	.palette {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1.25rem;
	}
	.palette header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	h2 {
		margin: 0;
		font-size: 1.35rem;
		font-variant-numeric: tabular-nums;
	}
	.meta {
		margin: 0.25rem 0 0;
		color: #6b7280;
		font-size: 0.9rem;
	}
	.divergent {
		color: #b45309;
		font-weight: 600;
	}
	.message {
		margin: 1rem 0 0;
		color: #4b5563;
	}
	.message.erreur {
		color: #b91c1c;
	}
	.message.rappel {
		background: #fee2e2;
		color: #b91c1c;
		font-weight: 600;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.6rem 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}
	th {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #6b7280;
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}
	.badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		/* La couleur vient de la source unique du front, pas d une palette locale. */
		background: color-mix(in srgb, var(--couleur) 18%, white);
		color: var(--couleur);
	}
</style>

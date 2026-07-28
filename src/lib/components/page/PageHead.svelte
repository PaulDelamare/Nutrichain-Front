<script lang="ts">
	type Props = {
		heading: string;
		description?: string;
	};

	let { heading, description }: Props = $props();
</script>

<!--
	Le titre de l'onglet est composé ici, pas écran par écran : l'intitulé est déjà passé au
	composant, le répéter dans chaque page, c'est vingt occasions de le laisser diverger. Avant, il
	n'y en avait aucun (#81) — trois onglets ouverts en démonstration étaient indiscernables.
-->
<svelte:head>
	<title>{heading} — NutriChain</title>
</svelte:head>

<header class="page-head">
	<h2>{heading}</h2>
	{#if description}
		<p>{description}</p>
	{/if}
</header>

<style>
	.page-head {
		margin-bottom: 1.25rem;
	}

	.page-head h2 {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.page-head p {
		margin: 0.35rem 0 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}
</style>

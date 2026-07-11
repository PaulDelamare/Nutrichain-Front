<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	type Props = {
		variant: 'info' | 'warn';
		text: string;
		link?: { href: Pathname; label: string };
	};

	let { variant, text, link }: Props = $props();

	// resolve() n'accepte qu'un littéral de route : on rétrécit l'union Pathname via « as '/' »
</script>

<div class="alert" class:info={variant === 'info'} class:warn={variant === 'warn'}>
	<p>
		{text}
		{#if link}
			— <a href={resolve(link.href as '/')}>{link.label}</a>
		{/if}
	</p>
</div>

<style>
	.alert {
		padding: 0.875rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.45;
	}

	.alert p {
		margin: 0;
	}

	.info {
		background: #e0f2fe;
		color: #0c4a6e;
	}

	.warn {
		background: #fef9c3;
		color: #713f12;
	}

	.alert a {
		color: inherit;
		font-weight: 600;
	}
</style>

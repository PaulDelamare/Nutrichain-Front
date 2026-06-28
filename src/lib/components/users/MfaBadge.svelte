<script lang="ts">
	type Props = {
		enabled: boolean;
	};

	let { enabled }: Props = $props();
</script>

{#if enabled}
	<span class="badge">Oui</span>
{:else}
	<span class="badge off">Non</span>
{/if}

<style>
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: #dcfce7;
		color: var(--nc-brand-dark);
	}

	.off {
		background: #f1f5f9;
		color: var(--nc-text-muted);
	}
</style>

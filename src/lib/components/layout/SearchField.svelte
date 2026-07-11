<script lang="ts">
	type Props = {
		placeholder?: string;
		value?: string;
		disabled?: boolean;
	};

	let {
		placeholder = 'Rechercher sur cette page…',
		value = $bindable(''),
		disabled = false
	}: Props = $props();
</script>

<div class="search global-search" class:disabled role="search">
	<svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
		<path d="M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	</svg>
	<input
		type="search"
		class="search-input"
		{placeholder}
		bind:value
		{disabled}
		aria-label="Recherche dans la page courante"
	/>
</div>

<style>
	.search {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: min(36rem, 100%);
		min-width: 0;
		height: 2rem;
		max-height: 2rem;
		margin: 0;
		padding: 0 0.875rem;
		border: 1px solid #e2e8f0;
		border-radius: 9999px;
		background: #f8fafc;
		color: var(--nc-text-muted);
	}

	.search-input {
		flex: 1;
		min-width: 0;
		width: 0;
		height: 1.25rem;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		font-size: 0.875rem;
		line-height: 1.25;
		color: var(--nc-text);
		outline: none;
		box-shadow: none;
		appearance: none;
		-webkit-appearance: none;
	}

	.search-input::placeholder {
		color: var(--nc-text-subtle);
	}

	.search.disabled {
		opacity: 0.65;
		background: #f1f5f9;
	}

	.search-input:disabled {
		cursor: not-allowed;
	}

	.search-icon {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
	}
</style>

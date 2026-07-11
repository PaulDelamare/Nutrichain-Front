<script lang="ts">
	// Combobox cherchable pour les listes qui grossissent (lots, produits…).
	// Remplace un <select> natif devenu ingérable : on tape pour filtrer.
	// Compatible form SSR : la valeur choisie part dans un <input type="hidden">.
	interface Option {
		value: string;
		label: string;
	}

	let {
		name,
		options,
		value = $bindable(''),
		placeholder = 'Sélectionner…',
		emptyText = 'Aucun résultat',
		onchange
	}: {
		name: string;
		options: Option[];
		value?: string;
		placeholder?: string;
		emptyText?: string;
		onchange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let root = $state<HTMLDivElement>();
	let filterInput = $state<HTMLInputElement>();

	const selected = $derived(options.find((o) => o.value === value) ?? null);
	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
	});

	function openList() {
		open = true;
		query = '';
		activeIndex = 0;
	}

	function close() {
		open = false;
		query = '';
	}

	function pick(opt: Option) {
		value = opt.value;
		close();
		onchange?.(opt.value);
	}

	function onFilterKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
			e.preventDefault();
		} else if (e.key === 'ArrowUp') {
			activeIndex = Math.max(activeIndex - 1, 0);
			e.preventDefault();
		} else if (e.key === 'Enter') {
			if (filtered[activeIndex]) pick(filtered[activeIndex]);
			e.preventDefault();
		} else if (e.key === 'Escape') {
			close();
		}
	}

	// Focus le champ de filtre à l'ouverture + ferme au clic extérieur.
	$effect(() => {
		if (!open) return;
		filterInput?.focus();
		function onDocClick(e: MouseEvent) {
			if (root && !root.contains(e.target as Node)) close();
		}
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div class="search-select" bind:this={root}>
	<input type="hidden" {name} {value} />
	<button
		type="button"
		class="control"
		class:is-placeholder={!selected}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => (open ? close() : openList())}
	>
		<span class="label">{selected ? selected.label : placeholder}</span>
		<span class="chevron" aria-hidden="true">▾</span>
	</button>

	{#if open}
		<div class="panel">
			<input
				class="filter"
				type="text"
				bind:this={filterInput}
				bind:value={query}
				oninput={() => (activeIndex = 0)}
				onkeydown={onFilterKeydown}
				placeholder="Taper pour filtrer…"
			/>
			<ul role="listbox">
				{#each filtered as opt, i (opt.value)}
					<li>
						<button
							type="button"
							role="option"
							aria-selected={opt.value === value}
							class:active={i === activeIndex}
							onmouseenter={() => (activeIndex = i)}
							onclick={() => pick(opt)}
						>
							{opt.label}
						</button>
					</li>
				{:else}
					<li class="no-result">{emptyText}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.search-select {
		position: relative;
		width: 100%;
	}

	.control {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		font-size: 0.875rem;
		color: var(--nc-text);
		cursor: pointer;
		text-align: left;
	}

	.control:hover {
		border-color: #cbd5e1;
	}

	.control.is-placeholder .label {
		color: var(--nc-text-subtle);
	}

	.chevron {
		color: var(--nc-text-muted);
		font-size: 0.75rem;
	}

	.panel {
		position: absolute;
		z-index: 20;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
		overflow: hidden;
	}

	.filter {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 1px solid #f1f5f9;
		font-size: 0.875rem;
		outline: none;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0.25rem;
		max-height: 15rem;
		overflow-y: auto;
	}

	li button {
		display: block;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		font-size: 0.875rem;
		color: var(--nc-text);
		text-align: left;
		cursor: pointer;
	}

	li button.active {
		background: #f1f5f9;
	}

	li button[aria-selected='true'] {
		font-weight: 600;
		color: var(--nc-brand-dark);
	}

	.no-result {
		padding: 0.625rem;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}
</style>

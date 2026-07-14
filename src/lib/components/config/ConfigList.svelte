<script lang="ts">
	import { enhance } from '$app/forms';

	type Item = { id: string; title: string; subtitle: string; is_active: boolean };

	type Props = {
		items: Item[];
		/** Nom de l'action de bascule, ex. `?/toggleSupplier`. */
		toggleAction: string;
		emptyLabel: string;
		envoi: boolean;
		pendant: () => (o: { update: () => Promise<void> }) => Promise<void>;
	};

	let { items, toggleAction, emptyLabel, envoi, pendant }: Props = $props();
</script>

<ul>
	{#each items as item (item.id)}
		<li class:archived={!item.is_active}>
			<div>
				<span class="title">{item.title}</span>
				<span class="sub">{item.subtitle}</span>
				{#if !item.is_active}<span class="tag">Archivé</span>{/if}
			</div>
			<form method="POST" action={toggleAction} use:enhance={pendant}>
				<input type="hidden" name="id" value={item.id} />
				<input type="hidden" name="active" value={String(!item.is_active)} />
				<button type="submit" class="link" disabled={envoi}>
					{item.is_active ? 'Archiver' : 'Réactiver'}
				</button>
			</form>
		</li>
	{:else}
		<li class="empty">{emptyLabel}</li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	li:last-child {
		border-bottom: none;
	}

	li.archived .title {
		color: var(--nc-text-subtle);
		text-decoration: line-through;
	}

	.title {
		font-weight: 500;
		color: var(--nc-text);
	}

	.sub {
		margin-left: 0.5rem;
		font-size: 0.8125rem;
		color: var(--nc-text-subtle);
	}

	.tag {
		margin-left: 0.5rem;
		padding: 0.1rem 0.45rem;
		border-radius: 9999px;
		background: #f1f5f9;
		color: var(--nc-text-muted);
		font-size: 0.7rem;
	}

	.link {
		border: 0;
		background: none;
		padding: 0;
		color: var(--nc-text-muted);
		font-size: 0.8125rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.empty {
		justify-content: flex-start;
		color: var(--nc-text-subtle);
		font-size: 0.875rem;
	}
</style>

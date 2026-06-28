<script lang="ts">
	type Props = {
		message?: string;
	};

	let { message = 'Contenu à venir.' }: Props = $props();
</script>

<div class="placeholder">
	<p>{message}</p>
</div>

<style>
	.placeholder {
		padding: 3rem 1.5rem;
		border: 1px dashed #cbd5e1;
		border-radius: 0.5rem;
		background: #fff;
		text-align: center;
	}

	.placeholder p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-subtle);
	}
</style>

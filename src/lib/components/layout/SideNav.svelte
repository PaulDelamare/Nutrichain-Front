<script lang="ts">
	import { page } from '$app/stores';
	import { APP_FOOTER, APP_NAME, APP_TAGLINE } from '$lib/config/app';
	import { navGroups } from '$lib/config/nav';

	type Props = {
		collapsed?: boolean;
		onMenuToggle?: () => void;
	};

	let { collapsed = false, onMenuToggle }: Props = $props();

	function isActive(href: string, pathname: string): boolean {
		if (href === '/recherche-lots' && pathname.startsWith('/fiche-lot/')) {
			return true;
		}
		return pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

<aside class="sidenav" class:collapsed aria-hidden={collapsed}>
	<div class="sidenav-inner">
		<div class="sidenav-brand">
			<div class="brand-main">
				<div class="logo" aria-hidden="true">N</div>
				<div class="brand-text">
					<span class="brand-name">{APP_NAME}</span>
					<span class="brand-tag">{APP_TAGLINE}</span>
				</div>
			</div>
			<button
				type="button"
				class="collapse-btn"
				onclick={onMenuToggle}
				aria-label="Masquer le menu"
				aria-expanded={true}
			>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 6l-6 6 6 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>

		<nav class="sidenav-nav">
			{#each navGroups as group}
				<p class="group-label">{group.label}</p>
				<ul class="group-list">
					{#each group.items as item}
						<li>
							<a
								href={item.href}
								class="nav-link"
								class:active={isActive(item.href, $page.url.pathname)}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</nav>

		<div class="sidenav-foot">
			<p class="version">{APP_FOOTER}</p>
		</div>
	</div>
</aside>

<style>
	.sidenav {
		width: 15.5rem;
		height: 100%;
		flex-shrink: 0;
		overflow: hidden;
		transition: width var(--shell-duration, 0.28s) var(--shell-ease, cubic-bezier(0.4, 0, 0.2, 1));
	}

	.sidenav.collapsed {
		width: 0;
		pointer-events: none;
	}

	.sidenav-inner {
		display: flex;
		flex-direction: column;
		width: 15.5rem;
		height: 100%;
		background: #1a2332;
		color: #cbd5e1;
		transition: transform var(--shell-duration, 0.28s)
			var(--shell-ease, cubic-bezier(0.4, 0, 0.2, 1));
		will-change: transform;
	}

	.sidenav.collapsed .sidenav-inner {
		transform: translateX(-100%);
	}

	.sidenav-brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 0.75rem 1rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.brand-main {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
		flex: 1;
	}

	.collapse-btn {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.375rem;
		background: rgba(255, 255, 255, 0.04);
		color: #cbd5e1;
		cursor: pointer;
	}

	.collapse-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f8fafc;
	}

	.collapse-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.logo {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		background: var(--nc-brand);
		color: #fff;
		font-weight: 700;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.brand-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #f8fafc;
	}

	.brand-tag {
		font-size: 0.6875rem;
		color: var(--nc-text-subtle);
	}

	.sidenav-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 0.5rem 1rem;
	}

	.group-label {
		margin: 1rem 0.5rem 0.35rem;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--nc-text-subtle);
	}

	.group-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-link {
		display: block;
		margin: 0.125rem 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #cbd5e1;
		text-decoration: none;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #f8fafc;
	}

	.nav-link.active {
		background: var(--nc-brand-soft);
		color: var(--nc-brand-light);
	}

	.sidenav-foot {
		padding: 0.75rem 1rem 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.version {
		margin: 0;
		font-size: 0.625rem;
		line-height: 1.4;
		color: var(--nc-text-subtle);
	}
</style>

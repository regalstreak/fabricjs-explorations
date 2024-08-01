<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, util } from 'fabric';
	import type { GitHubMember } from '../types';
	import { MemberCard } from '$lib/MemberCard';
	import { MEMBERS } from '$lib/constants/members';

	let searchTerm = '';
	let members: GitHubMember[] = [];
	let canvas: Canvas;
	let isSidebarOpen = false;

	onMount(async () => {
		// Fetch members
		const response = await fetch('https://api.github.com/orgs/mozilla/members?page=1');
		if (response.ok) {
			members = await response.json();
		} else {
			members = MEMBERS;
		}

		// Initialize canvas
		canvas = new Canvas('memberCanvas', {
			width: window.innerWidth,
			height: window.innerHeight - 100
		});

		// Implement pan and zoom
		canvas.on('mouse:wheel', (opt) => {
			const delta = opt.e.deltaY;
			let zoom = canvas.getZoom();
			zoom *= 0.999 ** delta;
			if (zoom > 1.5) zoom = 1.5;
			if (zoom < 0.7) zoom = 0.7;
			canvas.setZoom(zoom);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		canvas.on('mouse:down', (opt) => {
			const evt = opt.e;
			if (evt.altKey === true) {
				canvas.isDragging = true;
				canvas.lastPosX = evt.clientX;
				canvas.lastPosY = evt.clientY;
			}
		});

		canvas.on('mouse:move', (opt) => {
			if (canvas.isDragging) {
				const e = opt.e;
				const vpt = canvas.viewportTransform;
				vpt[4] += e.clientX - canvas.lastPosX;
				vpt[5] += e.clientY - canvas.lastPosY;
				canvas.requestRenderAll();
				canvas.lastPosX = e.clientX;
				canvas.lastPosY = e.clientY;
			}
		});

		canvas.on('mouse:up', () => {
			canvas.setViewportTransform(canvas.viewportTransform);
			canvas.isDragging = false;
		});

		// Render initial member cards
		renderMemberCards();

		// Export cards
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if ((e.key === 's' || e.key === 'ß') && (e.metaKey || e.ctrlKey || e.altKey)) {
				e.preventDefault();
				exportCards();
			}
		});
	});

	function renderMemberCards() {
		if (!canvas) {
			return;
		}
		canvas.clear();
		const filteredMembers = members.filter((member) =>
			member.login.toLowerCase().includes(searchTerm.toLowerCase())
		);

		filteredMembers.forEach((member, index) => {
			const card = new MemberCard(member, {
				left: 10 + (index % 5) * 220,
				top: 10 + Math.floor(index / 5) * 120,
				opacity: 0
			});
			canvas.add(card);
			card.animate(
				{ opacity: 1 },
				{
					duration: 1000,
					onChange: canvas.requestRenderAll.bind(canvas),
					easing: util.ease.easeOutCubic
				}
			);
		});
	}

	function createSidebar() {
		const sidebar = document.createElement('div');
		sidebar.id = 'sidebar';
		sidebar.style.position = 'fixed';
		sidebar.style.right = '0';
		sidebar.style.top = '0';
		sidebar.style.bottom = '0';
		sidebar.style.width = '200px';
		sidebar.style.backgroundColor = '#f0f0f0';
		sidebar.style.overflowY = 'auto';
		return sidebar;
	}

	function exportCards() {
		const sidebar = document.getElementById('sidebar') ?? createSidebar();

		if (isSidebarOpen) {
			isSidebarOpen = false;
			sidebar.remove();

			return;
		}

		isSidebarOpen = true;

		const exportedCards = canvas.getObjects().map((obj, index) => {
			return {
				dataURL: obj.toDataURL(),
				name: `card_${index}.png`
			};
		});

		exportedCards.forEach((card) => {
			const img = document.createElement('img');
			img.src = card.dataURL;
			img.style.width = '100%';
			img.style.marginBottom = '10px';
			sidebar.appendChild(img);
		});

		document.body.appendChild(sidebar);
	}

	$: {
		searchTerm;
		renderMemberCards();
	}
</script>

<svelte:head>
	<title>Mozilla Member Viewer</title>
</svelte:head>

<main>
	<h1>Mozilla Organization Members</h1>
	<div>{searchTerm}</div>
	<input type="text" placeholder="Search members..." bind:value={searchTerm} />
	<canvas id="memberCanvas"></canvas>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	canvas {
		border: 1px solid #ccc;
	}
</style>

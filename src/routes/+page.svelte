<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, util } from 'fabric';
	import { MemberCard } from '$lib/MemberCard';
	import { MEMBERS } from '$lib/constants/members';
	import { fetchGithubOrgMembers, type GithubOrgMember } from '$lib/api';

	const GAP = 24;
	let searchTerm = '';
	let members: GithubOrgMember[] = [];
	let canvas: Canvas;
	let isSidebarOpen = false;
	let containerWidth: number;
	let containerHeight: number;

	$: columns = getColumnCount(containerWidth);
	$: cardWidth = getCardWidth(containerWidth, columns);
	$: cardHeight = cardWidth * 0.3;

	function getColumnCount(width: number): number {
		if (width >= 1200) return 4; // Laptop
		if (width >= 992) return 3; // Medium
		if (width >= 768) return 2; // Tablet
		return 1; // Mobile
	}

	function getCardWidth(width: number, cols: number): number {
		return (width - (cols + 1) * GAP) / cols;
	}

	onMount(async () => {
		// Fetch members
		members = await fetchGithubOrgMembers('mozilla');

		// Initialize canvas
		initialiseCanvas();

		// Render initial member cards
		renderMemberCards();

		// Handle window resize
		window.addEventListener('resize', handleResize);

		// Export cards
		window.addEventListener('keydown', (e: KeyboardEvent) => {
			if ((e.key === 's' || e.key === 'ß') && (e.metaKey || e.ctrlKey || e.altKey)) {
				e.preventDefault();
				exportCards();
			}
		});
	});

	function initialiseCanvas() {
		// Initialize canvas
		const canvasContainer = document.getElementById('canvasContainer')!;
		containerWidth = canvasContainer.clientWidth;
		containerHeight = window.innerHeight - 150; // Adjust as needed

		canvas = new Canvas('memberCanvas', {
			width: containerWidth,
			height: containerHeight
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
	}

	function handleResize() {
		const canvasContainer = document.getElementById('canvasContainer')!;
		containerWidth = canvasContainer.clientWidth;
		containerHeight = window.innerHeight - 150; // Adjust as needed

		canvas.setDimensions({ width: containerWidth, height: containerHeight });
		renderMemberCards();
	}

	function renderMemberCards() {
		if (!canvas) {
			return;
		}
		canvas.clear();

		const filteredMembers = members.filter((member) =>
			member.login.toLowerCase().includes(searchTerm.toLowerCase())
		);

		filteredMembers.forEach((member, index) => {
			const col = index % columns;
			const row = Math.floor(index / columns);

			const card = new MemberCard(member, {
				left: GAP + col * (cardWidth + GAP),
				top: GAP + row * (cardHeight + GAP),
				width: cardWidth,
				height: cardHeight,
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
		sidebar.style.width = '300px';
		sidebar.style.backgroundColor = '#070510';
		sidebar.style.overflowY = 'auto';
		sidebar.style.padding = '24px';
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
		columns;
		cardWidth;
		cardHeight;
		renderMemberCards();
	}
</script>

<svelte:head>
	<title>Mozilla Member Viewer</title>
</svelte:head>

<main>
	<h1>Mozilla Organization Members</h1>
	<p id="instructions">
		Open profile: Alt/Cmd/Ctrl + Click
		<br />
		Pan: Hold Alt + Click and drag
		<br />
		Zoom: Scroll
		<br />
		Export: Alt/Cmd/Ctrl + S
		<br />
	</p>
	<input type="text" placeholder="Search members" bind:value={searchTerm} />
	<div id="canvasContainer">
		<canvas id="memberCanvas"></canvas>
	</div>
</main>

<style>
	:global(body) {
		background-color: #070510;
		color: #f8fafc;
		margin-top: 48px;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
	}

	main {
		text-align: center;
		padding: 0;
		margin: 0;
		max-width: 100%;
	}

	#canvasContainer {
		width: 100%;
		height: calc(100vh - 150px);
		overflow: hidden;
	}

	#instructions {
		position: absolute;
		left: 24px;
		top: 24px;
		text-align: left;
		font-size: 12px;
		color: gray;
	}

	input {
		outline: 0;
		padding: 8px;
		border: 1px solid #1e293b;
		border-radius: 4px;
		background-color: #070510;
		color: #f8fafc;
		width: 300px;
		max-width: 100%;
	}

	@media (max-width: 767px) {
		main {
			padding: 0 16px;
		}

		#canvasContainer {
			height: calc(100vh - 200px);
		}

		#instructions {
			display: none;
		}
	}
</style>

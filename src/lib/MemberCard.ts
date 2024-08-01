import { Rect, FabricImage, FabricText, Group, type GroupProps } from 'fabric';
import type { GitHubMember } from '../types';

export class MemberCard extends Group {
	githubMember: GitHubMember;
	private avatarPlaceholder: Rect;

	constructor(githubMember: GitHubMember, options: Partial<GroupProps>) {
		const rect = new Rect({
			width: 200,
			height: 100,
			fill: 'white',
			stroke: 'black',
			strokeWidth: 2
		});

		const name = new FabricText(githubMember.login, {
			left: 70,
			top: 10,
			fontSize: 16
		});

		const username = new FabricText(`@${githubMember.login}`, {
			left: 70,
			top: 30,
			fontSize: 14,
			fill: 'gray'
		});

		const avatarPlaceholder = new Rect({
			left: 10,
			top: 10,
			width: 50,
			height: 50,
			fill: 'lightgray'
		});

		super([rect, avatarPlaceholder, name, username], options);

		this.githubMember = githubMember;
		this.avatarPlaceholder = avatarPlaceholder;

		this.loadAvatar();

		this.on('mouseover', () => {
			if (this.canvas?.isDragging) return;

			rect.set('stroke', 'red');
			this.canvas?.requestRenderAll();
		});

		this.on('mouseout', () => {
			rect.set('stroke', 'black');

			this.canvas?.requestRenderAll();
		});

		this.on('mousedown', (option) => {
			if (this.canvas?.isDragging) return;

			if (option.e.altKey) {
				window.open(githubMember.html_url, '_blank');
			}
		});
	}

	private async loadAvatar() {
		try {
			const avatar = await FabricImage.fromURL(this.githubMember.avatar_url, {
				crossOrigin: 'anonymous'
			});

			avatar.set({
				left: this.aCoords.tl.x + 10,
				top: this.aCoords.tl.y + 10,
				width: 50,
				height: 50
			});

			this.remove(this.avatarPlaceholder);
			this.add(avatar);

			this.canvas?.requestRenderAll();
		} catch (error) {
			console.error('Failed to load avatar:', error);
		}
	}
}

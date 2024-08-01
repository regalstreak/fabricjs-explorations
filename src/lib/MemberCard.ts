import {
	Rect,
	FabricImage,
	FabricText,
	Group,
	type GroupProps,
	FabricObject,
	Shadow
} from 'fabric';
import type { GithubOrgMember } from './api';

function sanitizeUrl(url: string): string {
	return url.replace(/^(https?:\/\/)?(www\.)?/, '');
}

const roundedCorners = (fabricObject: FabricObject, cornerRadius: number) => {
	return new Rect({
		width: fabricObject.width,
		height: fabricObject.height,
		rx: cornerRadius / fabricObject.scaleX,
		ry: cornerRadius / fabricObject.scaleY,
		left: -fabricObject.width / 2,
		top: -fabricObject.height / 2
	});
};

export class MemberCard extends Group {
	githubMember: GithubOrgMember;
	private avatarPlaceholder: Rect;
	private avatarImage: FabricImage | null = null;

	constructor(githubMember: GithubOrgMember, options: Partial<GroupProps>) {
		const { width = 200, height = 100 } = options;

		const rect = new Rect({
			width,
			height,
			fill: '#070510',
			stroke: '#1E293B',
			strokeWidth: 2,
			rx: 10,
			ry: 10,
			shadow: new Shadow({
				color: 'rgba(0,0,0,0.3)',
				offsetX: 2,
				offsetY: 2,
				blur: 10,
				affectStroke: true
			})
		});

		const name = new FabricText(githubMember.login, {
			left: width * 0.3,
			top: height * 0.23,
			fontSize: 20,
			width: width * 0.6,
			fill: '#F8FAFC'
		});

		const htmlUrl = new FabricText(sanitizeUrl(githubMember.html_url), {
			left: width * 0.3,
			top: height * 0.55,
			fontSize: Math.min(14, width * 0.07),
			fill: '#F8FAFC',
			width: width * 0.6
		});

		const avatarSize = Math.min(width - 30, height - 30);
		const avatarPlaceholder = new Rect({
			left: width * 0.05,
			top: (height - avatarSize) / 2,
			width: avatarSize,
			height: avatarSize,
			fill: 'gray'
		});

		super([rect, avatarPlaceholder, name, htmlUrl], options);

		this.githubMember = githubMember;
		this.avatarPlaceholder = avatarPlaceholder;

		this.loadAvatar(avatarSize);

		this.on('mouseover', () => {
			if (this.canvas?.isDragging) return;

			rect.set('stroke', '#c95693');
			this.canvas?.requestRenderAll();
		});

		this.on('mouseout', () => {
			rect.set('stroke', '#1E293B');

			this.canvas?.requestRenderAll();
		});

		this.on('mousedown', (option) => {
			if (this.canvas?.isDragging) return;

			if (option.e.altKey || option.e.ctrlKey || option.e.metaKey) {
				window.open(githubMember.html_url, '_blank');
			}
		});
	}

	private async loadAvatar(size: number) {
		try {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = this.githubMember.avatar_url;

			img.onload = () => {
				this.avatarImage = new FabricImage(img, {
					left: this.aCoords.tl.x + this.width * 0.05,
					// top: this.aCoords.tl.y + this.height * 0.1,
					top: this.aCoords.tl.y + (this.height - size) / 2,
					width: size,
					height: size
				});
				this.avatarImage.set('clipPath', roundedCorners(this.avatarImage, 400));

				this.remove(this.avatarPlaceholder);
				this.add(this.avatarImage);

				if (this.canvas) {
					this.canvas.requestRenderAll();
				}
			};
		} catch (error) {
			console.error('Failed to load avatar:', error);
		}
	}
}

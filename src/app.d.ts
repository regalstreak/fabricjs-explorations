// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Add Fabric.js type extensions
declare module 'fabric' {
	interface Canvas {
		isDragging?: boolean;
		lastPosX?: number;
		lastPosY?: number;
	}
}

export {};

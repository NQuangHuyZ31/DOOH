import { registerRoutes } from './registry';
import type { AppRoute } from './types';

interface ViteImportMeta {
	glob?: (
		patterns: string[],
		options: { eager: boolean }
	) => Record<string, { default?: AppRoute | AppRoute[] }>;
}

let initialized = false;

/**
 * Under Vite HMR dev mode, auto-discover module route definitions.
 * Under Laravel Mix / Webpack, each module registers its own routes via its own entry script.
 */
export function initRouteRegistry(): void {
	if (initialized) return;
	initialized = true;

	try {
		if (
			typeof import.meta !== 'undefined' &&
			typeof (import.meta as unknown as ViteImportMeta).glob === 'function'
		) {
			const modules = (import.meta as unknown as Required<ViteImportMeta>).glob(
				['/modules/**/resources/js/routes/route.{ts,tsx}'],
				{ eager: true }
			);

			for (const path in modules) {
				const mod = modules[path];
				if (mod && mod.default) {
					registerRoutes(mod.default);
				}
			}
		}
	} catch {
		// Ignore when not running inside Vite
	}
}

initRouteRegistry();

export default initRouteRegistry;

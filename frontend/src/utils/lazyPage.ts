import { lazy } from 'react';
import type { ComponentType } from 'react';

type PageModule = { default: ComponentType };

/**
 * Recovers once when an open tab references a code-split asset removed by a
 * newer deployment. A second failure is surfaced to the route error boundary.
 */
export function lazyPage(
  pageName: string,
  importer: () => Promise<PageModule>,
) {
  return lazy(async () => {
    const reloadKey = `vv:lazy-reload:${pageName}`;

    try {
      const pageModule = await importer();
      try {
        window.sessionStorage.removeItem(reloadKey);
      } catch {
        // Storage can be unavailable in privacy-restricted browsing contexts.
      }
      return pageModule;
    } catch (error) {
      try {
        if (!window.sessionStorage.getItem(reloadKey)) {
          window.sessionStorage.setItem(reloadKey, '1');
          window.location.reload();

          // Keep Suspense mounted while the browser starts the reload.
          return await new Promise<PageModule>(() => undefined);
        }

        window.sessionStorage.removeItem(reloadKey);
      } catch {
        // Storage may be unavailable; the error boundary still provides a
        // visible recovery action instead of leaving an empty page.
      }

      throw error;
    }
  });
}

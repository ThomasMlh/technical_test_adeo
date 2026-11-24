import { inject, type InjectionKey } from 'vue';
import type { CatalogApi } from './catalog-api';

/** Provided by main.ts; tests provide a fake instead. */
export const catalogApiKey: InjectionKey<CatalogApi> = Symbol('CatalogApi');

export function useCatalogApi(): CatalogApi {
  const api = inject(catalogApiKey);
  if (!api) throw new Error('No CatalogApi provided');
  return api;
}

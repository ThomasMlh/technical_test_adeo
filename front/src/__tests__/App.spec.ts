import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { catalogApiKey } from '../api/catalog-api-key';
import type { CatalogApi } from '../api/catalog-api';
import App from '../App.vue';
import { mountWithVuetify } from './mount-with-vuetify';
import { aProduct } from './products';

function fakeApi(overrides: Partial<CatalogApi> = {}): CatalogApi {
  return {
    countProducts: async () => 250,
    countReviews: async () => 1234,
    mostAppreciated: async () => [],
    lowestRated: async () => [],
    allProducts: async () => [],
    ...overrides,
  };
}

function mountApp(api: CatalogApi) {
  return mountWithVuetify(App, {
    global: { provide: { [catalogApiKey]: api } },
  });
}

describe('App', () => {
  it('renders the dashboard layout with its title', () => {
    const wrapper = mountApp(fakeApi());

    expect(wrapper.find('.v-application').exists()).toBe(true);
    expect(wrapper.text()).toContain('Product catalog');
  });

  it('shows the totals from the API', async () => {
    const wrapper = mountApp(fakeApi());

    await flushPromises();

    expect(wrapper.text()).toMatch(/Products\s*250/);
    expect(wrapper.text()).toMatch(/Reviews\s*1,234/);
  });

  it('tells when the totals cannot be loaded', async () => {
    const wrapper = mountApp(
      fakeApi({ countReviews: () => Promise.reject(new Error('down')) }),
    );

    await flushPromises();

    expect(wrapper.text()).toContain('Could not load the totals');
  });

  it('shows the most appreciated products', async () => {
    const wrapper = mountApp(
      fakeApi({
        mostAppreciated: async () => [
          { ...aProduct({ name: 'Drill' }), positiveReviewCount: 4 },
        ],
      }),
    );

    await flushPromises();

    expect(wrapper.get('[data-test="most-appreciated"]').text()).toContain(
      'Drill',
    );
  });

  it('shows the lowest-rated products', async () => {
    const wrapper = mountApp(
      fakeApi({
        lowestRated: async () => [
          aProduct({ name: 'Saw', averageRating: 1.5 }),
        ],
      }),
    );

    await flushPromises();

    expect(wrapper.get('[data-test="lowest-rated"]').text()).toContain('Saw');
  });

  it('tells when a ranking cannot be loaded, and still shows the rest', async () => {
    const wrapper = mountApp(
      fakeApi({ lowestRated: () => Promise.reject(new Error('down')) }),
    );

    await flushPromises();

    expect(wrapper.text()).toContain(
      'Could not load the lowest-rated products',
    );
    expect(wrapper.text()).toMatch(/Products\s*250/);
  });
});

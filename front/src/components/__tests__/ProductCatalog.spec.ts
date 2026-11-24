import { describe, expect, it } from 'vitest';
import { aProduct } from '../../__tests__/products';
import { mountWithVuetify } from '../../__tests__/mount-with-vuetify';
import ProductCatalog from '../ProductCatalog.vue';

const rowsOf = (wrapper: ReturnType<typeof mountWithVuetify>) =>
  wrapper
    .findAll('tbody tr')
    .map((row) => row.findAll('td').map((cell) => cell.text()));

describe('ProductCatalog', () => {
  it('shows one row per product, with its details', () => {
    const wrapper = mountWithVuetify(ProductCatalog, {
      props: {
        products: [
          aProduct({
            reference: '00000001',
            name: 'Drill',
            price: 1049.9,
            currency: 'EUR',
            stock: 12,
            reviewCount: 4,
            averageRating: 3.5,
          }),
        ],
      },
    });

    expect(wrapper.findAll('th').map((th) => th.text())).toEqual([
      'Reference',
      'Name',
      'Price',
      'Stock',
      'Reviews',
      'Average rating',
    ]);
    expect(rowsOf(wrapper)).toEqual([
      ['00000001', 'Drill', '1\u202f049,90\u00a0€', '12', '4', '3.50'],
    ]);
  });

  it('shows a dash for a product without any review', () => {
    const wrapper = mountWithVuetify(ProductCatalog, {
      props: { products: [aProduct({ reviewCount: 0, averageRating: null })] },
    });

    expect(rowsOf(wrapper)[0]?.[5]).toBe('—');
  });

  it('shows every product at once, without pagination', () => {
    const products = Array.from({ length: 150 }, (_, i) =>
      aProduct({ reference: String(i).padStart(8, '0') }),
    );

    const wrapper = mountWithVuetify(ProductCatalog, { props: { products } });

    expect(wrapper.findAll('tbody tr')).toHaveLength(150);
    expect(wrapper.find('.v-data-table-footer').exists()).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import type { ProductSummary } from '../../api/types';
import { aProduct } from '../../__tests__/products';
import { mountWithVuetify } from '../../__tests__/mount-with-vuetify';
import { VRating } from 'vuetify/components';
import ProductRanking from '../ProductRanking.vue';

function mountRanking(products: ProductSummary[]) {
  return mountWithVuetify(ProductRanking, {
    props: { products, emptyText: 'No product here' },
  });
}

describe('ProductRanking', () => {
  it('shows one card per product, in the given order', () => {
    const wrapper = mountRanking([
      aProduct({ reference: '00000001', name: 'Drill' }),
      aProduct({ reference: '00000002', name: 'Hammer' }),
    ]);

    const cards = wrapper.findAll('[data-test="ranked-product"]');
    expect(cards.map((card) => card.text())).toEqual([
      expect.stringMatching(/^Drill\s*Ref\. 00000001/),
      expect.stringMatching(/^Hammer\s*Ref\. 00000002/),
    ]);
  });

  it('gives the full name on hover, as long names are cut', () => {
    const wrapper = mountRanking([aProduct({ name: 'A very long name' })]);

    expect(wrapper.get('[title="A very long name"]').text()).toBe(
      'A very long name',
    );
  });

  it('shows the average rating as stars, followed by the number of reviews', () => {
    const wrapper = mountRanking([
      aProduct({ averageRating: 4.2, reviewCount: 8 }),
    ]);

    const card = wrapper.get('[data-test="ranked-product"]');
    const rating = card.get('[data-test="rating"]');
    expect(rating.findComponent(VRating).props('modelValue')).toBe(4.2);
    expect(rating.get('[data-test="review-count"]').text()).toBe('(8)');
  });

  it('reads the rating as a sentence to screen readers, and hides the stars from them', () => {
    const wrapper = mountRanking([
      aProduct({ averageRating: 4.2, reviewCount: 1 }),
    ]);

    const rating = wrapper.get('[data-test="rating"]');
    expect(rating.get('.d-sr-only').text()).toBe(
      'Average rating 4.20 out of 5, 1 review',
    );
    // inert: out of the keyboard order and of the accessibility tree
    expect(rating.get('.v-rating').attributes()).toHaveProperty('inert');
    expect(
      rating.get('[data-test="review-count"]').attributes('aria-hidden'),
    ).toBe('true');
  });

  it('writes the reference in the card text, not in the low-contrast subtitle', () => {
    const wrapper = mountRanking([aProduct({ reference: '00000001' })]);

    expect(wrapper.find('.v-card-subtitle').exists()).toBe(false);
    expect(wrapper.get('.v-card-text').text()).toMatch(/^Ref\. 00000001/);
  });

  it('tells when a product has no review, without stars', () => {
    const wrapper = mountRanking([
      aProduct({ averageRating: null, reviewCount: 0 }),
    ]);

    const card = wrapper.get('[data-test="ranked-product"]');
    expect(card.text()).toContain('No review yet');
    expect(card.find('.v-rating').exists()).toBe(false);
  });

  it('tells when there is no product', () => {
    const wrapper = mountRanking([]);

    expect(wrapper.find('[data-test="ranked-product"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('No product here');
  });
});

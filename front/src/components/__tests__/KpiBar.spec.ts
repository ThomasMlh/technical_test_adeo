import { describe, expect, it } from 'vitest';
import { mountWithVuetify } from '../../__tests__/mount-with-vuetify';
import KpiBar from '../KpiBar.vue';

describe('KpiBar', () => {
  it('shows the total number of products and of reviews', () => {
    const wrapper = mountWithVuetify(KpiBar, {
      props: { productCount: 250, reviewCount: 1234 },
    });

    const kpis = wrapper.findAll('[data-test="kpi"]').map((kpi) => kpi.text());
    expect(kpis).toEqual([
      expect.stringMatching(/Products\s*250/),
      expect.stringMatching(/Reviews\s*1,234/),
    ]);
  });
});

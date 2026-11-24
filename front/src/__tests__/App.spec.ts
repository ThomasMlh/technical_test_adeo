import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import vuetify from '../plugins/vuetify';
import App from '../App.vue';

describe('App', () => {
  it('renders the dashboard layout with its title', () => {
    const wrapper = mount(App, { global: { plugins: [vuetify] } });

    expect(wrapper.find('.v-application').exists()).toBe(true);
    expect(wrapper.text()).toContain('Product catalog');
  });
});

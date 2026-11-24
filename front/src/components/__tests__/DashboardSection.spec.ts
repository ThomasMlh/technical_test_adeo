import { describe, expect, it } from 'vitest';
import { mountWithVuetify } from '../../__tests__/mount-with-vuetify';
import DashboardSection from '../DashboardSection.vue';

function mountSection(props: { loading: boolean; error?: unknown }) {
  return mountWithVuetify(DashboardSection, {
    props: {
      title: 'Totals',
      errorMessage: 'Could not load the totals',
      ...props,
    },
    slots: { default: '<p class="content">Loaded content</p>' },
  });
}

describe('DashboardSection', () => {
  it('shows its title', () => {
    expect(mountSection({ loading: false }).text()).toContain('Totals');
  });

  it('shows a loader, not the content, while loading', () => {
    const wrapper = mountSection({ loading: true });

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true);
    expect(wrapper.find('.content').exists()).toBe(false);
  });

  it('shows the content once loaded', () => {
    const wrapper = mountSection({ loading: false });

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    expect(wrapper.find('.content').text()).toBe('Loaded content');
  });

  it('shows the error message, not the content, when loading failed', () => {
    const wrapper = mountSection({ loading: false, error: new Error('down') });

    expect(wrapper.find('[role="alert"]').text()).toContain(
      'Could not load the totals',
    );
    expect(wrapper.find('.content').exists()).toBe(false);
  });
});

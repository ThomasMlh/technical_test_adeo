import { mount, type ComponentMountingOptions } from '@vue/test-utils';
import type { Component } from 'vue';
import vuetify from '../plugins/vuetify';

/** Mounts a component with Vuetify installed, as main.ts does. */
export function mountWithVuetify<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  return mount(component, {
    ...options,
    global: { ...options.global, plugins: [vuetify] },
  });
}

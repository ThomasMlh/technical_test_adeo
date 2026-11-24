import { createApp } from 'vue';
import App from './App.vue';
import { createCatalogApi } from './api/catalog-api';
import { catalogApiKey } from './api/catalog-api-key';
import vuetify from './plugins/vuetify';

createApp(App)
  .use(vuetify)
  .provide(catalogApiKey, createCatalogApi())
  .mount('#app');

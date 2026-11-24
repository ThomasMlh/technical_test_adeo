<script setup lang="ts">
import { reactive } from 'vue';
import { useCatalogApi } from './api/catalog-api-key';
import DashboardSection from './components/DashboardSection.vue';
import KpiBar from './components/KpiBar.vue';
import { useRequest } from './composables/useRequest';

const api = useCatalogApi();

const totals = reactive(
  useRequest(async () => {
    const [productCount, reviewCount] = await Promise.all([
      api.countProducts(),
      api.countReviews(),
    ]);
    return { productCount, reviewCount };
  }),
);
</script>

<template>
  <v-app>
    <v-app-bar title="Product catalog" />
    <v-main>
      <v-container>
        <DashboardSection
          title="Overview"
          :loading="totals.loading"
          :error="totals.error"
          error-message="Could not load the totals."
        >
          <KpiBar v-if="totals.data" v-bind="totals.data" />
        </DashboardSection>
      </v-container>
    </v-main>
  </v-app>
</template>

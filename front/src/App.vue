<script setup lang="ts">
import { reactive } from 'vue';
import { useCatalogApi } from './api/catalog-api-key';
import DashboardSection from './components/DashboardSection.vue';
import KpiBar from './components/KpiBar.vue';
import ProductCatalog from './components/ProductCatalog.vue';
import ProductRanking from './components/ProductRanking.vue';
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

const mostAppreciated = reactive(useRequest(() => api.mostAppreciated()));
const lowestRated = reactive(useRequest(() => api.lowestRated()));
const catalog = reactive(useRequest(() => api.allProducts()));
</script>

<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title tag="h1">Product catalog</v-app-bar-title>
    </v-app-bar>
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

        <DashboardSection
          title="Most appreciated products"
          :loading="mostAppreciated.loading"
          :error="mostAppreciated.error"
          error-message="Could not load the most appreciated products."
          data-test="most-appreciated"
        >
          <ProductRanking
            :products="mostAppreciated.data ?? []"
            empty-text="No product has a positive review yet."
          />
        </DashboardSection>

        <DashboardSection
          title="Lowest-rated products"
          :loading="lowestRated.loading"
          :error="lowestRated.error"
          error-message="Could not load the lowest-rated products."
          data-test="lowest-rated"
        >
          <ProductRanking
            :products="lowestRated.data ?? []"
            empty-text="No product has an average rating below 3."
          />
        </DashboardSection>

        <DashboardSection
          title="Catalog"
          :loading="catalog.loading"
          :error="catalog.error"
          error-message="Could not load the catalog."
          data-test="catalog"
        >
          <ProductCatalog :products="catalog.data ?? []" />
        </DashboardSection>
      </v-container>
    </v-main>
  </v-app>
</template>

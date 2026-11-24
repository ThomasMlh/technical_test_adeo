<script setup lang="ts">
import type { ProductSummary } from '../api/types';

/** Every product of the catalog in one table: no filter, no pagination. */
defineProps<{ products: readonly ProductSummary[] }>();

const headers = [
  { title: 'Reference', key: 'reference' },
  { title: 'Name', key: 'name' },
  { title: 'Price', key: 'price', align: 'end' },
  { title: 'Stock', key: 'stock', align: 'end' },
  { title: 'Reviews', key: 'reviewCount', align: 'end' },
  { title: 'Average rating', key: 'averageRating', align: 'end' },
] as const;

// Prices are in euros, written as in French: `1 049,90 €`.
const formatPrice = (product: ProductSummary) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: product.currency,
  }).format(product.price);
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="products"
    item-value="reference"
    :items-per-page="-1"
    hide-default-footer
    fixed-header
    height="600"
    density="comfortable"
  >
    <template #[`item.price`]="{ item }">{{ formatPrice(item) }}</template>
    <template #[`item.averageRating`]="{ item }">
      {{ item.averageRating?.toFixed(2) ?? '—' }}
    </template>
  </v-data-table>
</template>

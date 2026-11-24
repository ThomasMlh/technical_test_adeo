<script setup lang="ts" generic="T extends ProductSummary">
import type { ProductSummary } from '../api/types';

/** A grid of ranked product cards, best rank first. */
defineProps<{
  products: readonly T[];
  emptyText: string;
}>();

const reviews = (count: number) => `${count} review${count === 1 ? '' : 's'}`;
</script>

<template>
  <v-row v-if="products.length > 0">
    <v-col
      v-for="product in products"
      :key="product.reference"
      cols="12"
      sm="6"
      lg
    >
      <v-card data-test="ranked-product" class="h-100">
        <template #title>
          <span :title="product.name">{{ product.name }}</span>
        </template>
        <!-- Not a subtitle: its default color fails the WCAG contrast ratio. -->
        <v-card-text>
          <div>Ref. {{ product.reference }}</div>
          <div
            v-if="product.averageRating !== null"
            data-test="rating"
            class="d-flex align-center ga-1"
          >
            <!-- The stars are made of radio buttons: screen readers and the
                 keyboard get the sentence below instead. -->
            <v-rating
              :model-value="product.averageRating"
              density="compact"
              size="small"
              half-increments
              readonly
              inert
            />
            <span data-test="review-count" aria-hidden="true"
              >({{ product.reviewCount }})</span
            >
            <span class="d-sr-only">
              Average rating {{ product.averageRating.toFixed(2) }} out of 5,
              {{ reviews(product.reviewCount) }}
            </span>
          </div>
          <div v-else>No review yet</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-card v-else :text="emptyText" />
</template>

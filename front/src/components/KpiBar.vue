<script setup lang="ts">
const props = defineProps<{ productCount: number; reviewCount: number }>();

const kpis = [
  { label: 'Products', value: props.productCount, icon: 'mdi-package-variant' },
  { label: 'Reviews', value: props.reviewCount, icon: 'mdi-comment-text' },
];
</script>

<template>
  <v-row>
    <v-col v-for="kpi in kpis" :key="kpi.label" cols="12" sm="6">
      <v-card data-test="kpi">
        <v-card-text class="d-flex align-center ga-4">
          <v-icon :icon="kpi.icon" size="40" />
          <div>
            <div class="text-body-large">{{ kpi.label }}</div>
            <div class="text-headline-medium font-weight-bold">
              {{ kpi.value.toLocaleString('en-US') }}
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

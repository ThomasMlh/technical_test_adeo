<script setup lang="ts">
/** A titled block of the dashboard: a loader, an error, or its content. */
defineProps<{
  title: string;
  loading: boolean;
  error?: unknown;
  errorMessage: string;
}>();
</script>

<template>
  <section class="mb-8">
    <h2 class="text-title-large mb-3">{{ title }}</h2>
    <v-progress-linear v-if="loading" indeterminate />
    <v-alert v-else-if="error" type="error" variant="tonal">
      {{ errorMessage }}
    </v-alert>
    <slot v-else />
  </section>
</template>

import { readonly, ref, shallowRef } from 'vue';

/** Starts a request at once and tracks its result for the template. */
export function useRequest<T>(request: () => Promise<T>) {
  const data = shallowRef<T>();
  const error = shallowRef<unknown>();
  const loading = ref(true);

  request()
    .then(
      (result) => (data.value = result),
      (failure: unknown) => (error.value = failure),
    )
    .finally(() => (loading.value = false));

  return {
    data: readonly(data),
    error: readonly(error),
    loading: readonly(loading),
  };
}

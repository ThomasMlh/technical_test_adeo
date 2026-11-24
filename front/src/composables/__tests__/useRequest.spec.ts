import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useRequest } from '../useRequest';

describe('useRequest', () => {
  it('is loading until the request settles', () => {
    const { loading, data, error } = useRequest(() => new Promise(() => {}));

    expect(loading.value).toBe(true);
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
  });

  it('exposes the data once the request succeeds', async () => {
    const { loading, data, error } = useRequest(async () => [1, 2]);

    await flushPromises();

    expect(loading.value).toBe(false);
    expect(data.value).toEqual([1, 2]);
    expect(error.value).toBeUndefined();
  });

  it('exposes the error when the request fails', async () => {
    const failure = new Error('API down');
    const { loading, data, error } = useRequest(() => Promise.reject(failure));

    await flushPromises();

    expect(loading.value).toBe(false);
    expect(data.value).toBeUndefined();
    expect(error.value).toBe(failure);
  });
});

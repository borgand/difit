import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { Agent, setGlobalDispatcher } from 'undici';

// Disable keep-alive for tests to prevent ECONNRESET errors
// Use pipelining=0 instead of keepAlive=false for this version of undici
setGlobalDispatcher(new Agent({ pipelining: 0 }));

// Mock fetch globally for component tests, but not for server integration tests
if (!process.env.VITEST_SERVER_TEST) {
  global.fetch = vi.fn();
}

// Mock console.error to suppress error logs during tests
global.console.error = vi.fn();

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// happy-dom v20 has a proxy bug in its Storage implementation that causes
// localStorage.clear() to return undefined in the forks pool. Replace both
// localStorage and sessionStorage with a reliable in-memory implementation.
function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}
Object.defineProperty(window, 'localStorage', { value: createStorage(), configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: createStorage(), configurable: true });

// Global test utilities
export const mockFetch = (response: any, revisionsResponse?: any) => {
  (global.fetch as any).mockImplementation((url: string) => {
    // Handle /api/revisions endpoint
    if (url.includes('/api/revisions')) {
      return Promise.resolve({
        ok: revisionsResponse !== null,
        json: async () =>
          revisionsResponse ?? {
            specialOptions: [],
            branches: [],
            commits: [],
          },
      });
    }
    // Default: /api/diff and others
    return Promise.resolve({
      ok: true,
      json: async () => response,
      blob: async () => ({ size: 1024 }),
    });
  });
};

export const mockFetchError = (error: string) => {
  (global.fetch as any).mockRejectedValue(new Error(error));
};

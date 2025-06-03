declare module 'lru-cache' {
  interface LRUCacheOptions<K, V> {
    max?: number;
    maxAge?: number;
    length?: (value: V, key: K) => number;
    dispose?: (key: K, value: V) => void;
    stale?: boolean;
    updateAgeOnGet?: boolean;
  }

  class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    set(key: K, value: V): boolean;
    get(key: K): V | undefined;
    peek(key: K): V | undefined;
    del(key: K): void;
    reset(): void;
    has(key: K): boolean;
    forEach(callback: (value: V, key: K, cache: LRUCache<K, V>) => void): void;
    keys(): K[];
    values(): V[];
    length: number;
    itemCount: number;
  }

  export = LRUCache;
} 
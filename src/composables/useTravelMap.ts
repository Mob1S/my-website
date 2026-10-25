import { computed, onBeforeUnmount, shallowRef, ref } from 'vue';
import { readContent } from '../services/content';
import type { MapGeometry } from '../types/home';

export function useTravelMap() {
  const geometry = shallowRef<MapGeometry>();
  const cities = shallowRef<Record<string, unknown>>({});
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const controller = new AbortController();
  const visited = computed(() => new Set(Object.keys(cities.value).map(key => Number(key.split('_')[0]))));
  async function load() {
    if (status.value === 'loading' || status.value === 'ready') return;
    status.value = 'loading';
    try {
      const [map, content] = await Promise.all([
        import('../../map-data.js'), readContent<Record<string, unknown>>('traveled-cities', controller.signal),
      ]);
      if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('足迹数据格式错误');
      if (controller.signal.aborted) return;
      geometry.value = map as MapGeometry;
      cities.value = content;
      status.value = 'ready';
    } catch {
      if (!controller.signal.aborted) status.value = 'error';
    }
  }
  onBeforeUnmount(() => controller.abort());
  return { geometry, visited, status, load };
}
export type TravelMap = ReturnType<typeof useTravelMap>;

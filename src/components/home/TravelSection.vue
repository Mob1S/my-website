<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import type { TravelMap } from '../../composables/useTravelMap';
const props = defineProps<{ presentation: boolean; travel: TravelMap }>();
const container = ref<HTMLElement>();
const map = computed(() => props.travel.geometry.value);
const ready = computed(() => props.travel.status.value === 'ready');
const percent = computed(() => Math.round(props.travel.visited.value.size / 34 * 100));
let observer: IntersectionObserver | undefined;
onMounted(() => {
  if (props.presentation || !container.value) return;
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { void props.travel.load(); observer?.disconnect(); }
  }, { rootMargin: '300px' });
  observer.observe(container.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <section :id="presentation ? undefined : 'mymap'" class="section map-section">
    <div class="section-content">
      <div class="section-header"><span class="section-index">SECTOR 03</span><a href="purpose-map.html" class="section-title-link"><h2 class="section-title">MY<span class="title-accent">_MAP</span></h2></a><div class="header-ruler"></div></div>
      <p class="section-summary">走过的地方，留下的记忆。点击省份，继续探索。</p>
      <div class="map-layout">
        <div class="map-sidebar">
          <div class="tel-card"><div class="tel-card-header"><span class="tel-card-id">TRAVEL/TELEMETRY</span><span class="tel-card-status">EXPLORING</span></div>
            <div class="tel-card-body"><div class="tel-big-number">{{ ready ? travel.visited.value.size : '—' }}<span class="unit">/34</span></div><p class="map-stats-label">PROVINCES VISITED</p><div class="tel-bars"><div class="tel-bar"><span class="bar-label">覆盖</span><span class="bar-fill" :style="{ width: ready ? `${percent}%` : '0%' }"></span><span class="bar-val">{{ ready ? `${percent}%` : '—' }}</span></div></div></div>
          </div>
          <div class="map-legend"><div class="legend-item"><span class="legend-dot legend-visited"></span><span>已踏足</span></div><div class="legend-item"><span class="legend-dot legend-unvisited"></span><span>未踏足</span></div></div>
        </div>
        <div ref="container" :id="presentation ? undefined : 'mapContainer'" class="map-container" :aria-busy="travel.status.value === 'loading'">
          <svg v-if="map && ready" :id="presentation ? undefined : 'chinaMap'" :viewBox="map.MAP_VIEWBOX" role="group" aria-label="中国旅行足迹，选择省份查看详情">
            <a v-for="province in map.CHINA_PROVINCES" :key="province.adcode" :href="`map-detail.html?id=${province.adcode}`" :aria-label="province.name">
              <path :d="province.path" class="province-path" :class="{ visited: travel.visited.value.has(province.adcode) }" :data-adcode="province.adcode"><title>{{ province.shortName }}{{ travel.visited.value.has(province.adcode) ? ' · 足迹' : '' }}</title></path>
              <circle v-if="province.adcode === 810000 || province.adcode === 820000" :cx="province.labelX" :cy="province.labelY" r="5" class="province-dot" :class="{ visited: travel.visited.value.has(province.adcode) }" />
            </a>
            <path :d="map.NINE_DASH_PATH" class="nine-dash-line" />
            <g v-for="island in map.SOUTH_CHINA_SEA_ISLANDS" :key="island.name">
              <circle :cx="(island.center[0]! - 73) / 63 * 900" :cy="(54 - island.center[1]!) / 51 * 850" r="3" class="island-marker" />
              <text :x="(island.center[0]! - 73) / 63 * 900 + 6" :y="(54 - island.center[1]!) / 51 * 850 + 3" class="island-label">{{ island.name }}</text>
            </g>
            <rect :x="map.INSET_VIEWBOX.x" :y="map.INSET_VIEWBOX.y" :width="map.INSET_VIEWBOX.w" :height="map.INSET_VIEWBOX.h" class="inset-box" />
            <text :x="map.INSET_VIEWBOX.x + map.INSET_VIEWBOX.w / 2" :y="map.INSET_VIEWBOX.y + 14" class="inset-label">南海诸岛</text>
            <path :d="map.CHINA_PROVINCES.find(p => p.name === '海南省')?.insetPath" class="inset-hainan" />
            <path :d="map.NINE_DASH_INSET_PATH" class="nine-dash-line" />
          </svg>
          <div v-else class="map-placeholder" role="status">
            <template v-if="travel.status.value === 'error'"><p>足迹加载失败，请稍后重试。</p><button type="button" @click="travel.load">重新加载</button></template>
            <p v-else>正在加载旅行足迹…</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

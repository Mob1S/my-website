<script setup lang="ts">
import { inject, ref, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue';
import { trackPath } from '../../data/track';
const props = defineProps<{ presentation: boolean }>();
const suspended = inject<Ref<boolean>>('maskSuspended')!;
const svg = ref<SVGSVGElement>(), path = ref<SVGPathElement>(), closeButton = ref<HTMLButtonElement>();
const hits = ref(0), hintFaded = ref(false), open = ref(false);
let points: { x: number; y: number }[] = [], samples: { x: number; y: number }[] = [];
let timer: ReturnType<typeof setTimeout> | undefined, previousFocus: HTMLElement | null = null;
let hero: HTMLElement | null = null;
function move(event: PointerEvent) {
  if (open.value || hits.value === 8 || !svg.value) return;
  const matrix = svg.value.getScreenCTM(); if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  if (!samples.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 30)) { hits.value = 0; return; }
  hintFaded.value = true;
  const next = points[hits.value];
  if (next && Math.hypot(next.x - point.x, next.y - point.y) < 22) hits.value++;
  if (hits.value === 8) timer = setTimeout(async () => {
    previousFocus = document.activeElement as HTMLElement;
    suspended.value = true; open.value = true;
    await nextTick(); closeButton.value?.focus();
  }, 300);
}
function close() { open.value = false; suspended.value = false; hits.value = 0; previousFocus?.focus(); }
function leave() { if (hits.value < 8) hits.value = 0; }
function keyboard(event: KeyboardEvent) {
  if (!open.value) return;
  if (event.key === 'Escape') close();
  if (event.key === 'Tab') { event.preventDefault(); closeButton.value?.focus(); }
}
onMounted(() => {
  if (props.presentation || !path.value) return;
  const length = path.value.getTotalLength();
  points = Array.from({ length: 8 }, (_, i) => path.value!.getPointAtLength(length / 8 * i));
  for (let d = 0; d <= length; d += 30) samples.push(path.value.getPointAtLength(d));
  hero = svg.value?.closest('section') || null;
  hero?.addEventListener('pointermove', move); hero?.addEventListener('pointerleave', leave);
  window.addEventListener('keydown', keyboard);
});
onBeforeUnmount(() => { clearTimeout(timer); hero?.removeEventListener('pointermove', move); hero?.removeEventListener('pointerleave', leave); window.removeEventListener('keydown', keyboard); if (!props.presentation) suspended.value = false; });
</script>
<template>
  <svg ref="svg" class="monza-track" viewBox="0 0 800 600" fill="none" aria-hidden="true"><path :d="trackPath" stroke="var(--neon)" stroke-width="30" opacity="0.04" /><path :d="trackPath" stroke="var(--neon)" stroke-width="1.5" stroke-dasharray="12,8" opacity="0.30" /><path v-if="!presentation" ref="path" :d="trackPath" class="track-detect" stroke="transparent" stroke-width="22" /></svg>
  <template v-if="!presentation"><div class="track-egg-hint" :class="{ faded: hintFaded }">跑出你的杆位速度吧</div><div class="track-egg-dots" aria-hidden="true"><div v-for="i in 8" :key="i" class="track-egg-dot" :class="{ hit: i <= hits }"></div></div></template>
  <Teleport to="body"><div v-if="open" class="track-egg-modal-overlay active" @click.self="close"><div class="track-egg-modal" role="dialog" aria-modal="true" aria-labelledby="egg-title"><button ref="closeButton" class="track-egg-modal-close" aria-label="关闭彩蛋" @click="close">×</button><span class="egg-emoji">🏆</span><h3 id="egg-title">🏆 恭喜你发现了隐藏彩蛋！</h3><p>这条赛道承载着速度与激情，<br>而你用鼠标征服了它！<br>你是真正的维斯塔潘！<br><br>Du~du~du~du! 👑</p></div></div></Teleport>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
const props = defineProps<{ reduced: boolean }>();
const emit = defineEmits<{ fps: [value: number | string] }>();
const canvas = ref<HTMLCanvasElement>();
let dispose: (() => void) | undefined, disposed = false, generation = 0;
async function start() {
  const current = ++generation;
  dispose?.(); dispose = undefined;
  emit('fps', '—');
  if (props.reduced || disposed) return;
  // Recreate the canvas after a motion toggle: a disposed WebGL context is lost.
  await nextTick();
  try {
    const { startParticles } = await import('../../effects/particles.js');
    if (disposed || props.reduced || current !== generation || !canvas.value) return;
    dispose = startParticles(canvas.value, (fps: number) => emit('fps', fps));
  } catch (error) { console.warn('粒子效果未启动', error); }
}
onMounted(start); watch(() => props.reduced, start);
onBeforeUnmount(() => { disposed = true; generation++; dispose?.(); });
</script>
<template><canvas v-if="!reduced" ref="canvas" id="particle-canvas" aria-hidden="true"></canvas></template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, provide, ref } from 'vue';
import HomeContent from './components/home/HomeContent.vue';
import SectionNavigation from './components/layout/SectionNavigation.vue';
import TelemetryBar from './components/layout/TelemetryBar.vue';
import ParticleCanvas from './components/effects/ParticleCanvas.vue';
import { useTravelMap } from './composables/useTravelMap';
import { useChat } from './composables/useChat';
import { useRevealMask } from './composables/useRevealMask';
import { useSectionNavigation } from './composables/useSectionNavigation';
const top = ref<HTMLElement>(), bottom = ref<HTMLElement>();
const suspended = ref(false), fps = ref<number | string>('—');
const motion = matchMedia('(prefers-reduced-motion: reduce)'), reduced = ref(motion.matches);
provide('maskSuspended', suspended);
const travel = useTravelMap(), chat = useChat();
const { active, progress, time } = useSectionNavigation(top);
useRevealMask(top, bottom, suspended, reduced);
const changeMotion = () => { reduced.value = motion.matches; };
let disposed = false;
const animations: { cancel: () => void }[] = [];
onMounted(async () => {
  motion.addEventListener('change', changeMotion);
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }));
  if (!reduced.value) {
    try {
      const { animate } = await import('animejs');
      if (!disposed && !reduced.value) {
        document.querySelectorAll<HTMLElement>('.hero-eyebrow, .title-block, .hero-subtitle').forEach(el => animations.push(animate(el, { opacity: { from: 0 }, duration: 900, ease: 'outExpo' })));
      }
    } catch { /* Content stays visible when the optional animation dependency fails. */ }
  }
});
onBeforeUnmount(() => { disposed = true; motion.removeEventListener('change', changeMotion); animations.forEach(animation => animation.cancel()); });
</script>
<template>
  <a class="skip-link" href="#main-content">跳到正文</a>
  <div class="layer-bottom" aria-hidden="true" inert><div ref="bottom" class="layer-bottom-inner"><HomeContent :presentation="true" :travel="travel" :chat="chat" /></div></div>
  <div ref="top" class="layer-top" :inert="suspended"><div class="carbon-overlay"></div><div class="telemetry-grid"></div><ParticleCanvas :reduced="reduced" @fps="fps = $event" /><HomeContent :presentation="false" :travel="travel" :chat="chat" /></div>
  <TelemetryBar :time="time" :progress="progress" :fps="fps" /><SectionNavigation :active="active" />
</template>

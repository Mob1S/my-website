<script setup lang="ts">
defineProps<{ time: string; progress: string; fps: number | string }>();
</script>
<template>
  <header class="telemetry-bar"><div class="tel-item"><span class="tel-label">SYS</span><span class="tel-value">{{ time }}</span></div><div class="tel-item"><span class="tel-label">POS</span><span class="tel-value">{{ progress }}</span></div><div class="tel-brand">MOB<span class="brand-accent">1S</span></div><div class="tel-item"><span class="tel-label">FPS</span><span class="tel-value">{{ fps }}</span></div><div class="tel-item"><span class="tel-label">MOD</span><span class="tel-value tel-active">LIVE</span></div></header>
</template>

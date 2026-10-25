<script setup lang="ts">
import { sections } from '../../composables/useSectionNavigation';
defineProps<{ active: string }>();
</script>
<template>
  <nav class="nav-vertical" aria-label="首页区域导航"><a v-for="section in sections" :key="section.id" :href="`#${section.id}`" class="nav-dot" :class="{ active: active === section.id }" :aria-current="active === section.id ? 'location' : undefined"><span class="dot-label">{{ section.label }}</span></a></nav>
</template>

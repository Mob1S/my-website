<script setup lang="ts">
import HeroSection from './HeroSection.vue';
import AboutSection from './AboutSection.vue';
import HobbiesSection from './HobbiesSection.vue';
import TravelSection from './TravelSection.vue';
import ChatSection from './ChatSection.vue';
import SiteFooter from '../layout/SiteFooter.vue';
import type { TravelMap } from '../../composables/useTravelMap';
import type { ChatState } from '../../composables/useChat';
defineProps<{ presentation: boolean; travel: TravelMap; chat: ChatState }>();
</script>
<template>
  <main class="sections-container" :id="presentation ? undefined : 'main-content'" :tabindex="presentation ? undefined : -1">
    <HeroSection :presentation="presentation" /><AboutSection :presentation="presentation" /><HobbiesSection :presentation="presentation" /><TravelSection :presentation="presentation" :travel="travel" /><ChatSection :presentation="presentation" :chat="chat" />
  </main>
  <SiteFooter />
</template>

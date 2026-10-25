<script setup lang="ts">
import { hobbies } from '../../data/hobbies';
import HobbyPanel from './HobbyPanel.vue';
defineProps<{ presentation: boolean }>();
</script>
<template>
  <section :id="presentation ? undefined : 'hobbies'" class="section hobbies-section">
    <div class="section-content">
      <div class="section-header"><span class="section-index">SECTOR 02</span><a href="purpose-hobbies.html" class="section-title-link"><h2 class="section-title">MY<span class="title-accent">_HOBBIES</span></h2></a><div class="header-ruler"></div></div>
      <p class="section-summary">速度、竞技与日复一日的坚持。这些是让我保持热爱的事。</p>
      <div class="hobbies-stack"><HobbyPanel v-for="hobby in hobbies" :key="hobby.id" :hobby="hobby" /></div>
    </div>
  </section>
</template>

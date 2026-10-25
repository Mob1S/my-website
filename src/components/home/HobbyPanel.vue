<script setup lang="ts">
import type { Hobby } from '../../types/home';
defineProps<{ hobby: Hobby }>();
</script>
<template>
  <article class="hobby-panel">
    <div class="panel-header">
      <span class="panel-code">{{ hobby.code }}</span>
      <a :href="`detail.html?id=${hobby.id}`" class="panel-title-link"><h3 class="panel-title">{{ hobby.title }}<span class="title-accent">{{ hobby.accent }}</span></h3></a>
      <span class="panel-frequency">{{ hobby.frequency }}</span>
    </div>
    <div class="panel-body">
      <p class="panel-desc">{{ hobby.description }}</p>
      <div class="panel-drivers">
        <a v-for="person in hobby.people" :key="person.id" :href="`detail.html?id=${person.id}`" class="driver-card">
          <span class="driver-num">{{ person.number }}</span>
          <div class="driver-meta"><span class="driver-name">{{ person.name }}</span><span class="driver-team">{{ person.team }}</span></div>
          <span class="driver-arrow">↗</span>
        </a>
      </div>
    </div>
  </article>
</template>

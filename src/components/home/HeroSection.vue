<script setup lang="ts">
import TrackEasterEgg from '../effects/TrackEasterEgg.vue';
withDefaults(defineProps<{ presentation?: boolean }>(), { presentation: false });
</script>
<template>
<section :id="presentation ? undefined : 'hero'" class="section hero-section">
        <!-- Monza circuit outline -->
        <TrackEasterEgg :presentation="presentation" />

        <!-- Telemetry HUD corners -->
        <div class="hud-corner hud-tl">
          <span class="hud-label">SECTOR</span>
          <span class="hud-value">S1</span>
        </div>
        <div class="lucky-number">21</div>
        <div class="checkered-flag"></div>

        <div class="hero-inner">
          <div class="hero-knockout">
            <div class="hero-eyebrow">
              <span class="eyebrow-line"></span>
              <span class="eyebrow-text">DEVELOPER · GAMER · F1 ENTHUSIAST</span>
              <span class="eyebrow-line"></span>
            </div>
            <h1 class="hero-title">
              <span class="title-block" data-reveal>MOB<span class="title-accent">1S</span></span>
            </h1>
            <p class="hero-subtitle" data-reveal>
              <span class="sub-prefix">&gt;</span> Full send. No lift. Always pushing the limit.
            </p>
            <p class="hero-guide">关于我、热爱的事，以及走过的地方。</p>
            <div class="hero-actions"><a href="#about">认识我 <span>↘</span></a><a href="#mymap">查看足迹 <span>↗</span></a></div>
          </div>
        </div>
      </section>
</template>

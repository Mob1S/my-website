<script setup lang="ts">
withDefaults(defineProps<{ presentation?: boolean }>(), { presentation: false });
</script>
<template>
<section :id="presentation ? undefined : 'about'" class="section about-section">
        <div class="section-content">
          <div class="section-header">
            <span class="section-index">SECTOR 01</span>
            <a href="purpose-about.html" class="section-title-link"><h2 class="section-title">ABOUT<span class="title-accent">_ME</span></h2></a>
            <div class="header-ruler"></div>
          </div>

          <p class="section-summary">关于我的性格、态度，以及始终全力以赴的生活方式。</p>
<div class="about-layout">
            <div class="about-intro">
              <p class="intro-knockout">
                我是个怎么样的人，非要说的话，也许是<span class="inline-accent">坦荡</span>。
              </p>
              <p class="intro-body">
               早就听说：<span class="inline-accent">君子坦荡荡</span>，我是这么要求自己的。君子我不敢妄言，但我努力践行。不畏畏缩缩，大胆表达自己；不遮遮掩掩，坦诚面对世界。
              </p>
              <p class="intro-body">
               当然人是复杂的，我当然也不是个愣头青。我也有细腻敏感的一面，也会在意别人的看法；我也有谨慎保守的一面，也会担心冒险的后果。但总体来说，我更倾向于坦坦荡荡。</p>
            </div>

            <div class="about-telemetry">
              <div class="tel-card">
                <div class="tel-card-header">
                  <span class="tel-card-id">MOTTO/TELEMETRY</span>
                  <span class="tel-card-status">ACTIVE</span>
                </div>
                <div class="tel-card-body">
                  <div class="tel-big-number">FULL<span class="unit">SEND</span></div>
                  <div class="tel-bars">
                    <div class="tel-bar"><span class="bar-label">SPEED</span><span class="bar-fill" style="width:98%"></span><span class="bar-val">98%</span></div>
                    <div class="tel-bar"><span class="bar-label">FOCUS</span><span class="bar-fill" style="width:92%"></span><span class="bar-val">92%</span></div>
                    <div class="tel-bar"><span class="bar-label">BRAKE</span><span class="bar-fill bar-low" style="width:4%"></span><span class="bar-val">04%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
</template>

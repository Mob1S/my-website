<script setup lang="ts">
import beianIcon from '../../../备案图标.png';
</script>
<template>
<footer class="footer">
      <div class="footer-left">
        <span class="footer-brand">MOB<span class="brand-accent">1S</span></span>
        <span class="footer-year">© 2026</span>
      </div>
      <div class="footer-center">
        <img :src="beianIcon" alt="" class="footer-beian-icon" />
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="footer-icp">浙ICP备2026040720号</a>
        <span class="footer-icp-sep">|</span>
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33019202003112" rel="noreferrer" target="_blank" class="footer-icp">浙公网安备33019202003112号</a>
      </div>
      <div class="footer-right">
        <span class="footer-tag">BUILT WITH SPEED</span>
        <span class="footer-tag">PUSHING LIMITS</span>
      </div>
      <div class="footer-disclaimer">
        <span class="footer-disclaimer-text">F1, FORMULA 1 and related marks are trademarks of Formula One Licensing B.V. This is a personal fan project, not affiliated with F1.</span>
      </div>
      <div class="footer-credits">
        <a href="credits.html" class="footer-credits-link">致谢</a>
      </div>
    </footer>
</template>
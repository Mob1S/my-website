<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { ChatState } from '../../composables/useChat';
const props = defineProps<{ presentation: boolean; chat: ChatState }>();
const body = ref<HTMLElement>();
watch(() => props.chat.messages.value.map(m => m.content).join(''), async () => {
  await nextTick();
  if (body.value) body.value.scrollTop = body.value.scrollHeight;
});
</script>
<template>
  <section :id="presentation ? undefined : 'chat'" class="section chat-section">
    <div class="section-content">
      <div class="section-header"><span class="section-index">SECTOR 04</span><a href="purpose-ai.html" class="section-title-link"><h2 class="section-title">MOB<span class="title-accent">1S</span>_AI</h2></a><div class="header-ruler"></div></div>
      <p class="service-notice">latest news，由于相关规定，该功能暂时下线，wanna chat with me？NO AI but me</p>
      <div class="chat-layout">
        <div class="chat-intro"><p class="chat-tagline">这是我的 AI 数字分身。</p><p class="chat-desc">基于我的微信聊天记录蒸馏的人格模型，了解我的思维方式、说话风格和知识背景。就像和我本人对话一样。</p><p class="chat-profiles-hint">认识我的人？告诉我你的名字，我会用我们习惯的方式和你聊天。</p><div class="chat-sysinfo"><div class="sys-row"><span class="sys-key">MODEL STATUS</span><span class="sys-val">ONLINE</span></div><div class="sys-row"><span class="sys-key">VERSION</span><span class="sys-val">v1.4.0-persona</span></div><div class="sys-row"><span class="sys-key">ENGINE</span><span class="sys-val">nothing here</span></div></div></div>
        <div class="chat-terminal">
          <div class="term-header"><span class="term-dot term-dot-red"></span><span class="term-dot term-dot-amber"></span><span class="term-dot term-dot-green"></span><span class="term-title">mob1s@terminal:~</span></div>
          <div ref="body" class="term-body" :id="presentation ? undefined : 'chatMessages'" role="log" :aria-live="presentation ? 'off' : 'polite'">
            <div v-for="(message, i) in chat.messages.value" :key="i" class="term-line" :class="message.role === 'user' ? 'user' : 'bot'"><span class="term-prompt">{{ message.role === 'user' ? '$' : '>' }}</span><span>{{ message.content || '…' }}</span></div>
            <div v-if="chat.error.value" class="term-line bot" role="status">{{ chat.error.value }}</div>
          </div>
          <form class="term-input-row" @submit.prevent="!presentation && chat.send()">
            <span class="term-prompt">&gt;</span><input v-model="chat.draft.value" type="text" class="term-input" :id="presentation ? undefined : 'chatInput'" aria-label="聊天消息" placeholder="输入消息…" :disabled="chat.sending.value" @keydown.enter="($event.isComposing || $event.keyCode === 229) && $event.preventDefault()" />
            <button v-if="chat.sending.value" type="button" class="term-send-btn" @click="chat.cancel">停止</button><button v-else type="submit" class="term-send-btn" :id="presentation ? undefined : 'chatSendBtn'">ENTER</button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

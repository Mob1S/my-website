import { onBeforeUnmount, ref } from 'vue';
import type { Message } from '../types/home';
import { requestReply } from '../services/chat';

export function useChat() {
  const messages = ref<Message[]>([
    { role: 'assistant', content: '你好，你是谁？' },
    { role: 'assistant', content: '（如果你是我认识的人，告诉我你的名字；不认识也没关系，随便聊聊）' },
  ]);
  const history: Message[] = [{ role: 'assistant', content: '你好，哪位？' }];
  const draft = ref(''), sending = ref(false), error = ref('');
  let controller: AbortController | undefined;
  let disposed = false;
  async function send() {
    const content = draft.value.trim();
    if (!content || sending.value) return;
    draft.value = ''; error.value = ''; sending.value = true;
    messages.value.push({ role: 'user', content });
    history.push({ role: 'user', content });
    const index = messages.value.push({ role: 'assistant', content: '' }) - 1;
    controller = new AbortController();
    try {
      const reply = await requestReply(history, text => { messages.value[index]!.content = text; }, controller.signal);
      history.push({ role: 'assistant', content: reply });
    } catch (cause) {
      if (!disposed) {
        error.value = controller.signal.aborted ? '已停止回复。' : cause instanceof Error ? cause.message : '网络错误，请稍后重试。';
        if (!messages.value[index]!.content) messages.value.splice(index, 1);
        history.pop();
      }
    } finally { sending.value = false; }
  }
  onBeforeUnmount(() => { disposed = true; controller?.abort(); });
  return { messages, draft, sending, error, send, cancel: () => controller?.abort() };
}
export type ChatState = ReturnType<typeof useChat>;

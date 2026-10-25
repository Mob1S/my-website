import type { Message } from '../types/home.ts';

/** Decode SSE event boundaries, including CRLF and arbitrary UTF-8/network splits. */
export async function readReply(body: ReadableStream<Uint8Array>, onText: (text: string) => void, signal?: AbortSignal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', reply = '';
  const abort = () => { void reader.cancel(); };
  signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (done && buffer.trim()) buffer += '\n\n';
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const event = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        if (data === '[DONE]') return reply;
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(typeof parsed.error === 'string' ? parsed.error : 'AI 服务连接失败');
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (typeof chunk === 'string') { reply += chunk; onText(reply); }
      }
      if (done) return reply;
    }
  } finally {
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
export async function requestReply(messages: Message[], onText: (text: string) => void, signal: AbortSignal, retryDelay = 2000) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await wait(retryDelay, signal);
    let response: Response;
    try {
      response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }), signal });
    } catch (error) {
      signal.throwIfAborted();
      lastError = error;
      continue;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      lastError = new Error(data.error || `AI 服务暂时不可用 (${response.status})`);
      if (response.status >= 500) continue;
      throw lastError;
    }
    if (!response.body) throw new Error('未收到回复数据');
    // Never replay a request after a partial streamed reply.
    const reply = await readReply(response.body, onText, signal);
    if (!reply) throw new Error('AI 暂未返回内容，请稍后重试。');
    return reply;
  }
  throw lastError;
}

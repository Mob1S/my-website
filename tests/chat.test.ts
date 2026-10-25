import test from 'node:test';
import assert from 'node:assert/strict';
import { readReply, requestReply } from '../src/services/chat.ts';
const encoder = new TextEncoder();
const event = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\r\n\r\n`;
function stream(text: string, step = 1) {
  const bytes = encoder.encode(text);
  return new ReadableStream<Uint8Array>({ start(controller) { for (let i = 0; i < bytes.length; i += step) controller.enqueue(bytes.slice(i, i + step)); controller.close(); } });
}
test('SSE preserves multibyte Chinese across byte boundaries and ignores comments', async () => {
  const updates: string[] = [];
  const reply = await readReply(stream(': ping\r\n\r\n' + event('你好') + event('世界') + 'data: [DONE]\r\n\r\n'), text => updates.push(text));
  assert.equal(reply, '你好世界'); assert.deepEqual(updates, ['你好', '你好世界']);
});
test('SSE flushes final data without trailing newline', async () => {
  assert.equal(await readReply(stream(event('完成').trim()), () => {}), '完成');
});
test('SSE propagates malformed events and server errors', async () => {
  await assert.rejects(readReply(stream('data: invalid\n\n'), () => {}), SyntaxError);
  await assert.rejects(readReply(stream('data: {"error":"暂不可用"}\n\n'), () => {}), /暂不可用/);
});
test('SSE cancellation closes pending readers', async () => {
  const abort = new AbortController(); let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const pending = readReply(body, () => {}, abort.signal);
  abort.abort(); await assert.rejects(pending, { name: 'AbortError' }); assert.equal(cancelled, true);
});
test('request retries 5xx and preserves request history', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    assert.deepEqual(JSON.parse(options.body as string).messages, [{ role: 'user', content: '测试' }]);
    calls++; return calls < 3 ? new Response('{}', { status: 503 }) : new Response(stream(event('好') + 'data: [DONE]\n\n'));
  });
  assert.equal(await requestReply([{ role: 'user', content: '测试' }], () => {}, new AbortController().signal, 0), '好');
  assert.equal(calls, 3);
});
test('request does not retry 4xx or partially received streams', async t => {
  let calls = 0;
  const mock = t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('{"error":"拒绝"}', { status: 400 }); });
  await assert.rejects(requestReply([], () => {}, new AbortController().signal, 0), /拒绝/); assert.equal(calls, 1);
  mock.mock.mockImplementation(async () => { calls++; return new Response(stream(event('部分') + 'data: broken\n\n')); });
  await assert.rejects(requestReply([], () => {}, new AbortController().signal, 0), SyntaxError); assert.equal(calls, 2);
});
test('request cancellation interrupts retry delay', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 503 }));
  const abort = new AbortController();
  const pending = requestReply([], () => {}, abort.signal, 10000);
  setTimeout(() => abort.abort(), 5);
  await assert.rejects(pending, { name: 'AbortError' });
});

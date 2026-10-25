import { defineConfig, type Plugin, type ProxyOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const proxy: Record<string, ProxyOptions> = {
  '^/api/(chat|health)(?:\\?|$)': { target: 'http://127.0.0.1:3001', changeOrigin: true },
  '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
};
const mime: Record<string, string> = { '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
// Preview reads mutable content from the working site, never from a build snapshot.
function runtimeContent(): Plugin {
  return {
    name: 'runtime-content-preview',
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname: string;
        try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); } catch { response.statusCode = 400; response.end(); return; }
        const prefix = ['/admin/data/', '/images/'].find(prefix => pathname.startsWith(prefix));
        if (!prefix) return next();
        const base = resolve(root, '.' + prefix), file = resolve(root, '.' + pathname);
        if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) { response.statusCode = 404; response.end('Not found'); return; }
        response.setHeader('Content-Type', mime[extname(file).toLowerCase()] || 'application/octet-stream');
        response.setHeader('Cache-Control', 'no-store');
        createReadStream(file).pipe(response);
      });
    },
  };
}
export default defineConfig({
  plugins: [vue(), runtimeContent()],
  publicDir: false,
  optimizeDeps: { entries: ['index.html'] },
  server: { host: '127.0.0.1', proxy, fs: { deny: ['.env', '.env.*', '**/.git/**', '**/.migration-baseline/**', '**/server.js', '**/logs/**'] } },
  preview: { host: '127.0.0.1', proxy },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});

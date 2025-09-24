import { serve } from 'bun';
import index from './index.html';

const server = serve({
  routes: {
    '/': () => Response.redirect('/opcodes', 307),
    '/opcodes': index,
    '/opcodes/*': index,
    '/*': async (req) => {
      const pathname = new URL(req.url).pathname;
      for (const prefix of ['.', './assets', './assets-no-hash', './fonts']) {
        const file = Bun.file(new URL(`${prefix}${pathname}`, import.meta.url));
        if (await file.exists()) return new Response(file);
      }
      return new Response('Not Found', { status: 404 });
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

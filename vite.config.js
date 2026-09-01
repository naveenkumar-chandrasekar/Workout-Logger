import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

function apiDevServer() {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/analyze-food', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/analyze-food.js');
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use('/api/analyze-workout', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/analyze-workout.js');
          await mod.default(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [vue(), apiDevServer()] };
});

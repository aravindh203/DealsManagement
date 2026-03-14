
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
    proxy: {
      // Proxy client-credentials token requests to Azure AD (avoids CORS)
      '/api/token': {
        target: 'https://login.microsoftonline.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/token/, ''),
        secure: true,
        // Remove browser headers so Azure AD treats this as server-to-server
        // headers: {
        //   'Origin': '',
        // },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      '@fluentui/react',
      '@fluentui/react-components',
      '@fluentui/react-icons'
    ],
    exclude: []
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
}));

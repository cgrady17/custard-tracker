import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';
import { execSync } from 'child_process';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Get Git Hash and Build Time
    let commitHash = process.env.VITE_COMMIT_HASH || 'unknown';
    if (commitHash === 'unknown') {
        try {
            commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        } catch (e) {
            console.warn('Could not get git hash');
        }
    }
    const buildTime = new Date().toISOString();

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        '__GA_ID__': JSON.stringify(env.VITE_GA_ID),
        '__APP_VERSION__': JSON.stringify(pkg.version),
        '__COMMIT_HASH__': JSON.stringify(commitHash),
        '__BUILD_TIME__': JSON.stringify(buildTime)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

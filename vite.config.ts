import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Large vendor libraries - split them individually
              if (id.includes('node_modules')) {
                // React ecosystem
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                
                // Firebase - split into smaller chunks
                if (id.includes('firebase/app') || id.includes('@firebase/app')) {
                  return 'firebase-app';
                }
                if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
                  return 'firebase-auth';
                }
                if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
                  return 'firebase-firestore';
                }
                if (id.includes('firebase') || id.includes('@firebase')) {
                  return 'firebase-other';
                }
                
                // Google GenAI
                if (id.includes('@google/genai')) {
                  return 'genai-vendor';
                }
                
                // LiveKit
                if (id.includes('livekit')) {
                  return 'livekit-vendor';
                }
                
                // UI and animation libraries
                if (id.includes('lottie')) {
                  return 'ui-vendor';
                }
                
                // Other large libraries
                if (id.includes('lodash')) {
                  return 'lodash-vendor';
                }
                
                // Group remaining smaller node_modules
                return 'vendor';
              }
              
              // App chunks based on functionality
              if (id.includes('components/Playground')) {
                return 'playground';
              }
              if (id.includes('components/HomeworkSolver') || id.includes('components/HomeworkGate')) {
                return 'homework';
              }
              if (id.includes('components/TreasureHunt') || id.includes('components/Quiz')) {
                return 'games';
              }
              if (id.includes('components/LearningCamp') || id.includes('components/VoiceAssistant')) {
                return 'learning';
              }
              if (id.includes('components/Profile') || id.includes('components/Rewards')) {
                return 'profile';
              }
              if (id.includes('components/Story') || id.includes('components/Media')) {
                return 'content';
              }
            }
          }
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        target: 'esnext',
        minify: 'esbuild', // Use esbuild for faster builds
        sourcemap: false, // Disable sourcemaps for smaller builds
        cssCodeSplit: true, // Enable CSS code splitting
        reportCompressedSize: true
      }
    };
});

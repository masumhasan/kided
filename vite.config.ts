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
        chunkSizeWarningLimit: 250, // Only warn for chunks larger than 250kB (since our largest vendor chunks are ~245kB)
        target: 'esnext',
        minify: 'esbuild', // Use esbuild for faster builds
        sourcemap: false, // Disable sourcemaps for smaller builds
        cssCodeSplit: true, // Enable CSS code splitting
        reportCompressedSize: true,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Large vendor libraries - split them individually
              if (id.includes('node_modules')) {
                // React ecosystem - split further
                if (id.includes('react') && !id.includes('react-dom')) {
                  return 'react-core';
                }
                if (id.includes('react-dom')) {
                  return 'react-dom';
                }
                
                // Firebase - split into even smaller chunks
                if (id.includes('firebase/app') || id.includes('@firebase/app')) {
                  return 'firebase-app';
                }
                if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
                  return 'firebase-auth';
                }
                // Split Firestore further if possible
                if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
                  if (id.includes('lite')) {
                    return 'firebase-firestore-lite';
                  }
                  return 'firebase-firestore';
                }
                if (id.includes('firebase') || id.includes('@firebase')) {
                  return 'firebase-other';
                }
                
                // Google GenAI - try to split by internal modules
                if (id.includes('@google/genai')) {
                  if (id.includes('generative')) {
                    return 'genai-core';
                  }
                  if (id.includes('types') || id.includes('schema')) {
                    return 'genai-types';
                  }
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
              
              // App chunks based on functionality - make them more granular
              if (id.includes('components/Playground')) {
                return 'playground';
              }
              if (id.includes('components/HomeworkSolver') || id.includes('components/HomeworkGate')) {
                return 'homework';
              }
              if (id.includes('components/TreasureHunt')) {
                return 'treasure-hunt';
              }
              if (id.includes('components/Quiz')) {
                return 'quiz';
              }
              if (id.includes('components/LearningCamp')) {
                return 'learning-camp';
              }
              if (id.includes('components/VoiceAssistant')) {
                return 'voice-assistant';
              }
              if (id.includes('components/Profile') || id.includes('components/Rewards')) {
                return 'profile';
              }
              if (id.includes('components/Story')) {
                return 'story';
              }
              if (id.includes('components/Media')) {
                return 'media';
              }
            }
          }
        }
      }
    };
});

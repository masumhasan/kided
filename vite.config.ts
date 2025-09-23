import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks for large libraries
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('livekit')) {
                return 'livekit-vendor';
              }
              if (id.includes('@google/genai')) {
                return 'genai-vendor';
              }
              if (id.includes('lottie')) {
                return 'ui-vendor';
              }
              // All other node_modules
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
          }
        }
      },
      chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs in production
          drop_debugger: true
        }
      }
    }
  }
})
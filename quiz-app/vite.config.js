import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';

        // https://vitejs.dev/config/
        export default defineConfig({
          plugins: [react()],
          // Replace '/your-custom-route/' with the actual path you want,
          // e.g., '/quiz-app/'. Make sure it starts and ends with a slash.
          base: '/quiz-app/',
        });
        
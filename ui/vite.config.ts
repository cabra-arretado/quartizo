import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Bare specifiers the KiroCrew host resolves through its import map
// (kirodotdev/KiroCrew@f62ab4fd website/scripts/lib/basePath.mjs VENDOR_IMPORTS;
// identical to the import map in kirocrew 0.10.0rc4 static/dist/index.html).
// Anything imported from these must stay external so the app shares the host's
// React and SDK instances; anything else gets bundled.
export const HOST_MODULES = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  '@kirocrew/app-sdk',
  '@kirocrew/app-sdk/ui',
  '@tanstack/react-query',
  'lucide-react',
]

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/App.tsx',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    outDir: 'dist',
    rollupOptions: { external: HOST_MODULES },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})

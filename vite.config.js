import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Añadimos esta línea con el nombre exacto de tu repositorio entre barras
  base: '/Hemiciclo-cr-2026/', 
  plugins: [react()],
})

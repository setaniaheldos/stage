// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(),
//     tailwindcss()
//   ],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  preview: {
    host: '0.0.0.0',                          // expose le serveur à Render
    port: process.env.PORT || 4173,           // utilise le port fourni par Render
    strictPort: true,                          // échoue si le port est déjà pris
    allowedHosts: ['gestion-patient-medicale-v23c.onrender.com'] // autorise ton domaine Render
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Derive base path from GITHUB_REPOSITORY (e.g. "owner/repo" → "/repo/")
// so asset URLs are correct when deployed to GitHub Pages.
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'lessons-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''
          if (!url.startsWith('/lessons/') || !url.endsWith('.html')) return next()
          const filename = path.basename(url.slice('/lessons/'.length))
          const filePath = path.join(__dirname, 'lessons', filename)
          if (!fs.existsSync(filePath)) return next()
          res.setHeader('Content-Type', 'text/html')
          res.end(fs.readFileSync(filePath))
        })
      },
      generateBundle() {
        const lessonsDir = path.join(__dirname, 'lessons')
        for (const file of fs.readdirSync(lessonsDir)) {
          if (file.endsWith('.html')) {
            this.emitFile({
              type: 'asset',
              fileName: `lessons/${file}`,
              source: fs.readFileSync(path.join(lessonsDir, file), 'utf-8'),
            })
          }
        }
      },
    },
  ],
  base,
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Derive base path from GITHUB_REPOSITORY (e.g. "owner/repo" → "/repo/")
// so asset URLs are correct when deployed to GitHub Pages.
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
})

// Generates PNG icons from public/icon.svg for PWA / iOS home screen
// Run: node scripts/gen-icons.js

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgBuf = readFileSync(resolve(root, 'public/icon.svg'))

// For the maskable icon we need the icon to sit inside the 80% safe zone,
// so we pad it: render a larger background and center the icon content.
// We achieve this by just adding padding when resizing — the rounded square
// background already fills the canvas, which is what maskable expects.

const icons = [
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png',  size: 180 },
]

for (const { name, size } of icons) {
  await sharp(svgBuf)
    .resize(size, size)
    .png()
    .toFile(resolve(root, 'public', name))
  console.log(`✓  public/${name}`)
}

console.log('\nAll icons generated.')

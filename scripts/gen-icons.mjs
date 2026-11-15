import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const resDir = join(root, 'android', 'app', 'src', 'main', 'res')

const svgFull = readFileSync(join(root, 'public', 'favicon.svg'))

// 自适应图标前景：橘子居中，四周留出安全边距（前景蒙版会裁掉约 1/3 边缘）
function foregroundSvg() {
  // 200x200 画布，橘子缩到中间 ~66% 区域
  const inner = readFileSync(join(root, 'public', 'favicon.svg'), 'utf8')
  const body = inner.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g transform="translate(100 100) scale(0.66) translate(-100 -100)">
    ${body}
  </g>
</svg>`
}

const fgSvgBuffer = Buffer.from(foregroundSvg())

const densities = [
  { dir: 'mipmap-mdpi', size: 48, fg: 108 },
  { dir: 'mipmap-hdpi', size: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fg: 432 },
]

function render(svg, size) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  return r.render().asPng()
}

for (const { dir, size, fg } of densities) {
  const target = join(resDir, dir)
  mkdirSync(target, { recursive: true })

  const png = render(svgFull, size)
  writeFileSync(join(target, 'ic_launcher.png'), png)
  writeFileSync(join(target, 'ic_launcher_round.png'), png)

  const fgPng = render(fgSvgBuffer, fg)
  writeFileSync(join(target, 'ic_launcher_foreground.png'), fgPng)

  console.log('wrote', dir, `${size}px`, `fg ${fg}px`)
}

// 顺带刷新 PWA 图标
for (const size of [192, 512]) {
  writeFileSync(join(root, 'public', `icon-${size}.png`), render(svgFull, size))
}
console.log('wrote public/icon-192.png, icon-512.png')
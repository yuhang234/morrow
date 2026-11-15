import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url))

// Android launcher icon sizes (legacy square + round)
const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
}

const resDir = new URL('../android/app/src/main/res/', import.meta.url)

function render(size) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  return r.render().asPng()
}

for (const [density, size] of Object.entries(densities)) {
  const dir = new URL(`mipmap-${density}/`, resDir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(new URL('ic_launcher.png', dir), render(size))
  writeFileSync(new URL('ic_launcher_round.png', dir), render(size))
  writeFileSync(new URL('ic_launcher_foreground.png', dir), render(Math.round(size * 1.5)))
  console.log(`mipmap-${density}: ${size}px`)
}

// Adaptive icon XML (API 26+)
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`
mkdirSync(new URL('mipmap-anydpi-v26/', resDir), { recursive: true })
writeFileSync(new URL('mipmap-anydpi-v26/ic_launcher.xml', resDir), adaptive)
writeFileSync(new URL('mipmap-anydpi-v26/ic_launcher_round.xml', resDir), adaptive)

// background color
const colorsPath = new URL('values/ic_launcher_background.xml', resDir)
mkdirSync(dirname(colorsPath.pathname.replace(/^\//, '')), { recursive: true })
writeFileSync(
  colorsPath,
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FBF6EE</color>
</resources>
`,
)
console.log('adaptive icon + background color written')
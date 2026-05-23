// Generates the PWA icons by rasterizing an HTML rendering of the JN seal
// at three target sizes. Run via:  node tools/generate-icons.js
// Requires the dev dependency `@playwright/test` (which pulls in playwright).
// Output files are committed to the repo root and referenced from manifest.json.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..');

function sealHtml({ size, scale = 0.55, includeOrnaments = true }) {
  // scale = JN letter size / canvas size. 0.55 fits the JN cleanly within
  // the safe area for a square favicon. For maskable, we use a tighter scale
  // (0.42) so the design stays inside the 80% guaranteed-visible center.
  const jn = Math.round(size * scale);
  const ls = -Math.round(jn * 0.06);
  const border = Math.max(2, Math.round(size * 0.06));
  return `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=JetBrains+Mono:wght@500&display=swap">
<style>
  html,body{margin:0;padding:0;background:#0a0a0a;}
  .box{position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#f5f1e8;}
  ${includeOrnaments ? `.box::before{content:"";position:absolute;inset:${border}px;border:1px solid rgba(245,241,232,.32);}
  .ornament{position:absolute;left:50%;transform:translateX(-50%);color:rgba(245,241,232,.55);font-family:Georgia,serif;font-size:${Math.round(size*0.06)}px;top:${Math.round(size*0.07)}px;}
  .year{position:absolute;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;color:rgba(245,241,232,.7);font-size:${Math.round(size*0.05)}px;bottom:${Math.round(size*0.06)}px;letter-spacing:0.2em;}` : ''}
  .jn{font-family:'Playfair Display',serif;font-weight:900;line-height:1;font-size:${jn}px;letter-spacing:${ls}px;color:#f5f1e8;}
</style>
</head>
<body>
  <div class="box">
    ${includeOrnaments ? `<div class="ornament">✦</div>` : ''}
    <div class="jn">JN</div>
    ${includeOrnaments ? `<div class="year">MMXXVI</div>` : ''}
  </div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  try {
    const targets = [
      { name: 'icon-192.png',      size: 192, scale: 0.50, includeOrnaments: false },
      { name: 'icon-512.png',      size: 512, scale: 0.50, includeOrnaments: true  },
      { name: 'icon-maskable.png', size: 512, scale: 0.42, includeOrnaments: false }
    ];
    for (const t of targets) {
      const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
      await page.setContent(sealHtml(t), { waitUntil: 'networkidle' });
      // Give the Google Font a moment to settle in case networkidle fires
      // before the font swap has visibly happened.
      await page.evaluate(() => document.fonts && document.fonts.ready);
      const buf = await page.screenshot({ omitBackground: false, type: 'png' });
      const out = path.join(REPO, t.name);
      fs.writeFileSync(out, buf);
      console.log('wrote', out, '('+buf.length+' bytes,', t.size+'×'+t.size+')');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });

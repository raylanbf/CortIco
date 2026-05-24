const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

const SESSION_DIR = path.join(os.tmpdir(), 'cortico-sessions');
fs.mkdirSync(SESSION_DIR, { recursive: true });

const iconSpecs = [
  // Android - Launcher (mipmap)
  { name: 'android/launcher/ic_launcher_48x48.png',   size: 48  },
  { name: 'android/launcher/ic_launcher_72x72.png',   size: 72  },
  { name: 'android/launcher/ic_launcher_96x96.png',   size: 96  },
  { name: 'android/launcher/ic_launcher_144x144.png', size: 144 },
  { name: 'android/launcher/ic_launcher_192x192.png', size: 192 },
  { name: 'android/launcher/ic_launcher_512x512.png', size: 512 },

  // Android - Notificação
  { name: 'android/notification/ic_notification_24x24.png', size: 24 },
  { name: 'android/notification/ic_notification_36x36.png', size: 36 },
  { name: 'android/notification/ic_notification_48x48.png', size: 48 },
  { name: 'android/notification/ic_notification_72x72.png', size: 72 },
  { name: 'android/notification/ic_notification_96x96.png', size: 96 },

  // iOS - iPhone / iPad
  { name: 'ios/AppIcon_20x20.png',     size: 20   },
  { name: 'ios/AppIcon_29x29.png',     size: 29   },
  { name: 'ios/AppIcon_40x40.png',     size: 40   },
  { name: 'ios/AppIcon_58x58.png',     size: 58   },
  { name: 'ios/AppIcon_60x60.png',     size: 60   },
  { name: 'ios/AppIcon_76x76.png',     size: 76   },
  { name: 'ios/AppIcon_80x80.png',     size: 80   },
  { name: 'ios/AppIcon_87x87.png',     size: 87   },
  { name: 'ios/AppIcon_120x120.png',   size: 120  },
  { name: 'ios/AppIcon_152x152.png',   size: 152  },
  { name: 'ios/AppIcon_167x167.png',   size: 167  },
  { name: 'ios/AppIcon_180x180.png',   size: 180  },
  { name: 'ios/AppIcon_1024x1024.png', size: 1024 },

  // Chrome Extension
  { name: 'chrome/icon_16x16.png',   size: 16  },
  { name: 'chrome/icon_32x32.png',   size: 32  },
  { name: 'chrome/icon_48x48.png',   size: 48  },
  { name: 'chrome/icon_128x128.png', size: 128 },

  // Web / PWA / Favicon
  { name: 'web/favicon_16x16.png',           size: 16  },
  { name: 'web/favicon_32x32.png',           size: 32  },
  { name: 'web/favicon_64x64.png',           size: 64  },
  { name: 'web/icon_96x96.png',              size: 96  },
  { name: 'web/icon_128x128.png',            size: 128 },
  { name: 'web/apple_touch_icon_180x180.png', size: 180 },
  { name: 'web/icon_192x192.png',            size: 192 },
  { name: 'web/icon_256x256.png',            size: 256 },
  { name: 'web/icon_512x512.png',            size: 512 },
];

const ALLOWED_ICON_PATHS = new Set(iconSpecs.map(s => s.name));

async function resizeIcon(buffer, size) {
  return sharp(buffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
}

// CORS para a extensão Chrome
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/ping', (req, res) => res.json({ ok: true }));

// Web: download zip direto
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('Envie uma imagem PNG ou JPG.');
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(req.file.mimetype)) {
    return res.status(400).send('Formato inválido. Use PNG ou JPG.');
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="icon-pack.zip"');

  const archive = archiver('zip');
  archive.on('error', err => { console.error(err); res.status(500).end(); });
  archive.pipe(res);

  for (const spec of iconSpecs) {
    const buf = await resizeIcon(req.file.buffer, spec.size);
    archive.append(buf, { name: spec.name });
  }

  await archive.finalize();
});

// Extensão: gerar sessão com ícones em disco
app.post('/upload-session', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie uma imagem.' });
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Formato inválido. Use PNG ou JPG.' });
  }

  const sessionId = crypto.randomUUID();
  const sessionPath = path.join(SESSION_DIR, sessionId);

  try {
    for (const spec of iconSpecs) {
      const iconPath = path.join(sessionPath, spec.name);
      fs.mkdirSync(path.dirname(iconPath), { recursive: true });
      const buf = await resizeIcon(req.file.buffer, spec.size);
      fs.writeFileSync(iconPath, buf);
    }

    fs.writeFileSync(
      path.join(sessionPath, 'meta.json'),
      JSON.stringify({ created: Date.now(), icons: iconSpecs.map(s => ({ name: s.name, size: s.size })) })
    );

    res.json({ sessionId });
  } catch (err) {
    console.error(err);
    fs.rmSync(sessionPath, { recursive: true, force: true });
    res.status(500).json({ error: 'Erro ao gerar ícones.' });
  }
});

// Extensão: servir ícone individual
app.get('/icon/:sessionId/*', (req, res) => {
  const iconRelPath = req.params[0];
  if (!ALLOWED_ICON_PATHS.has(iconRelPath)) return res.status(404).end();

  const iconAbsPath = path.join(SESSION_DIR, req.params.sessionId, iconRelPath);
  if (!fs.existsSync(iconAbsPath)) return res.status(404).end();

  res.sendFile(iconAbsPath);
});

// Extensão: página de pré-visualização
app.get('/preview/:sessionId', (req, res) => {
  const metaPath = path.join(SESSION_DIR, req.params.sessionId, 'meta.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Sessão não encontrada.');

  const meta = JSON.parse(fs.readFileSync(metaPath));
  const platforms = {
    android: { label: 'Android', icons: [] },
    ios:     { label: 'iOS', icons: [] },
    chrome:  { label: 'Chrome', icons: [] },
    web:     { label: 'Web / PWA', icons: [] },
  };

  for (const icon of meta.icons) {
    const prefix = icon.name.split('/')[0];
    if (platforms[prefix]) platforms[prefix].icons.push(icon);
  }

  res.send(generatePreviewHtml(req.params.sessionId, platforms, meta.icons.length));
});

// Extensão: baixar zip da sessão
app.get('/download/:sessionId', (req, res) => {
  const sessionPath = path.join(SESSION_DIR, req.params.sessionId);
  const metaPath = path.join(sessionPath, 'meta.json');
  if (!fs.existsSync(metaPath)) return res.status(404).send('Sessão não encontrada.');

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="icon-pack.zip"');

  const meta = JSON.parse(fs.readFileSync(metaPath));
  const archive = archiver('zip');
  archive.on('error', err => { console.error(err); res.status(500).end(); });
  archive.pipe(res);

  for (const icon of meta.icons) {
    archive.file(path.join(sessionPath, icon.name), { name: icon.name });
  }

  archive.finalize();
});

// Limpar sessões com mais de 1 hora
setInterval(() => {
  const cutoff = Date.now() - 3_600_000;
  try {
    for (const id of fs.readdirSync(SESSION_DIR)) {
      const metaPath = path.join(SESSION_DIR, id, 'meta.json');
      if (!fs.existsSync(metaPath)) continue;
      const { created } = JSON.parse(fs.readFileSync(metaPath));
      if (created < cutoff) fs.rmSync(path.join(SESSION_DIR, id), { recursive: true, force: true });
    }
  } catch {}
}, 600_000);

function generatePreviewHtml(sessionId, platforms, totalCount) {
  const meta = {
    android: { color: '#3ddc84', bg: 'rgba(61,220,132,.1)' },
    ios:     { color: '#c0c0c8', bg: 'rgba(192,192,200,.06)' },
    chrome:  { color: '#4285f4', bg: 'rgba(66,133,244,.1)' },
    web:     { color: '#fbbf24', bg: 'rgba(251,191,36,.08)' },
  };

  const sections = Object.entries(platforms).map(([key, platform]) => {
    if (!platform.icons.length) return '';
    const m = meta[key];
    const thumbs = platform.icons.map(icon => `
      <div class="thumb">
        <div class="thumb-box">
          <img src="/icon/${sessionId}/${icon.name}" loading="lazy" alt="${icon.size}px" />
        </div>
        <span class="thumb-label">${icon.size}px</span>
      </div>`).join('');

    return `
      <section>
        <div class="sec-header" style="--c:${m.color};--bg:${m.bg}">
          <span class="sec-dot" style="background:${m.color}"></span>
          <h2>${platform.label}</h2>
          <span class="sec-count">${platform.icons.length} ícones</span>
        </div>
        <div class="grid">${thumbs}</div>
      </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CortIco — Pré-visualização</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f11; color: #e2e2e6; min-height: 100vh; }

  .topbar {
    position: sticky; top: 0; z-index: 10;
    background: rgba(15,15,17,.92); backdrop-filter: blur(14px);
    border-bottom: 1px solid #2a2a32;
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px; gap: 16px;
  }
  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-logo {
    width: 36px; height: 36px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .topbar-logo svg { width: 20px; height: 20px; fill: #fff; }
  .topbar-title { font-size: 15px; font-weight: 700; color: #f4f4f8; }
  .topbar-sub { font-size: 12px; color: #72727e; margin-top: 1px; }

  .btn-dl {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 13px; font-weight: 600;
    border-radius: 10px; text-decoration: none; white-space: nowrap;
    transition: opacity .2s;
  }
  .btn-dl:hover { opacity: .85; }
  .btn-dl svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  main { max-width: 1000px; margin: 0 auto; padding: 36px 24px 80px; display: flex; flex-direction: column; gap: 44px; }

  .sec-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; background: var(--bg); border-radius: 10px;
    margin-bottom: 18px;
  }
  .sec-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .sec-header h2 { font-size: 13px; font-weight: 700; color: var(--c); text-transform: uppercase; letter-spacing: .5px; }
  .sec-count { margin-left: auto; font-size: 12px; color: #52525e; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 12px; }

  .thumb { display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .thumb-box {
    width: 88px; height: 88px;
    background: #1a1a1f; border: 1px solid #2a2a32; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; overflow: hidden;
    transition: border-color .15s;
  }
  .thumb-box:hover { border-color: #3a3a4a; }
  .thumb-box img { max-width: 80%; max-height: 80%; object-fit: contain; }
  .thumb-label { font-size: 11px; color: #52525e; }
</style>
</head>
<body>

<div class="topbar">
  <div class="topbar-left">
    <div class="topbar-logo">
      <svg viewBox="0 0 24 24"><path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
    </div>
    <div>
      <div class="topbar-title">Pré-visualização</div>
      <div class="topbar-sub">${totalCount} ícones gerados com sucesso</div>
    </div>
  </div>
  <a href="/download/${sessionId}" class="btn-dl">
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Baixar .zip
  </a>
</div>

<main>${sections}</main>

</body>
</html>`;
}

app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));

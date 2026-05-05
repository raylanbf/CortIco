const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

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
  { name: 'ios/AppIcon_20x20.png',   size: 20   },
  { name: 'ios/AppIcon_29x29.png',   size: 29   },
  { name: 'ios/AppIcon_40x40.png',   size: 40   },
  { name: 'ios/AppIcon_58x58.png',   size: 58   },
  { name: 'ios/AppIcon_60x60.png',   size: 60   },
  { name: 'ios/AppIcon_76x76.png',   size: 76   },
  { name: 'ios/AppIcon_80x80.png',   size: 80   },
  { name: 'ios/AppIcon_87x87.png',   size: 87   },
  { name: 'ios/AppIcon_120x120.png', size: 120  },
  { name: 'ios/AppIcon_152x152.png', size: 152  },
  { name: 'ios/AppIcon_167x167.png', size: 167  },
  { name: 'ios/AppIcon_180x180.png', size: 180  },
  { name: 'ios/AppIcon_1024x1024.png', size: 1024 },

  // Chrome Extension
  { name: 'chrome/icon_16x16.png',  size: 16  },
  { name: 'chrome/icon_32x32.png',  size: 32  },
  { name: 'chrome/icon_48x48.png',  size: 48  },
  { name: 'chrome/icon_128x128.png', size: 128 },

  // Web / PWA / Favicon
  { name: 'web/favicon_16x16.png',          size: 16  },
  { name: 'web/favicon_32x32.png',          size: 32  },
  { name: 'web/favicon_64x64.png',          size: 64  },
  { name: 'web/icon_96x96.png',             size: 96  },
  { name: 'web/icon_128x128.png',           size: 128 },
  { name: 'web/apple_touch_icon_180x180.png', size: 180 },
  { name: 'web/icon_192x192.png',           size: 192 },
  { name: 'web/icon_256x256.png',           size: 256 },
  { name: 'web/icon_512x512.png',           size: 512 },
];

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Envie uma imagem PNG ou JPG.');
  }

  const inputBuffer = req.file.buffer;
  const contentType = req.file.mimetype;
  if (!['image/png', 'image/jpeg', 'image/jpg'].includes(contentType)) {
    return res.status(400).send('Formato inválido. Use PNG ou JPG.');
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="icon-pack.zip"');

  const archive = archiver('zip');
  archive.on('error', err => {
    console.error('Erro no arquivador:', err);
    res.status(500).end();
  });

  archive.pipe(res);

  for (const spec of iconSpecs) {
    const resized = await sharp(inputBuffer)
      .resize(spec.size, spec.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
      .toBuffer();

    archive.append(resized, { name: spec.name });
  }

  await archive.finalize();
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

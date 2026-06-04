const iconSpecs = [
  { name: 'android/launcher/ic_launcher_48x48.png',   size: 48  },
  { name: 'android/launcher/ic_launcher_72x72.png',   size: 72  },
  { name: 'android/launcher/ic_launcher_96x96.png',   size: 96  },
  { name: 'android/launcher/ic_launcher_144x144.png', size: 144 },
  { name: 'android/launcher/ic_launcher_192x192.png', size: 192 },
  { name: 'android/launcher/ic_launcher_512x512.png', size: 512 },
  { name: 'android/notification/ic_notification_24x24.png', size: 24 },
  { name: 'android/notification/ic_notification_36x36.png', size: 36 },
  { name: 'android/notification/ic_notification_48x48.png', size: 48 },
  { name: 'android/notification/ic_notification_72x72.png', size: 72 },
  { name: 'android/notification/ic_notification_96x96.png', size: 96 },
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
  { name: 'chrome/icon_16x16.png',   size: 16  },
  { name: 'chrome/icon_32x32.png',   size: 32  },
  { name: 'chrome/icon_48x48.png',   size: 48  },
  { name: 'chrome/icon_128x128.png', size: 128 },
  { name: 'web/favicon_16x16.png',            size: 16  },
  { name: 'web/favicon_32x32.png',            size: 32  },
  { name: 'web/favicon_64x64.png',            size: 64  },
  { name: 'web/icon_96x96.png',               size: 96  },
  { name: 'web/icon_128x128.png',             size: 128 },
  { name: 'web/apple_touch_icon_180x180.png', size: 180 },
  { name: 'web/icon_192x192.png',             size: 192 },
  { name: 'web/icon_256x256.png',             size: 256 },
  { name: 'web/icon_512x512.png',             size: 512 },
];

const thumbnailSpecs = [
  { name: 'youtube/thumbnail_1280x720.png', width: 1280, height: 720 },
  { name: 'chrome_store/small_promo_440x280.png', width: 440, height: 280 },
  { name: 'chrome_store/large_promo_920x680.png', width: 920, height: 680 },
  { name: 'chrome_store/marquee_1400x560.png', width: 1400, height: 560 },
  { name: 'chrome_store/screenshot_1280x800.png', width: 1280, height: 800 },
  { name: 'play_store/feature_graphic_1024x500.png', width: 1024, height: 500 },
  { name: 'play_store/screenshot_1080x1920.png', width: 1080, height: 1920 },
  { name: 'app_store/iphone_67_1290x2796.png', width: 1290, height: 2796 },
  { name: 'app_store/iphone_65_1242x2688.png', width: 1242, height: 2688 },
  { name: 'app_store/ipad_pro_2048x2732.png', width: 2048, height: 2732 },
];

const allSpecs = [...iconSpecs, ...thumbnailSpecs];

const fileInput   = document.getElementById('fileInput');
const dropZone    = document.getElementById('dropZone');
const previewWrap = document.getElementById('previewWrap');
const previewImg  = document.getElementById('previewImg');
const previewName = document.getElementById('previewName');
const previewSize = document.getElementById('previewSize');
const clearBtn    = document.getElementById('clearBtn');
const submitBtn   = document.getElementById('submitBtn');
const btnText     = document.getElementById('btnText');
const progressWrap = document.getElementById('progressWrap');
const progressText = document.getElementById('progressText');
const progressCount = document.getElementById('progressCount');
const progressFill  = document.getElementById('progressFill');
const form        = document.getElementById('form');
const toast       = document.getElementById('toast');

let toastTimer;

function showToast(msg, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function setFile(file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    showToast('Use uma imagem PNG ou JPG.', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);
    previewWrap.classList.add('visible');
    submitBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

fileInput.addEventListener('change', () => setFile(fileInput.files[0]));

document.addEventListener('paste', e => {
  const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
  if (item) setFile(item.getAsFile());
});

clearBtn.addEventListener('click', () => {
  fileInput.value = '';
  previewWrap.classList.remove('visible');
  previewImg.src = '';
  submitBtn.disabled = true;
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    setFile(file);
  }
});

async function generateIcon(imgBitmap, width, height) {
  let src = imgBitmap;
  let sw = imgBitmap.width, sh = imgBitmap.height;

  // Downscale progressively para melhor qualidade
  while (sw > width * 2 || sh > height * 2) {
    const nw = Math.max(Math.ceil(sw / 2), width);
    const nh = Math.max(Math.ceil(sh / 2), height);
    const tmp = new OffscreenCanvas(nw, nh);
    tmp.getContext('2d').drawImage(src, 0, 0, nw, nh);
    src = tmp; sw = nw; sh = nh;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: true });

  const aspect = sw / sh;
  const targetAspect = width / height;
  let dw, dh, dx = 0, dy = 0;
  if (aspect >= targetAspect) { dw = height * aspect; dh = height; dx = (width - dw) / 2; }
  else                         { dh = width / aspect; dw = width; dy = (height - dh) / 2; }

  ctx.drawImage(src, dx, dy, dw, dh);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Uint8Array(await blob.arrayBuffer());
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) return;

  submitBtn.disabled = true;
  progressWrap.classList.add('visible');
  dropZone.style.pointerEvents = 'none';

  try {
    const imgBitmap = await createImageBitmap(file);
    const sessionId = crypto.randomUUID();
    const icons = {};
    const total = allSpecs.length;

    for (let i = 0; i < total; i++) {
      const spec = allSpecs[i];
      const width = spec.width ?? spec.size;
      const height = spec.height ?? spec.size;
      icons[spec.name] = await generateIcon(imgBitmap, width, height);
      const pct = Math.round(((i + 1) / total) * 100);
      progressFill.style.width = pct + '%';
      progressCount.textContent = `${i + 1} / ${total}`;
    }

    await saveIcons(sessionId, icons);

    const url = chrome.runtime.getURL('preview.html') + '?session=' + sessionId;
    chrome.tabs.create({ url });
    showToast('Abrindo pré-visualização...');
  } catch (err) {
    showToast('Erro: ' + err.message, true);
  } finally {
    submitBtn.disabled = false;
    progressWrap.classList.remove('visible');
    progressFill.style.width = '0%';
    progressCount.textContent = '0 / 47';
    dropZone.style.pointerEvents = '';
  }
});

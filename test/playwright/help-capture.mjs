import { copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';
import sharp from 'sharp';

const ELECTRON_MAIN_PATH = fileURLToPath(
  new URL('../../dist/electron/UnPackaged/electron-main.js', import.meta.url),
);

const OUT = 'test/playwright/help-shots';
const MEDIA_DIR = 'D:/TM2-help-shots/media';
const DEMO_VIDEO = fileURLToPath(
  new URL('../../public/demo/teo-demo-video.mp4', import.meta.url),
);

const IMAGE_HUES = {
  'Sample LAC photo': 80,
  'Sample TGW photo': 280,
  'Sample TGW photo 1': 0,
  'Sample TGW photo 2': 160,
  'Sample TGW photo 3': 200,
  'Sample TGW photo group': 120,
};

const SPANISH_TITLES = {
  'Sample AYFM video': 'Video de ejemplo — AYFM',
  'Sample LAC photo': 'Imagen de ejemplo — LAC',
  'Sample LAC song': 'Canción de ejemplo — LAC',
  'Sample TGW photo': 'Imagen de ejemplo',
  'Sample TGW photo 1': 'Imagen de ejemplo 1',
  'Sample TGW photo 2': 'Imagen de ejemplo 2',
  'Sample TGW photo 3': 'Imagen de ejemplo 3',
  'Sample TGW photo group': 'Galería de imágenes de ejemplo',
  'Sample TGW song': 'Canción de ejemplo — TGW',
};

await rm(OUT, { force: true, recursive: true });
await mkdir(OUT, { recursive: true });
await rm(MEDIA_DIR, { force: true, recursive: true });
await mkdir(MEDIA_DIR, { recursive: true });

await copyFile(DEMO_VIDEO, `${MEDIA_DIR}/demo-video.mp4`);

const imageUrls = new Map();
for (const [title, hue] of Object.entries(IMAGE_HUES)) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hue}, 55%, 68%)" />
          <stop offset="1" stop-color="hsl(${hue + 25}, 48%, 45%)" />
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#g)" />
      <circle cx="760" cy="120" r="190" fill="rgba(255,255,255,0.18)" />
      <circle cx="180" cy="470" r="230" fill="rgba(0,0,0,0.08)" />
    </svg>`,
  );
  const fileName = title.toLowerCase().replaceAll(' ', '-') + '.png';
  await sharp(svg).png().toFile(`${MEDIA_DIR}/${fileName}`);
  imageUrls.set(title, `file:///D:/TM2-help-shots/media/${fileName}`);
}
const videoUrl = 'file:///D:/TM2-help-shots/media/demo-video.mp4';

const app = await electron.launch({
  args: [
    ELECTRON_MAIN_PATH,
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
  ],
  env: {
    ...process.env,
    M3_DEMO_MODE: '1',
    PORTABLE_EXECUTABLE_DIR: 'D:/TM2-help-shots',
  },
});
app.process().stdout?.on('data', (d) => {
  const text = String(d);
  if (/error|failed|denied/i.test(text)) process.stdout.write(`[main] ${text}`);
});

async function findMainWindow() {
  for (let attempt = 0; attempt < 60; attempt++) {
    for (const window of app.windows()) {
      if (
        window.url().includes('#/media-calendar') ||
        window.url().includes('#/cameras')
      ) {
        return window;
      }
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
  throw new Error('Main window not found');
}

const window = await findMainWindow();

await window.waitForFunction(
  () => document.body.innerText.includes('Sample TGW song'),
  undefined,
  { timeout: 60000 },
);

await window.evaluate(
  ({ imageUrls: serializedImages, titles, videoUrl: serializedVideo }) => {
    const pinia =
      document.querySelector('#q-app')?.__vue_app__?.config.globalProperties
        ?.$pinia;
    const current = pinia?._s.get('current-state');
    const demo = pinia?._s.get('demo-mode');
    const jw = pinia?._s.get('jw-store');
    if (current?.currentSettings) {
      current.currentSettings.localAppLang = 'es';
      current.currentSettings.congregationName = 'Congregación de ejemplo';
      current.currentSettings.enableMediaDisplayButton = true;
      current.currentSettings.enableTimerDisplay = true;
      current.currentSettings.timerShowOnActionIsland = true;
    }
    if (demo) demo.enabled = false;

    const images = new Map(Object.entries(serializedImages));
    const setUrls = (item) => {
      if (!item) return;
      if (images.has(item.title)) {
        item.fileUrl = images.get(item.title);
      } else if (
        item.duration !== undefined ||
        (!item.isImage && item.fileUrl?.includes('demo'))
      ) {
        item.fileUrl = serializedVideo;
      }
      item.title = titles[item.title] ?? item.title;
      item.extractCaption = titles[item.extractCaption] ?? item.extractCaption;
      item.children?.forEach(setUrls);
    };
    Object.values(jw?.lookupPeriod ?? {}).forEach((days) => {
      days.forEach((day) => {
        day.mediaSections?.forEach((section) => {
          section.items?.forEach(setUrls);
        });
      });
    });
  },
  {
    imageUrls: Object.fromEntries(imageUrls),
    titles: SPANISH_TITLES,
    videoUrl,
  },
);

const clearNotifications = async () => {
  await window.evaluate(() => {
    document.querySelectorAll('.q-notification').forEach((node) => {
      const dismiss = node.querySelector?.('.q-notification__actions button');
      if (dismiss instanceof HTMLElement) dismiss.click();
    });
  });
  await window.waitForTimeout(800);
};

await window.waitForTimeout(3000);
await window
  .getByText('Reunión', { exact: true })
  .first()
  .waitFor({ state: 'visible', timeout: 15000 });
await window.waitForFunction(
  () => !document.body.innerText.includes('no está disponible'),
  undefined,
  { timeout: 60000 },
);
await window.waitForTimeout(1500);
await clearNotifications();

await window.locator('#q-app').screenshot({ path: `${OUT}/01-reunion.png` });
console.log('captured meeting');

await window
  .getByRole('button', { name: /Cámaras/ })
  .first()
  .click();
await window.waitForTimeout(5000);
await window.evaluate(() => {
  const scroll = document.querySelector('.app-main-scroll');
  if (scroll) scroll.scrollTop = 0;
});
await window.waitForTimeout(1200);
await clearNotifications();
await window.locator('#q-app').screenshot({ path: `${OUT}/02-camaras.png` });
console.log('captured cameras top');

await window.evaluate(() => {
  const scroll = document.querySelector('.app-main-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
});
await window.waitForTimeout(1500);
await window.locator('#q-app').screenshot({
  path: `${OUT}/03-camaras-escenas.png`,
});
console.log('captured cameras scenes/capture');

const capturePopup = async (name, { scroll = 0 } = {}) => {
  await window.evaluate((top) => {
    const area = document.querySelector('.action-popup__scroll');
    if (area) area.scrollTop = top;
  }, scroll);
  await window.waitForTimeout(800);
  await window
    .locator('.action-popup')
    .last()
    .screenshot({
      path: `${OUT}/${name}.png`,
    });
  console.log('captured', name);
};

const openPopup = async (buttonSelector) => {
  await window.locator(buttonSelector).first().click();
  await window.waitForTimeout(1200);
  await clearNotifications();
};

await openPopup(
  '#actionIsland .q-btn:has(i.mmm-media-display-active), #actionIsland .q-btn:has(i.mmm-media-display-inactive)',
);
await capturePopup('04-pantallas');
await window.keyboard.press('Escape');
await window.waitForTimeout(500);

await openPopup(
  '#actionIsland .q-btn:has(i.mmm-alarm), #actionIsland .q-btn:has(i.mmm-alarm-off)',
);
await capturePopup('05-timer', { scroll: 0 });
await capturePopup('06-monitor', { scroll: 99999 });
await window.keyboard.press('Escape');
await window.waitForTimeout(500);

await window.evaluate(() => {
  window.location.hash = '#/settings/enableMediaDisplayButton';
});
await window.waitForTimeout(2800);
await clearNotifications();
await window.locator('#q-app').screenshot({ path: `${OUT}/07-ajustes.png` });
console.log('captured settings');

await app.close();
console.log('done');

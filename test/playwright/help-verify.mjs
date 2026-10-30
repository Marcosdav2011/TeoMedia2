import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const ELECTRON_MAIN_PATH = fileURLToPath(
  new URL('../../dist/electron/UnPackaged/electron-main.js', import.meta.url),
);
const OUT = 'test/playwright/help-shots';
const PDF_PATH = 'MANUAL-TM2.pdf';

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

async function findMainWindow() {
  for (let attempt = 0; attempt < 60; attempt++) {
    for (const window of app.windows()) {
      const url = window.url();
      if (url.includes('#/media-calendar') || url.includes('#/cameras')) {
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

await window.evaluate(() => {
  const pinia =
    document.querySelector('#q-app')?.__vue_app__?.config.globalProperties
      ?.$pinia;
  const current = pinia?._s.get('current-state');
  if (current?.currentSettings) current.currentSettings.localAppLang = 'es';
  location.hash = '#/help';
});
await window.waitForSelector('.help-page h1', { timeout: 30000 });
await window.waitForTimeout(2000);

await window.evaluate(() => {
  document.querySelectorAll('.q-notification').forEach((node) => {
    const dismiss = node.querySelector?.('.q-notification__actions button');
    if (dismiss instanceof HTMLElement) dismiss.click();
  });
});
await window.waitForTimeout(1000);

const report = await window.evaluate(async () => {
  const images = await Promise.all(
    [...document.querySelectorAll('.help-figure img')].map(async (img) => {
      let fetchStatus;
      try {
        const response = await fetch(img.src);
        fetchStatus = String(response.status);
      } catch (error) {
        fetchStatus = `error: ${error.message}`;
      }
      return {
        absolute: img.src,
        fetchStatus,
        loaded: img.complete && img.naturalWidth > 0,
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        src: img.getAttribute('src'),
      };
    }),
  );
  const activeTab = document.querySelector('.q-tab--active');
  return {
    activeTab: activeTab?.textContent?.trim(),
    chips: [...document.querySelectorAll('.help-chip')].map((c) =>
      c.textContent.trim(),
    ),
    heading: document.querySelector('.help-page h1')?.textContent?.trim(),
    href: location.href,
    images,
    subtitles: document.querySelectorAll('.help-section').length,
    tocItems: document.querySelectorAll('.help-toc__item').length,
  };
});
console.log(JSON.stringify(report, null, 2));

await window.evaluate(() => {
  const scroll = document.querySelector('.app-main-scroll');
  if (scroll) scroll.scrollTop = 0;
});
await window.waitForTimeout(600);
await window.locator('#q-app').screenshot({ path: `${OUT}/help-top.png` });

await window.evaluate(() => {
  document.getElementById('camaras')?.scrollIntoView({ block: 'start' });
});
await window.waitForTimeout(900);
await window.locator('#q-app').screenshot({ path: `${OUT}/help-camaras.png` });

await window.evaluate(() => {
  const scroll = document.querySelector('.app-main-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
});
await window.waitForTimeout(900);
await window.locator('#q-app').screenshot({ path: `${OUT}/help-end.png` });

await window.evaluate(() => {
  const scroll = document.querySelector('.app-main-scroll');
  if (scroll) scroll.scrollTop = 0;
});
await window.waitForTimeout(500);

const base64Pdf = await app.evaluate(async ({ BrowserWindow }) => {
  const target = BrowserWindow.getAllWindows().find((win) =>
    win.webContents.getURL().includes('#/help'),
  );
  if (!target) throw new Error('Help window not found');
  const pdf = await target.webContents.printToPDF({
    displayHeaderFooter: true,
    footerTemplate:
      '<div style="width:100%;font-size:8px;font-family:Segoe UI,sans-serif;color:#6b7d89;padding:0 12mm;display:flex;justify-content:space-between;">' +
      '<span>Manual de TM2</span>' +
      '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span>' +
      '</div>',
    headerTemplate: '<div></div>',
    margins: { bottom: 0.6, left: 0.4, right: 0.4, top: 0.4 },
    pageSize: 'A4',
    printBackground: true,
  });
  return pdf.toString('base64');
});
const pdf = Buffer.from(base64Pdf, 'base64');
await writeFile(PDF_PATH, pdf);
const pageCount = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [])
  .length;
console.log(
  `PDF written: ${PDF_PATH} (${pdf.length} bytes, ${pageCount} pages)`,
);

await app.close();

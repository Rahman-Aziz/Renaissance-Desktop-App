const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

// ─── History Management ────────────────────────────────────────────────────
const histPath = (page) => path.join(app.getPath('userData'), `${page}_history.json`);

function getHistory(page) {
  const p = histPath(page);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

function saveEntry(page, entry) {
  const h = getHistory(page);
  h.unshift({ ...entry, date: new Date().toISOString() });
  if (h.length > 50) h.splice(50);
  fs.writeFileSync(histPath(page), JSON.stringify(h, null, 2));
}

function clearHistory(page) {
  const p = histPath(page);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// ─── Excel Generation ──────────────────────────────────────────────────────
async function buildExcel({ sheetData, filename }) {
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Renaissance';
  wb.created = new Date();

  for (const sheet of sheetData) {
    const ws = wb.addWorksheet(sheet.name, {
      properties: { tabColor: { argb: 'FFC9A84C' } },
    });
    if (sheet.columns) ws.columns = sheet.columns.map(c => ({ header: '', width: c.width || 20 }));

    for (const row of sheet.rows) {
      const wsRow = ws.addRow(row.cells.map(c => c.formula ? '' : c.value));
      row.cells.forEach((cell, i) => {
        const wsCell = wsRow.getCell(i + 1);
        if (cell.formula) wsCell.value = { formula: cell.formula };
        if (cell.format) wsCell.numFmt = cell.format;
        if (cell.bold || cell.header) wsCell.font = { bold: true, color: { argb: cell.header ? 'FFFFFFFF' : 'FF000000' } };
        if (cell.header) wsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9A84C' } };
        wsCell.alignment = { vertical: 'middle', horizontal: cell.align || 'left' };
        wsCell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } }, bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } }, right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
      });
    }
  }

  const downloads = app.getPath('downloads');
  const safe = filename.replace(/[^a-z0-9_\-]/gi, '_');
  const filePath = path.join(downloads, `${safe}.xlsx`);
  await wb.xlsx.writeFile(filePath);
  return { success: true, path: filePath };
}

// ─── Window ────────────────────────────────────────────────────────────────
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    frame: false, backgroundColor: '#07080f', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  });

  isDev ? win.loadURL('http://localhost:5173') : win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('maximize',   () => win.webContents.send('win:state', true));
  win.on('unmaximize', () => win.webContents.send('win:state', false));
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('win:minimize',    () => win.minimize());
  ipcMain.handle('win:maximize',    () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.handle('win:close',       () => win.close());
  ipcMain.handle('win:is-max',      () => win.isMaximized());

  ipcMain.handle('history:get',     (_, page)        => getHistory(page));
  ipcMain.handle('history:save',    (_, page, entry) => { saveEntry(page, entry); return true; });
  ipcMain.handle('history:clear',   (_, page)        => { clearHistory(page); return true; });

  ipcMain.handle('excel:generate',  (_, data)        => buildExcel(data));
  ipcMain.handle('shell:open',      (_, p)           => shell.openPath(p));

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

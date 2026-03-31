const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:       ()           => ipcRenderer.invoke('win:minimize'),
  maximize:       ()           => ipcRenderer.invoke('win:maximize'),
  close:          ()           => ipcRenderer.invoke('win:close'),
  isMaximized:    ()           => ipcRenderer.invoke('win:is-max'),
  onWinState:     (cb)         => ipcRenderer.on('win:state', (_, v) => cb(v)),

  getHistory:     (page)       => ipcRenderer.invoke('history:get', page),
  saveHistory:    (page, entry) => ipcRenderer.invoke('history:save', page, entry),
  clearHistory:   (page)       => ipcRenderer.invoke('history:clear', page),

  generateExcel:  (data)       => ipcRenderer.invoke('excel:generate', data),
  openFile:       (p)          => ipcRenderer.invoke('shell:open', p),
});

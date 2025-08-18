const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    uploadMp3Files: () => ipcRenderer.invoke('upload-mp3-files'),
    loadAllMp3Files: () => ipcRenderer.invoke('load-all-mp3-files'),
    deleteMp3File: (fileName) => ipcRenderer.invoke('delete-mp3-file', fileName),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
});
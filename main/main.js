const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const os = require('os');
const { pathToFileURL } = require('url');

let mainWindow;

// --- Determine music folder based on environment ---
const isDev = !app.isPackaged;
const MUSIC_FOLDER = isDev
  ? path.join(__dirname, '../assets/music')
  : path.join(os.homedir(), 'ElectronMusicPlayer', 'music');

// Ensure the folder exists
if (!fs.existsSync(MUSIC_FOLDER)) {
  fs.mkdirSync(MUSIC_FOLDER, { recursive: true });
}

let reloadTimeout;

fs.watch(MUSIC_FOLDER, { persistent: true }, (eventType, fileName) => {
  if(mainWindow && fileName) {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      mainWindow.webContents.send('songs-updated', fileName);
    }, 500);
  }
})

ipcMain.on('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if(window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.close(); 
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: false,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWindow.webContents.openDevTools();
}

// --- IPC Handlers ---

ipcMain.handle('upload-mp3-files', async () => {
  if (!mainWindow) return [];

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'MP3 Files', extensions: ['mp3'] }],
  });

  if (result.canceled) return [];

  const uploadedFiles = [];

  for (const filePath of result.filePaths) {
    try {
      const fileName = path.basename(filePath);
      const destinationPath = path.join(MUSIC_FOLDER, fileName);
      await fs.promises.copyFile(filePath, destinationPath);
      console.log(`Uploaded: ${fileName}`);
      uploadedFiles.push(fileName);
    } catch (err) {
      console.error(`Error uploading ${filePath}:`, err);
    }
  }

  return uploadedFiles;
});

async function safeParseFile(filePath, retries = 5, delay=300) { // złapać moment kiedy plik jest gotowy/przekopiowany do folderu // nie dawać sztywnego czasu // observable - zmienna która // observer behavior
  for (let i = 0; i < retries; i++) {
    try {
      return await mm.parseFile(filePath);
    } catch (err) {
      if(err.code === 'EBUSY' || err.code === 'ENOENT') {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw err; 
      }
    }
  }
  throw new Error(`Failed to parse file after ${retries} retries: ${filePath}`);
}
ipcMain.handle('load-all-mp3-files', async () => {
  try {
    const files = await fs.promises.readdir(MUSIC_FOLDER);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    const metadataArray = [];

    for (const fileName of mp3Files) {
      const filePath = path.join(MUSIC_FOLDER, fileName);
        try {
        const metadata = await safeParseFile(filePath);
        metadataArray.push({
          filePath: pathToFileURL(filePath).toString(),
          fileName,
          title: metadata.common.title || path.basename(fileName, '.mp3'),
          artist: metadata.common.artist || 'Unknown Artist',
          album: metadata.common.album || 'Unknown Album',
          year: metadata.common.year || '',
          duration: metadata.format.duration || 0,
        });
      } catch (err) {
        console.error(`Error reading metadata for ${fileName}:`, err);
        metadataArray.push({
          filePath: pathToFileURL(filePath).toString(),
          fileName,
          title: path.basename(fileName, '.mp3'),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          year: '',
          duration: 0,
        });
      }
    }

    return metadataArray;
  } catch (err) {
    console.error('Error reading music folder:', err);
    return [];
  }
});

ipcMain.handle('delete-mp3-file', async (event, fileName) => {
  try {
    const filePath = path.join(MUSIC_FOLDER, fileName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`Deleted: ${fileName}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error deleting ${fileName}:`, err);
    return false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
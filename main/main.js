const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');

let mainWindow;
const MUSIC_FOLDER = path.join(__dirname, '../assets/music');

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
  if (!fs.existsSync(MUSIC_FOLDER)) {
    fs.mkdirSync(MUSIC_FOLDER, { recursive: true });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

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
      
      //fs.copyFileSync(filePath, destinationPath);
      await fs.promises.copyFile(filePath, destinationPath);
      console.log(`Uploaded: ${fileName}`);
      uploadedFiles.push(fileName);
      
    } catch (err) {
      console.error(`Error uploading ${filePath}:`, err);
    }
  }

  return uploadedFiles;
});

const { pathToFileURL } = require('url');

ipcMain.handle('load-all-mp3-files', async () => {
  try {
    const files = await fs.promises.readdir(MUSIC_FOLDER);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    const metadataArray = [];

    for (const fileName of mp3Files) {
      const filePath = path.join(MUSIC_FOLDER, fileName);
      try {
        const metadata = await mm.parseFile(filePath);
        metadataArray.push({
          filePath: pathToFileURL(filePath).toString(), // ✅ safer than `file://`
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

// ipcMain.handle('load-all-mp3-files', async () => {
//   try {
//     const files = await fs.promises.readdir(MUSIC_FOLDER);
//     const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
//     const metadataArray = [];
     
//     for (const fileName of mp3Files) {
//       const filePath = path.join(MUSIC_FOLDER, fileName);
//       const { pathToFileURL } = require('url');
//       try {
//         const metadata = await mm.parseFile(filePath);
//         metadataArray.push({
//           filePath: pathToFileURL(filePath).toString(), //`file://${filePath}`,
//           fileName,
//           title: metadata.common.title || path.basename(fileName, '.mp3'),
//           artist: metadata.common.artist || 'Unknown Artist',
//           album: metadata.common.album || 'Unknown Album',
//           year: metadata.common.year || '',
//           duration: metadata.format.duration || 0,
//         });
//       } catch (err) {
//         console.error(`Error reading metadata for ${fileName}:`, err);
//         metadataArray.push({
//           filePath: `file://${filePath}`,
//           fileName,
//           title: path.basename(fileName, '.mp3'),
//           artist: 'Unknown Artist',
//           album: 'Unknown Album',
//           year: '',
//           duration: 0,
//         });
//       }
//     }
//   return metadataArray;
//   } catch (err) {
//     console.error('Error reading music folder:', err);
//     return [];
//   }
// });

ipcMain.handle('delete-mp3-file', async (event, fileName) => {
  try {
    const filePath = path.join(MUSIC_FOLDER, fileName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      //fs.unlinkSync(filePath);
      console.log(`Deleted: ${fileName}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error deleting ${fileName}:`, err);
    return false;
  }
});
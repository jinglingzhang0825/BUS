const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Set up data directory
const userDataPath = app.getPath('userData');
const notesDir = path.join(userDataPath, 'notes');

if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for note operations
ipcMain.handle('get-notes', async () => {
  const noteFiles = fs.readdirSync(notesDir).filter(file => file.endsWith('.json'));
  const notes = [];
  
  for (const file of noteFiles) {
    const filePath = path.join(notesDir, file);
    const data = fs.readFileSync(filePath, 'utf8');
    notes.push(JSON.parse(data));
  }
  
  return notes;
});

ipcMain.handle('save-note', async (event, note) => {
  const filePath = path.join(notesDir, `${note.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(note, null, 2));
  return { success: true };
});

ipcMain.handle('delete-note', async (event, noteId) => {
  const filePath = path.join(notesDir, `${noteId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return { success: true };
  }
  return { success: false };
});
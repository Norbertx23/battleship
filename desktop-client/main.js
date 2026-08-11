const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const DEFAULT_URL = 'https://battleship.swistak.fun/';
const GAME_URL = process.env.BATTLESHIP_URL || DEFAULT_URL;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Battleship',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        backgroundColor: '#0a0a12',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadURL(GAME_URL).catch((err) => {
        console.error('Nie udalo sie zaladowac', GAME_URL, err);
        showOffline();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        if (validatedURL && validatedURL.includes('offline.html')) return;
        console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
        showOffline();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

function showOffline() {
    mainWindow.loadFile(path.join(__dirname, 'offline.html'), {
        query: { url: GAME_URL }
    });
}

app.whenReady().then(() => {
    console.log('Laczenie z:', GAME_URL);
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

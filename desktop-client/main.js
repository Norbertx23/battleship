const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

const GAME_URL = 'http://192.168.1.200/battleship_net/';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Battleship',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        autoHideMenuBar: true,
    });

    mainWindow.loadURL(GAME_URL).catch((err) => {
        console.error('Failed to load GAME_URL:', err);
        mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
        if (!validatedURL.includes('offline.html')) {
            mainWindow.loadFile(path.join(__dirname, 'offline.html'));
        }
    });
}

app.whenReady().then(() => {
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

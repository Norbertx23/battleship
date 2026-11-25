const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const DEFAULT_URL = 'https://battleship.swistak.fun/';
const GAME_URL = process.env.BATTLESHIP_URL || DEFAULT_URL;
const GAME_ORIGIN = new URL(GAME_URL).origin;
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');
const OFFLINE_URL = pathToFileURL(OFFLINE_PAGE).href;

function isWebUrl(url) {
    try {
        return ['https:', 'http:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

function isGameUrl(url) {
    try {
        return new URL(url).origin === GAME_ORIGIN;
    } catch {
        return false;
    }
}

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
            contextIsolation: true,
            sandbox: true,
            webSecurity: true
        },
        autoHideMenuBar: true
    });

    mainWindow.loadURL(GAME_URL).catch((err) => {
        console.error('Failed to load', GAME_URL, err);
        showOffline();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        if (validatedURL && validatedURL.includes('offline.html')) return;
        console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
        showOffline();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isWebUrl(url)) shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (isGameUrl(url) || url.startsWith(OFFLINE_URL)) return;
        event.preventDefault();
        if (isWebUrl(url)) shell.openExternal(url);
    });
}

function showOffline() {
    mainWindow.loadFile(OFFLINE_PAGE, {
        query: { url: GAME_URL }
    });
}

app.whenReady().then(() => {
    console.log('Connecting to', GAME_URL);
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

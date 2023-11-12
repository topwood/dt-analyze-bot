/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const fs = require('node:fs');

const chainBroswerMap = {
  eth: 'https://etherscan.io/address/{{address}}',
  bsc: 'https://bscscan.com/address/{{address}}',
};

type chain = 'eth' | 'bsc';

app.disableHardwareAcceleration();

const isValidAddress = (address: string) => {
  return true;
};

process.on('uncaughtException', function (error) {
  // 这里可以处理错误，例如
  console.log('捕获一个exception:', error);
});

let ethWin: BrowserWindow;

const DEFAULT_ETH_URL =
  'https://etherscan.io/address/0x6b98be10e7bc8538130f7e58620d875a7ce6e0a8';

// const DEFAULT_ETH_URL =
//   'https://etherscan.io/advanced-filter?fadd=0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f&tadd=0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f&txntype=2';

const createEthWindow = (event: any) => {
  console.log('正在打开以太坊窗口...');
  ethWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
  });

  ethWin.loadURL(DEFAULT_ETH_URL);

  ethWin.webContents.on(
    'did-fail-load',
    (e, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // 在这里你可以处理错误
      console.log(
        `An error (${errorCode}) occurred while loading: ${validatedURL}. Description: ${errorDescription}`,
      );
    },
  );

  session.defaultSession.webRequest.onCompleted(
    { urls: [DEFAULT_ETH_URL] },
    (details) => {
      if (details.statusCode === 403) {
        ethWin.show();
      }
      console.log(
        `Response for ${details.method} ${details.url} - Status: ${details.statusCode}`,
      );
    },
  );

  session.defaultSession.webRequest.onErrorOccurred(
    { urls: [DEFAULT_ETH_URL] },
    (details) => {
      console.log(
        `Failed to load ${details.method} ${details.url} - Error: ${details.error}`,
      );
      event.reply('get-wallet-age', `error: 请检查您的代理设置！`);
    },
  );
};

function getWalletAge(event: any, address: string, chain: chain) {
  if (!isValidAddress(address)) {
    return;
  }

  const fetchHTML = `
      new Promise((resolve, reject) => {
        fetch('https://etherscan.io/address/${address}').then(res => {
          resolve(res.text())
        })
      });
    `;

  ethWin.webContents.executeJavaScript(fetchHTML).then((html = '') => {
    // 识别是合约
    if (html.includes('Creator')) {
      event.reply('get-wallet-age', `${address}#contract`);
      return;
    }

    const regex = /from .*? ago/g;
    let matches = html.match(regex) || [];
    // 没有交易记录
    if (!matches || matches.length === 0) {
      matches = ['null'];
    }
    matches = matches
      .filter((item: string) => item.length < 40)
      .filter((item: string) => !item.includes('from more than one'));

    // 匹配以太坊价值
    let regEthValue = /(?<=<\/h4>\s*\$)[\d,]+\.\d{2}(?=\s*<span)/g;

    let ethValue = 0;
    let matchesEthValue = html.match(regEthValue);
    if (matchesEthValue) {
      let numberAsText = matchesEthValue[0];
      let number = parseFloat(numberAsText.replace(/,/g, ''));
      ethValue = number;
    }

    // 匹配代币价值
    let tokenValue = 0;
    let regTokenValue =
      /(?<=Token Holdings([\s\S]*?)\$)[\d,]+\.\d{2}(?=\s*<span)/gs;

    let matchesTokenValue = html.match(regTokenValue);
    if (matchesTokenValue) {
      let numberAsText = matchesTokenValue[0];
      let number = parseFloat(numberAsText.replace(/,/g, ''));
      tokenValue = number;
    }

    event.reply(
      'get-wallet-age',
      `${address}#${matches.join('|')}#${ethValue + tokenValue}`,
    );
  });
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('get-wallet-age', async (event, address, chain) => {
  if (!ethWin) {
    createEthWindow(event);
    setTimeout(() => {
      getWalletAge(event, address, chain);
    }, 1000);
  } else {
    await getWalletAge(event, address, chain);
  }
});

ipcMain.on('analyze-contract', async (event, contractAddress) => {
  console.log('analyze-contract......', contractAddress);
  event.reply('analyze-contract', `test${contractAddress}`);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const createWindow = async () => {
  // if (isDebug) {
  //   await installExtensions();
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

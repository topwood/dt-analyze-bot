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
import { app, BrowserWindow, shell, ipcMain } from 'electron';
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

function getWalletAge(event: any, address: string, chain: chain) {
  if (!isValidAddress(address)) {
    return;
  }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      offscreen: true,
    },
  });

  win.loadURL(chainBroswerMap[chain].replace('{{address}}', address));

  win.webContents.on(
    'did-fail-load',
    (e, errorCode, errorDescription, validatedURL, isMainFrame) => {
      // 在这里你可以处理错误
      console.log(
        `An error (${errorCode}) occurred while loading: ${validatedURL}. Description: ${errorDescription}`,
      );
      event.reply('get-wallet-age', `error-${errorCode}-${errorDescription}`);
    },
  );

  win.webContents.on('did-finish-load', () => {
    const checkElement = `
      new Promise((resolve, reject) => {
        let maxTryTimes = 20;
        const interval = setInterval(() => {
          maxTryTimes -= 1;
          if (maxTryTimes === 0) {
            resolve('timeout');
            return;
          }

          let contractExist = document.querySelectorAll('.d-md-none.d-lg-inline-block.me-1');
          // 先判断是否是一个合约
          for (let i = 0, max = contractExist.length; i < max; i++) {
            if (contractExist[i].textContent.indexOf("Contract") !== -1) {
              resolve('contract');
              return;
            }
          }

          let allNotExist = document.querySelectorAll(".card-body.d-flex.flex-column.gap-5 .text-cap.mb-1.mt-1");

          // 先判断是否没有历史交易的
          for (let i = 0, max = allNotExist.length; i < max; i++) {
            if (allNotExist[i].textContent.indexOf("No Txns Sent From This Address") !== -1) {
              resolve(null);
              return;
            }
          }

          let elements = [];
          let all = document.querySelectorAll(".d-flex.align-items-center.gap-1 .text-muted");
          // 遍历所有元素
          for (let i = 0, max = all.length; i < max; i++) {
            if (all[i].textContent.indexOf("ago") !== -1) {
              elements.push(all[i].textContent);
            }
          }
          if (elements.length > 0) {
            clearInterval(interval);
            if (elements[1]) {
              resolve(elements[1]);
            } else {
              resolve(elements[0]);
            }
          }
        }, 500); // 每500 ms检查一次
      });
    `;

    win.webContents.executeJavaScript(checkElement).then((msg) => {
      event.reply('get-wallet-age', `${address}#${msg}`);
      win.close();
    });
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
  await getWalletAge(event, address, chain);
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

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

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

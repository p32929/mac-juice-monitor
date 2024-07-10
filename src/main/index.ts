import { app, shell, BrowserWindow, ipcMain, Tray, nativeImage, NativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import appIconPath from '../../resources/icon_512x512.png?asset'
import mouseIconPath from '../../resources/mouse.png?asset'
import keyboardIconPath from '../../resources/keyboard.png?asset'
import headphonesIconPath from '../../resources/headphones.png?asset'
import bluetoothIconPath from '../../resources/bluetooth.png?asset'
import greenMouseIconPath from '../../resources/green_mouse.png?asset'
import greenKeyboardIconPath from '../../resources/green_keyboard.png?asset'
import greenHeadphonesIconPath from '../../resources/green_headphones.png?asset'
import greenBluetoothIconPath from '../../resources/green_bluetooth.png?asset'
import { getBatteryInfo } from './battery' // Assume you have a function to get battery info
import { BatteryInfo, Constants } from '../renderer/src/globals'

interface Trays {
  [key: string]: Tray
}

let trays: Trays = {}
let mainWindow: BrowserWindow | null = null

function enableAutoLaunch(): void {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
    args: []
  })
}

function exitApp() {
  Object.keys(trays).forEach((device) => {
    trays[device].destroy()
    delete trays[device]
  })

  process.exit()
}

// function disableAutoLaunch(): void {
//   app.setLoginItemSettings({
//     openAtLogin: false
//   })
// }

if (!is.dev) {
  enableAutoLaunch()
}

function getIcon(deviceName: string, charging: boolean): NativeImage {
  if (deviceName.includes('Mouse')) {
    return nativeImage.createFromPath(charging ? greenMouseIconPath : mouseIconPath)
  } else if (deviceName.includes('Keyboard')) {
    return nativeImage.createFromPath(charging ? greenKeyboardIconPath : keyboardIconPath)
  } else if (
    deviceName.includes('Headphone') ||
    deviceName.includes('Headset') ||
    deviceName.includes('AirPods')
  ) {
    return nativeImage.createFromPath(charging ? greenHeadphonesIconPath : headphonesIconPath)
  } else {
    return nativeImage.createFromPath(charging ? greenBluetoothIconPath : bluetoothIconPath) // Default icon if no specific match
  }
}

function createTray(deviceName: string, charging: boolean): Tray {
  const tray = new Tray(getIcon(deviceName, charging))
  tray.setTitle(`${deviceName}: ...`)
  return tray
}

function updateTray(deviceName: string, percentage: string, charging: boolean): void {
  if (trays[deviceName]) {
    const icon = getIcon(deviceName, charging)
    trays[deviceName].setImage(icon)
    trays[deviceName].setTitle(`${percentage}%`)
  } else {
    console.error(`Tray for ${deviceName} not found`)
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    skipTaskbar: true,
    fullscreenable: false,
    icon: process.platform === 'linux' ? appIconPath : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('ready-to-show', () => {
    if (!app.getLoginItemSettings().wasOpenedAtLogin) {
      mainWindow?.show()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('get-battery-info', () => {
    return getBatteryInfo()
  })

  createWindow()

  const updateBatteryInfo = () => {
    const batteryInfo: BatteryInfo = getBatteryInfo()

    Object.keys(batteryInfo).forEach((device) => {
      const charging = !batteryInfo[device].discharging
      if (!trays[device]) {
        trays[device] = createTray(device, charging)
      }
      if (batteryInfo[device].percentage) {
        updateTray(device, batteryInfo[device].percentage, charging)
      }
    })

    Object.keys(trays).forEach((device) => {
      if (!batteryInfo[device]) {
        trays[device].destroy()
        delete trays[device]
      }
    })
  }

  updateBatteryInfo()
  setInterval(updateBatteryInfo, Constants.INTERVAL_MS)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  process.on('SIGINT', () => {
    exitApp()
  })
})

app.on('window-all-closed', () => {
  exitApp()
})

app.on('before-quit', async () => {
  exitApp()
})

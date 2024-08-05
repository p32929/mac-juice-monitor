import { app, shell, BrowserWindow, ipcMain, Tray, nativeImage, NativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import appIconPath from '../../resources/icon_512x512.png?asset'
import mouseIconPath from '../../resources/mouse.png?asset'
import keyboardIconPath from '../../resources/keyboard.png?asset'
import headphonesIconPath from '../../resources/headphones.png?asset'
import bluetoothIconPath from '../../resources/bluetooth.png?asset'
import greenMouseIconPath from '../../resources/green_mouse.png?asset'
import greenKeyboardIconPath from '../../resources/green_keyboard.png?asset'
import greenHeadphonesIconPath from '../../resources/green_headphones.png?asset'
import greenBluetoothIconPath from '../../resources/green_bluetooth.png?asset'
import redMouseIconPath from '../../resources/red_mouse.png?asset'
import redKeyboardIconPath from '../../resources/red_keyboard.png?asset'
import redHeadphonesIconPath from '../../resources/red_headphones.png?asset'
import redBluetoothIconPath from '../../resources/red_bluetooth.png?asset'
import { getBatteryInfo } from './battery'
import { BatteryInfo, Constants } from '../renderer/src/globals'

interface Trays {
  [key: string]: Tray
}

let trays: Trays = {}
let mainWindow: BrowserWindow | null = null
let sliderValue: number = 0
const minimumBatteryDefault = 20 //%

const sliderValueFilePath = join(app.getPath('userData'), 'slider-value.json')

function saveSliderValue(value: number) {
  fs.writeFileSync(sliderValueFilePath, JSON.stringify({ value }))
}

function loadSliderValue() {
  const isFileExists = fs.existsSync(sliderValueFilePath)
  if (isFileExists) {
    const data = fs.readFileSync(sliderValueFilePath, 'utf-8')
    const parsed = JSON.parse(data)
    sliderValue = parsed.value ?? minimumBatteryDefault
  } else {
    sliderValue = minimumBatteryDefault
  }
}

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

if (!is.dev) {
  enableAutoLaunch()
}

function getIcon(deviceName: string, percentage: number, charging: boolean): NativeImage {
  let iconPath: string

  if (charging) {
    if (deviceName.includes('Mouse')) {
      iconPath = greenMouseIconPath
    } else if (deviceName.includes('Keyboard')) {
      iconPath = greenKeyboardIconPath
    } else if (
      deviceName.includes('Headphone') ||
      deviceName.includes('Headset') ||
      deviceName.includes('AirPods')
    ) {
      iconPath = greenHeadphonesIconPath
    } else {
      iconPath = greenBluetoothIconPath
    }
  } else {
    if (percentage < sliderValue) {
      if (deviceName.includes('Mouse')) {
        iconPath = redMouseIconPath
      } else if (deviceName.includes('Keyboard')) {
        iconPath = redKeyboardIconPath
      } else if (
        deviceName.includes('Headphone') ||
        deviceName.includes('Headset') ||
        deviceName.includes('AirPods')
      ) {
        iconPath = redHeadphonesIconPath
      } else {
        iconPath = redBluetoothIconPath
      }
    } else {
      if (deviceName.includes('Mouse')) {
        iconPath = mouseIconPath
      } else if (deviceName.includes('Keyboard')) {
        iconPath = keyboardIconPath
      } else if (
        deviceName.includes('Headphone') ||
        deviceName.includes('Headset') ||
        deviceName.includes('AirPods')
      ) {
        iconPath = headphonesIconPath
      } else {
        iconPath = bluetoothIconPath
      }
    }
  }

  return nativeImage.createFromPath(iconPath)
}

function createTray(deviceName: string, percentage: number, charging: boolean): Tray {
  const tray = new Tray(getIcon(deviceName, percentage, charging))
  tray.setTitle(`${deviceName}: ...`)
  return tray
}

function updateTray(deviceName: string, percentage: string, charging: boolean): void {
  if (trays[deviceName]) {
    const icon = getIcon(deviceName, parseInt(percentage), charging)
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

  ipcMain.handle('get-slider-value', () => {
    return sliderValue
  })

  ipcMain.handle('set-slider-value', (_, value: number) => {
    sliderValue = value
    saveSliderValue(value)
  })

  createWindow()

  const updateBatteryInfo = () => {
    const batteryInfo: Record<string, BatteryInfo> = getBatteryInfo()

    Object.keys(batteryInfo).forEach((device) => {
      const charging = !batteryInfo[device].discharging
      if (!trays[device]) {
        trays[device] = createTray(
          device,
          parseInt(batteryInfo[device].percentage ?? '0'),
          charging
        )
      }
      if (batteryInfo[device].percentage) {
        updateTray(device, batteryInfo[device].percentage ?? '0', charging)
      }
    })

    Object.keys(trays).forEach((device) => {
      if (!batteryInfo[device]) {
        trays[device].destroy()
        delete trays[device]
      }
    })
  }

  loadSliderValue()
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

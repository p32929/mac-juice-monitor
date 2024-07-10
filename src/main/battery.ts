import { execSync } from 'child_process'
import { BatteryInfo } from '../renderer/src/globals'

function parseIoregOutput(output: string): Record<string, BatteryInfo> {
  const batteryInfo: Record<string, BatteryInfo> = {}
  const deviceRegex = /"Product" = "([^"]+)"/g
  const batteryRegex = /"BatteryPercent" = (\d+)/g
  const chargingRegex = /"BatteryStatusFlags" = (\d+)/g
  const vendorIDRegex = /"VendorID" = (\d+)/g
  const productIDRegex = /"ProductID" = (\d+)/g
  const serialNumberRegex = /"SerialNumber" = "([^"]+)"/g
  const addressRegex = /"DeviceAddress" = "([^"]+)"/g

  let match
  const devices: string[] = []
  while ((match = deviceRegex.exec(output)) !== null) {
    devices.push(match[1])
  }

  let batteryMatch, chargingMatch, vendorIDMatch, productIDMatch, serialNumberMatch, addressMatch
  const batteryLevels: string[] = []
  const chargingStatuses: boolean[] = []
  const vendorIDs: string[] = []
  const productIDs: string[] = []
  const serialNumbers: string[] = []
  const addresses: string[] = []

  while ((batteryMatch = batteryRegex.exec(output)) !== null) {
    batteryLevels.push(batteryMatch[1])
  }

  while ((chargingMatch = chargingRegex.exec(output)) !== null) {
    chargingStatuses.push(chargingMatch[1] === '0')
  }

  while ((vendorIDMatch = vendorIDRegex.exec(output)) !== null) {
    vendorIDs.push(vendorIDMatch[1])
  }

  while ((productIDMatch = productIDRegex.exec(output)) !== null) {
    productIDs.push(productIDMatch[1])
  }

  while ((serialNumberMatch = serialNumberRegex.exec(output)) !== null) {
    serialNumbers.push(serialNumberMatch[1])
  }

  while ((addressMatch = addressRegex.exec(output)) !== null) {
    addresses.push(addressMatch[1])
  }

  for (let i = 0; i < devices.length; i++) {
    const key = `${vendorIDs[i]}:${productIDs[i]}`
    batteryInfo[key] = {
      name: devices[i],
      percentage: batteryLevels[i],
      discharging: chargingStatuses[i],
      vendorID: vendorIDs[i],
      productID: productIDs[i],
      serialNumber: serialNumbers[i],
      address: addresses[i] ? addresses[i].replace(/-/g, ':') : undefined
    }
  }

  console.log('Parsed ioregOutput:', batteryInfo)
  return batteryInfo
}

function parseBluetoothOutput(output: string): Record<string, BatteryInfo> {
  const devices: Record<string, BatteryInfo> = {}

  const deviceSections = output.split(/(?=^\s*\S+’s [\w\s]+:)/m)

  const deviceNameRegex = /^\s*(\S+’s [\w\s]+):/m
  const deviceAddressRegex = /Address: ([\w:]+)/
  const vendorIDRegex = /Vendor ID: (0x[\w]+)/
  const productIDRegex = /Product ID: (0x[\w]+)/
  const firmwareVersionRegex = /Firmware Version: ([\w.]+)/
  const servicesRegex = /Services: (.+)/

  deviceSections.forEach((section) => {
    const nameMatch = section.match(deviceNameRegex)
    const addressMatch = section.match(deviceAddressRegex)
    const vendorIDMatch = section.match(vendorIDRegex)
    const productIDMatch = section.match(productIDRegex)
    const firmwareVersionMatch = section.match(firmwareVersionRegex)
    const servicesMatch = section.match(servicesRegex)

    if (nameMatch && addressMatch && vendorIDMatch && productIDMatch) {
      const key = `${vendorIDMatch[1]}:${productIDMatch[1]}`
      devices[key] = {
        name: nameMatch[1].replace(':', '').trim(),
        address: addressMatch[1],
        vendorID: vendorIDMatch[1],
        productID: productIDMatch[1]
      }
    }
  })

  // console.log('Parsed btOutput:', devices)
  return devices
}

export function getBatteryInfo(): Record<string, BatteryInfo> {
  try {
    const ioregOutput = execSync('ioreg -c AppleDeviceManagementHIDEventService -r -l').toString()
    const batteryInfo = parseIoregOutput(ioregOutput)

    const btOutput = execSync('system_profiler SPBluetoothDataType').toString()
    const btDevices = parseBluetoothOutput(btOutput)

    const mergedBatteryInfo: Record<string, BatteryInfo> = {}

    for (const btDeviceKey in btDevices) {
      const btDevice = btDevices[btDeviceKey]
      // console.log(`Matching btDeviceKey: ${btDeviceKey} with btDevice:`, btDevice)

      const btAddress = btDevice.address?.split('-').join('').split(':').join('').toLowerCase()

      for (const batteryDeviceKey in batteryInfo) {
        const batteryDevice = batteryInfo[batteryDeviceKey]
        // console.log(
        //   `Checking batteryDeviceKey: ${batteryDeviceKey} with batteryDevice:`,
        //   batteryDevice
        // )

        const batteryAddress = batteryDevice.address
          ?.split('-')
          .join('')
          .split(':')
          .join('')
          .toLowerCase()

        if (btAddress === batteryAddress) {
          mergedBatteryInfo[btDevice.name ?? ''] = {
            ...btDevice,
            percentage: batteryDevice.percentage,
            discharging: batteryDevice.discharging,
            serialNumber: batteryDevice.serialNumber
          }
          break
        } else {
          mergedBatteryInfo[btDevice.name ?? ''] = btDevice
        }
      }
    }

    // console.log('Merged Battery Info:', mergedBatteryInfo)
    return mergedBatteryInfo
  } catch (error) {
    console.error('Failed to get battery info', error)
    return {}
  }
}

export interface DeviceInfo {
  percentage: string
  discharging: boolean
  vendorID: string
  productID: string
  serialNumber: string
}

export interface BatteryInfo {
  name?: string
  percentage?: string
  discharging?: boolean
  vendorID?: string
  productID?: string
  serialNumber?: string
  address?: string
}

export class Constants {
  public static readonly INTERVAL_MS = 2000
}

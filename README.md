# MacJuiceMonitor

A small macOS menu bar app that shows the battery level of your Bluetooth mouse, keyboard and AirPods, so they don't die in the middle of your work. No more digging into System Settings to check: the levels sit in the top-right corner of your screen.

> Battery levels work best with Apple devices (Magic Mouse, Magic Keyboard, AirPods). Other devices show up only if they report their battery over Bluetooth.

## Screenshots

![MacJuiceMonitor window](https://github.com/user-attachments/assets/2a58378e-0468-471b-a67e-27308586fca3)

![MacJuiceMonitor in the menu bar](https://github.com/user-attachments/assets/5d05e452-b298-4833-90dc-c4f4dde517ce)

## Features

1. **Every Bluetooth battery at a glance,** right in the menu bar.
2. **Shows when a device is charging.**
3. **Red icons when a battery is low,** below a level you pick with a slider.
4. **Starts at login** and keeps running in the menu bar when you close the window.
5. **Light on your Mac:** it reads the battery levels macOS already knows, using `ioreg` and `system_profiler`.

## Install

1. Download the `.dmg` from the [latest release](https://github.com/p32929/mac-juice-monitor/releases/latest). It is built for Apple Silicon Macs.
2. Open it and drag MacJuiceMonitor into Applications.
3. Run it. Closing the window keeps it running in the menu bar.

## If it doesn't start at login

1. Open **System Settings** and search for **Open at Login**.
2. Add `mac-juice-monitor` to the Open at Login items.
3. If it still doesn't start, remove it from the list and add it again.

## Build it yourself

```bash
git clone https://github.com/p32929/mac-juice-monitor.git
cd mac-juice-monitor
yarn
yarn dev          # run in development
yarn build:mac    # make the .dmg
```

## Planned

1. Choose which devices show as icons in the menu bar.

## License

MIT License — Copyright (c) 2024 Fayaz Bin Salam. See [LICENSE](LICENSE) for the full text.

App icon from [Flaticon](https://www.flaticon.com/free-icon/wireless-charger_4978408).

## Contributing

Contributions are very welcome, thank you! Before you start on a pull request, please open an issue and tell me what you would like to add or change. That way we can agree on it first, and your time is not wasted on something that might not fit. Thanks for helping make MacJuiceMonitor better.

## Share

<a href="https://p32929.github.io/share/?repo=mac-juice-monitor"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/share-dark.svg"><img src="https://p32929.github.io/readme/share-light.svg" alt="Share this with your friends in just a click" width="420"></picture></a>

## Support

<a href="https://p32929.github.io/support/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://p32929.github.io/readme/support-dark.svg"><img src="https://p32929.github.io/readme/support-light.svg" alt="If you like my works and want to support me, feel free to support" width="420"></picture></a>

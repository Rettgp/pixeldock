<div align="center">
  <!-- Placeholder Logo -->
  <img src="assets/icons/1024x1024.png" alt="PixelDock Logo" width="256"/>

  <p><em>A sleek and unified desktop launcher for all your games — Steam and beyond.</em></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/version-1.0.2-blue" alt="Version"/>
    <img src="https://img.shields.io/badge/react-19.0.0-61DAFB?logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/electron-35.0.2-47848F?logo=electron" alt="Electron"/>
  </p>
</div>

---

## 🚀 Features

- 🎮 **Steam Integration** – Auto-detect and display all your installed Steam games, across every Steam library folder.
- 🎡 **Game Dial** – A half dial of game icons docked to the screen edge that scrolls endlessly and stays out of your wallpaper's way.
- ✨ **Hover to Preview** – Each icon grows into the game's hero art and logo; one click launches it.
- 🖱️ **One-Click Launch** – Launch any game instantly with a single click.
- ➕ **Non-Steam Games** – Games you add to Steam with "Add a Non-Steam Game" show up automatically, with SteamGridDB/SGDBoop artwork.
- 🔄 **Live Library** – Installs, uninstalls, new shortcuts and new artwork appear without restarting.
- 🗂️ **Unified Launcher** – One interface for all your games, from any platform.

---

## 📸 Demo

<table align="center">
  <tr>
    <td align="center"><img src="./docs/media/dial-hover.gif" alt="Hovering a game icon grows it into the game's hero art" width="280"></td>
    <td align="center"><img src="./docs/media/dial-scroll.gif" alt="Scrolling the endless game dial" width="280"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Hover to preview</b> · icons bloom into hero art</sub></td>
    <td align="center"><sub><b>Endless dial</b> · smooth, wrap-around scrolling</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="./docs/media/setup.gif" alt="First-run setup wizard" width="280"></td>
    <td align="center"><img src="./docs/media/settings.png" alt="Settings panel" width="280"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>First-run setup</b> · Steam paths detected and validated</sub></td>
    <td align="center"><sub><b>Settings</b> · paths, monitor and library at a glance</sub></td>
  </tr>
</table>

---

## 🧰 Tech Stack

- **Electron** – Native desktop shell
- **React** – Frontend UI
- **TypeScript** – Type safety for reliability
- **PouchDB** – Local storage

---

## 📦 Installation

Download `PixelDock-Setup-<version>.exe` from the
[latest release](https://github.com/rettgp/pixeldock/releases/latest) and run it.

> [!NOTE]
> **Seeing "Windows protected your PC"?** Microsoft Defender SmartScreen shows this
> for apps it hasn't seen many downloads of yet. Click **More info → Run anyway**.
> PixelDock is open source; you can review the code or build it yourself below.

### Build from source

```bash
git clone https://github.com/rettgp/pixeldock.git
cd pixeldock
npm install
npm run start
```

Maintainers: see [docs/RELEASING.md](docs/RELEASING.md) for publishing, code signing and winget.

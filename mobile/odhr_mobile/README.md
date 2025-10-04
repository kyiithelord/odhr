# ODHR Mobile (React Native / Expo)

Cross-platform mobile app for iOS and Android that connects to your Odoo 18 backend via the ODHR addon JSON API.

## Prerequisites
- Node.js 18+
- npm or yarn (npm examples below)
- Expo CLI (installed via `npx` on demand)
- iOS Simulator (Xcode) or Android Emulator (Android Studio), or the Expo Go app on a real device

## Install dependencies
```bash
npm install
```

## Run the app
```bash
npm run start
# then press: i (iOS simulator) or a (Android emulator)
```

## Configure API connection
On first launch, the Login screen asks for:
- Base URL (e.g., `http://localhost:8069` for iOS simulator, or your machine LAN IP for a real device)
- Login (your Odoo user email)
- API Key (create via Odoo → avatar → My Profile → Account Security → New API Key)

Notes:
- Android emulator cannot reach `localhost` on your host. Use `http://10.0.2.2:8069` for the Android emulator.
- For a physical device on the same network, use `http://<your-computer-LAN-IP>:8069` and ensure firewall allows it.
- For production, put Odoo behind HTTPS and use that URL.

## Features
- Login screen: stores Base URL, login and API key in secure storage
- Employees list: pagination + search calling `POST /odhr/api/employees`
- Employee detail: photo + contact/org info calling `POST /odhr/api/employees/<id>`

## Project structure
- `App.tsx` navigation stack
- `src/screens/` UI screens (Login, EmployeeList, EmployeeDetail)
- `src/services/api.ts` API client with Basic auth header
- `src/services/storage.ts` secure credential storage
- `src/config.ts` default API base URL

## Troubleshooting
- Dependencies/module not found errors: run `npm install` in this folder.
- Network errors: verify Odoo is running (`docker compose up -d` in project root) and the Base URL is reachable from your simulator/device.
- Android HTTP cleartext: Expo debug builds generally allow HTTP, but if you harden network security, ensure cleartext is permitted for dev or use HTTPS.
- Reanimated plugin: already enabled in `babel.config.js`.

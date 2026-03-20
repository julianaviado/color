# Hue Garden — Setup Guide

## Step 1 — Firebase (new project)

1. Go to https://console.firebase.google.com
2. Click **"Create a project"** → name it `hue-garden`
3. Disable Google Analytics for now (you can add it later)
4. Once created, click **"Add app"** → choose the **iOS** icon
5. Enter bundle ID: `com.huegarden.app`
6. Download `GoogleService-Info.plist` (you'll need this for the native build)
7. On the left sidebar → **Authentication** → **Get started** → enable **Email/Password**
8. On the left sidebar → **Firestore Database** → **Create database** → Start in **test mode** for now
9. On the left sidebar → **Project settings** → scroll to "Your apps" → copy the **config object**

Paste the config values into `src/utils/firebase.js`:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "hue-garden.firebaseapp.com",
  projectId: "hue-garden",
  storageBucket: "hue-garden.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```

---

## Step 2 — Claude API key

1. Go to https://console.anthropic.com
2. Create an API key
3. Paste it into `src/utils/claudeApi.js`:
```js
const CLAUDE_API_KEY = 'sk-ant-...';
```

If you have a fine-tuned model, replace `MODEL_ID` with your model's ID.

---

## Step 3 — App icons & splash

Replace the placeholder files in `assets/` with:
- `icon.png` — 1024×1024px (App Store icon, no rounded corners — Apple adds them)
- `splash.png` — 1284×2778px (iPhone 14 Pro Max size is safe)
- `adaptive-icon.png` — 1024×1024px (for Android)
- `favicon.png` — 48×48px (for web)

Use your brand colour `#FAF8F5` as the background.

---

## Step 4 — PP Editorial New font

You already have the font files on your Desktop. Copy the `.otf` or `.ttf` files here:
```
assets/fonts/
  PPEditorialNew-Regular.otf
  PPEditorialNew-Italic.otf
  PPEditorialNew-Ultralight.otf
```

Then add this to `App.js` (replace the current export):
```js
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';

export default function App() {
  const [fontsLoaded] = useFonts({
    'PPEditorialNew-Regular': require('./assets/fonts/PPEditorialNew-Regular.otf'),
    'PPEditorialNew-Italic':  require('./assets/fonts/PPEditorialNew-Italic.otf'),
  });
  if (!fontsLoaded) return <AppLoading />;
  // ... rest of return
}
```

---

## Step 5 — Run the app

```bash
cd ColorAnalysisApp
npx expo start
```

Scan the QR code with **Expo Go** on your iPhone.

> Note: Camera and photo picker features require a **dev build** (not Expo Go).
> To create a dev build for your device:
> ```bash
> npx eas build --profile development --platform ios
> ```
> Install the resulting `.ipa` on your device via TestFlight or direct install.

---

## Step 6 — TestFlight & App Store

Once ready:
```bash
npx eas build --profile production --platform ios
npx eas submit --platform ios
```

You'll need your Apple Developer account credentials in `eas.json`.

---

## Firestore security rules (before going live)

Replace test mode rules with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /savedColors/{docId} {
      allow read, write: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

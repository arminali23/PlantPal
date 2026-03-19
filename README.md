# PlantPal 🌿

A mobile-first plant identification and care app. Take a photo of any plant and instantly get its name, care instructions, and automatic watering reminders.

## Features

- **Plant Identification** — Photograph any plant and Claude AI identifies it with common name, scientific name, and a detailed description
- **Care Instructions** — Get tailored advice on sunlight, watering frequency, soil type, humidity, and temperature range
- **Watering Tracker** — Log watering events and see at a glance which plants are due, overdue, or recently watered
- **Push Notifications** — Automatic watering reminders scheduled based on each plant's needs
- **Plant Library** — Browse all your identified plants in a scrollable home feed
- **Web Support** — Runs in the browser via Expo Web in addition to iOS and Android

## Tech Stack

- [Expo](https://expo.dev) (SDK 52, file-based routing via Expo Router)
- [React Native](https://reactnative.dev)
- [Claude AI](https://anthropic.com) (`claude-sonnet-4-5` via `@anthropic-ai/sdk`) for plant identification
- `expo-image-picker` + `expo-image-manipulator` for camera/gallery access
- `expo-notifications` for watering reminders
- `@react-native-async-storage/async-storage` for local persistence

## Project Structure

```
plantpal/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Home — plant library
│   │   ├── camera.tsx       # Identify a new plant
│   │   └── settings.tsx     # App settings
│   ├── plant/
│   │   └── [id].tsx         # Plant detail & care info
│   └── _layout.tsx
├── components/
│   ├── PlantCard.tsx        # Card shown in the home feed
│   ├── WateringBadge.tsx    # Due / Overdue / OK status badge
│   └── LoadingOverlay.tsx   # Full-screen loading spinner
├── services/
│   ├── claude.ts            # Claude API call & response parsing
│   ├── storage.ts           # AsyncStorage + file system helpers
│   └── notifications.ts     # Expo push notification scheduling
├── types/
│   └── plant.ts             # Plant TypeScript interfaces
└── constants/
    └── prompts.ts           # Claude system & user prompt templates
```

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/plantpal.git
cd plantpal
npm install
```

### Configuration

Create a `.env.local` file in the project root:

```
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

### Running

```bash
# iOS / Android (requires Expo Go or a simulator)
npx expo start

# Web browser
npx expo start --web
```

## Usage

1. Open the **Identify** tab and tap **Upload Plant Photo** (or **Take Photo** on mobile)
2. Select a clear photo of the plant — it works best when the plant fills the frame
3. Wait a few seconds while Claude analyses the image
4. Review the identification result and full care guide
5. Tap **Water Now** on the detail screen whenever you water the plant
6. The home feed shows all your plants with colour-coded watering status badges

## Notes

- Camera capture is only available on native (iOS/Android). On web, use the file upload option.
- Push notifications are only supported on native devices.
- All plant data is stored locally on the device — nothing is sent to a server except the image sent to the Anthropic API for identification.

## License

MIT

# Momin Mahmood Lectures - Podcast App

A React Native (Expo) podcast app for streaming and downloading Islamic lectures from RSS feeds.

## Features

- **Multiple Shows**: Support for multiple podcast RSS feeds
- **Stream & Download**: Stream episodes online or download for offline listening
- **Full Player Controls**: Play/pause, seek forward/backward, playback speed (0.5x-2x)
- **Background Audio**: Continue listening with the app in background
- **Sleep Timer**: Auto-stop playback after a set time
- **Playlists**: Create custom playlists to organize episodes
- **Queue Management**: Add episodes to up-next queue
- **Resume Playback**: Automatically resume from where you left off
- **Dark Theme**: Beautiful dark UI optimized for reading Arabic text
- **Cross-Platform**: iOS, Android, and Web support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator

### Installation

```bash
cd momin-podcast-app
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# EAS configuration (One time only)
eas init
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Add `--local` to build on the local machine like this:
```bash
eas build --platform android --local
```

## Project Structure

```
momin-podcast-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Home - shows list
│   ├── show/[id].tsx       # Show episodes
│   ├── episode/[id].tsx    # Episode details
│   ├── player.tsx          # Full-screen player
│   ├── downloads.tsx       # Downloaded episodes
│   ├── playlists/          # Playlist screens
│   └── settings.tsx        # App settings
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── services/               # Business logic services
├── config/                 # App configuration
├── types/                  # TypeScript types
└── constants/              # App constants
```

## Adding New Podcast Feeds

### Option 1: Hardcoded (requires app update)

Edit `config/feeds.ts`:

```typescript
export const DEFAULT_FEEDS: FeedConfig[] = [
  {
    id: 'surah-anam',
    url: 'https://anchor.fm/s/10c9588e8/podcast/rss',
    name: 'سورة الانعام | درسِ قرآن',
  },
  // Add more feeds here
  {
    id: 'new-show',
    url: 'https://your-rss-feed-url.com/rss',
    name: 'New Show Name',
  },
];
```

### Option 2: Remote JSON (no app update needed)

1. Host a JSON file at a public URL:
```json
{
  "version": 1,
  "feeds": [
    { "id": "new-show", "url": "https://...", "name": "New Show" }
  ]
}
```

2. Update `REMOTE_FEEDS_URL` in `config/feeds.ts`:
```typescript
export const REMOTE_FEEDS_URL = 'https://yourusername.github.io/feeds.json';
```

## Tech Stack

- **Expo SDK 54** - React Native framework
- **Expo Router** - File-based navigation
- **expo-av** - Audio playback
- **expo-file-system** - File downloads
- **Zustand** - State management
- **react-native-mmkv** - Fast local storage
- **react-native-paper** - UI components
- **fast-xml-parser** - RSS parsing

# Momin Lectures - Islamic Audio Lecture App

## Overview

A React Native mobile app for Islamic lectures built with Expo. The app fetches lecture series from RSS feeds and provides a full-featured audio playback experience with offline support. Designed with an Islamic artistic theme featuring geometric patterns, emerald greens, and gold accents.

## Tech Stack

- **Framework**: Expo 54 (React Native 0.81.5)
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router 6 (file-based routing)
- **State Management**: Zustand 5 with AsyncStorage persistence
- **Audio**: expo-av
- **Storage**: @react-native-async-storage/async-storage
- **UI**: react-native-paper (Material Design 3)
- **Graphics**: react-native-svg (for Islamic geometric patterns)
- **RSS Parsing**: fast-xml-parser

## Project Structure

```
momin-podcast-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home - lecture series list
│   ├── show/[id].tsx      # Lecture series detail with lectures
│   ├── episode/[id].tsx   # Individual lecture detail
│   ├── player.tsx         # Full-screen player (modal)
│   ├── downloads.tsx      # Downloaded lectures
│   ├── settings.tsx       # App settings
│   └── playlists/
│       ├── index.tsx      # Playlists list
│       └── [id].tsx       # Playlist detail
├── stores/                 # Zustand stores
│   ├── playerStore.ts     # Playback state, queue, positions
│   ├── feedStore.ts       # Lecture series and lectures data
│   ├── downloadStore.ts   # Downloads tracking
│   ├── playlistStore.ts   # Playlist management
│   └── settingsStore.ts   # User preferences
├── services/
│   ├── audioService.ts    # expo-av wrapper singleton
│   ├── downloadService.ts # File download management
│   ├── rssParser.ts       # RSS/XML parsing
│   └── storage.ts         # AsyncStorage adapter for Zustand
├── hooks/
│   ├── useAudioPlayer.ts  # Audio playback hook
│   ├── useRSSFeed.ts      # Feed management hook
│   └── useDownloads.ts    # Download management hook
├── components/
│   ├── MiniPlayer.tsx     # Bottom mini player
│   └── IslamicPattern.tsx # Islamic geometric decorations (SVG)
├── config/
│   └── feeds.ts           # RSS feed configuration
├── constants/
│   └── index.ts           # Colors, settings, keys
└── types/
    └── index.ts           # TypeScript interfaces
```

## Islamic Theme & Design

The app features an Islamic-inspired visual design:

### Color Palette
- **Primary**: Emerald green (#1B7F4E) - representing paradise in Islamic tradition
- **Gold accent**: (#C9A227) - representing divine illumination
- **Background**: Deep dark green (#0A1612) - reminiscent of night sky
- **Surface**: (#122620) - traditional manuscript tones
- **Borders**: (#2A4A3E) - subtle geometric dividers

### Decorative Elements
- **Eight-pointed star (Rub el Hizb)**: Used as decorative icon throughout
- **Geometric corner accents**: Gold corner decorations on cards
- **Header decorations**: Centered star with extending lines
- **Border patterns**: Subtle geometric dividers

### Terminology
- "Shows" → "Lecture Series"
- "Episodes" → "Lectures"
- Seasons → "Parts" (for multi-part lecture series)

## Key Features

1. **Audio Playback**: Background playback, speed control (0.5x-2.0x), seek, sleep timer
2. **Downloads**: Offline playback with progress tracking
3. **Playlists**: Create and manage custom playlists
4. **Queue Management**: Add lectures to up-next queue
5. **Resume Playback**: Saves and restores playback position
6. **RSS Feed Sync**: Remote feed configuration via GitHub Gist

## Data Flow

1. RSS feeds configured in `config/feeds.ts` (hardcoded + remote)
2. `feedStore.refreshFeeds()` fetches and parses all feeds
3. Lecture series and lectures stored in Zustand with persistence
4. Audio playback managed through `audioService` singleton
5. Downloads stored to device via `expo-file-system`

## State Persistence

All Zustand stores use `persist` middleware with AsyncStorage adapter.

## Feed Configuration

Feeds can be:
1. Hardcoded in `config/feeds.ts` (DEFAULT_FEEDS)
2. Loaded remotely from REMOTE_FEEDS_URL (GitHub Gist JSON)

Remote feeds override defaults with matching IDs.

## Running the App

```bash
cd momin-podcast-app
npm install
npx expo start --clear    # Start Expo dev server
npx expo start --android  # Android
npx expo start --ios      # iOS
```

## Type Definitions

Key interfaces in `types/index.ts`:
- `FeedConfig`: RSS feed URL and metadata
- `Show`: Lecture series (parsed from RSS channel)
- `Episode`: Individual lecture with audio URL
- `DownloadedEpisode`: Lecture with local file path
- `Playlist`: User-created playlist
- `PlaybackPosition`: Saved playback position for resume
- `AppSettings`: User preferences

## Components

### IslamicPattern.tsx
SVG-based decorative components:
- `EightPointedStar`: Rub el Hizb star icon
- `HeaderDecoration`: Centered star with lines
- `GeometricBorder`: Decorative divider
- `CornerPattern`: Card corner accents
- `DecorativeCard`: Card wrapper with corner decorations

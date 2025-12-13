// RSS Feed Configuration
export interface FeedConfig {
  id: string;
  url: string;
  name: string;
  // Optional external resource links
  youtube_playlist?: string;
  pdf_url?: string;
  shamela_url?: string;
}

// Podcast Show (parsed from RSS channel)
export interface Show {
  id: string;
  title: string;
  description: string;
  author: string;
  imageUrl: string;
  feedUrl: string;
  category: string;
  language: string;
  episodeCount: number;
  lastBuildDate?: Date;
  // Optional external resource links
  youtubePlaylist?: string;
  pdfUrl?: string;
  shamelaUrl?: string;
}

// Episode (parsed from RSS item)
export interface Episode {
  id: string; // GUID from RSS
  showId: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // seconds
  publishedAt: Date;
  imageUrl: string;
  season?: number;
  episodeNumber?: number;
  fileSize: number; // bytes
}

// Downloaded Episode
export interface DownloadedEpisode extends Episode {
  localPath: string;
  downloadedAt: Date;
}

// Download Progress
export interface DownloadProgress {
  episodeId: string;
  progress: number; // 0-100
  bytesWritten: number;
  totalBytes: number;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
}

// Playback State
export interface PlaybackState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  playbackSpeed: number;
  isBuffering: boolean;
}

// Queue Item
export interface QueueItem {
  episode: Episode;
  addedAt: Date;
}

// Playback Position (for resuming)
export interface PlaybackPosition {
  episodeId: string;
  position: number; // milliseconds
  updatedAt: Date;
}

// App Settings
export interface AppSettings {
  downloadOverWifiOnly: boolean;
  skipForwardSeconds: number;
  skipBackwardSeconds: number;
  defaultPlaybackSpeed: number;
  sleepTimerMinutes: number | null;
  autoPlayNext: boolean;
  darkMode: 'system' | 'light' | 'dark';
}

// Remote Feeds Response
export interface RemoteFeedsResponse {
  version: number;
  feeds: FeedConfig[];
}

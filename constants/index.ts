import { AppSettings } from '../types';

export const APP_NAME = 'Momin Lectures';

export const DEFAULT_SETTINGS: AppSettings = {
  downloadOverWifiOnly: true,
  skipForwardSeconds: 15,
  skipBackwardSeconds: 15,
  defaultPlaybackSpeed: 1.0,
  sleepTimerMinutes: null,
  autoPlayNext: true,
  darkMode: 'system',
};

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 45, 60, 90, 120];

export const STORAGE_KEYS = {
  SHOWS: 'shows',
  EPISODES: 'episodes',
  DOWNLOADS: 'downloads',
  LIKES: 'likes',
  PLAYBACK_POSITIONS: 'playback_positions',
  QUEUE: 'queue',
  SETTINGS: 'settings',
  FEEDS_CACHE: 'feeds_cache',
  LAST_FEED_REFRESH: 'last_feed_refresh',
};

// Islamic-inspired color palette
// Deep greens (representing paradise), gold (representing divine light),
// and rich dark backgrounds reminiscent of traditional Islamic art
export const COLORS = {
  // Primary emerald green - color of paradise in Islamic tradition
  primary: '#1B7F4E',
  primaryLight: '#2A9D5C',
  primaryDark: '#0D5C35',

  // Gold accent - representing divine illumination
  gold: '#C9A227',
  goldLight: '#E6C35C',
  goldDark: '#A68419',

  // Deep backgrounds inspired by night sky and traditional manuscripts
  background: '#0A1612',
  surface: '#122620',
  surfaceLight: '#1A3830',

  // Text colors
  text: '#F5F5F5',
  textSecondary: '#9DB4A8',

  // Accent color - deep burgundy/maroon from Islamic geometric art
  accent: '#8B2942',

  // Status colors
  success: '#2D8B57',
  warning: '#C9A227',
  error: '#A63D40',

  // Decorative border color for geometric patterns
  border: '#2A4A3E',
  borderLight: '#3D6B5A',
};

export const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

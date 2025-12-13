import { FeedConfig, RemoteFeedsResponse } from '../types';

// Hardcoded default feeds - always available
export const DEFAULT_FEEDS: FeedConfig[] = [];

// Remote feeds URL - set to null to disable remote feed loading
// Host this JSON file on GitHub Pages, Vercel, or any static hosting
export const REMOTE_FEEDS_URL: string | null = 'https://gist.githubusercontent.com/saqib-ahmed/3c48c3d2745d6ea083f03e0150645d09/raw/podcast_feeds.json';
// Example: 'https://yourusername.github.io/podcast-feeds/feeds.json'

// Fetch remote feeds configuration
export async function fetchRemoteFeeds(): Promise<FeedConfig[]> {
  if (!REMOTE_FEEDS_URL) {
    return [];
  }

  try {
    const response = await fetch(REMOTE_FEEDS_URL, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch remote feeds:', response.status);
      return [];
    }

    const data: RemoteFeedsResponse = await response.json();
    return data.feeds || [];
  } catch (error) {
    console.warn('Error fetching remote feeds:', error);
    return [];
  }
}

// Merge default and remote feeds (remote takes precedence for same ID)
export function mergeFeeds(
  defaultFeeds: FeedConfig[],
  remoteFeeds: FeedConfig[]
): FeedConfig[] {
  const feedMap = new Map<string, FeedConfig>();

  // Add defaults first
  for (const feed of defaultFeeds) {
    feedMap.set(feed.id, feed);
  }

  // Remote feeds override defaults with same ID
  for (const feed of remoteFeeds) {
    feedMap.set(feed.id, feed);
  }

  return Array.from(feedMap.values());
}

// Get all available feeds
export async function getAllFeeds(): Promise<FeedConfig[]> {
  const remoteFeeds = await fetchRemoteFeeds();
  return mergeFeeds(DEFAULT_FEEDS, remoteFeeds);
}

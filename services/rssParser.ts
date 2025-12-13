import { Platform } from 'react-native';
import { XMLParser } from 'fast-xml-parser';
import { Show, Episode, FeedConfig } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

// CORS proxy for web (not needed for native apps)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function getProxiedUrl(url: string): string {
  if (Platform.OS === 'web') {
    return `${CORS_PROXY}${encodeURIComponent(url)}`;
  }
  return url;
}

// Parse duration string (HH:MM:SS or MM:SS or seconds) to seconds
function parseDuration(duration: string | number | undefined): number {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;

  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  // Just seconds
  return parseInt(duration, 10) || 0;
}

// Parse file size from enclosure
function parseFileSize(enclosure: any): number {
  if (!enclosure) return 0;
  const length = enclosure['@_length'] || enclosure.length || 0;
  return parseInt(length, 10) || 0;
}

// Get audio URL from enclosure
function getAudioUrl(enclosure: any): string {
  if (!enclosure) return '';
  return enclosure['@_url'] || enclosure.url || '';
}

// Get image URL from various sources
function getImageUrl(item: any, channelImage: string): string {
  // Try itunes:image first
  const itunesImage = item['itunes:image'];
  if (itunesImage) {
    return itunesImage['@_href'] || itunesImage.href || itunesImage;
  }

  // Try media:content
  const mediaContent = item['media:content'];
  if (mediaContent && mediaContent['@_url']) {
    return mediaContent['@_url'];
  }

  // Fall back to channel image
  return channelImage;
}

// Parse a single RSS feed into Show and Episodes
export async function parseRSSFeed(
  feedConfig: FeedConfig
): Promise<{ show: Show; episodes: Episode[] }> {
  const url = getProxiedUrl(feedConfig.url);
  const response = await fetch(url);
  const xmlText = await response.text();
  const result = parser.parse(xmlText);

  const channel = result.rss?.channel;
  if (!channel) {
    throw new Error('Invalid RSS feed: no channel found');
  }

  // Parse channel image
  const channelImage =
    channel['itunes:image']?.['@_href'] ||
    channel['itunes:image']?.href ||
    channel.image?.url ||
    '';

  // Parse show metadata
  const show: Show = {
    id: feedConfig.id,
    title: channel.title || feedConfig.name,
    description:
      channel.description ||
      channel['itunes:summary'] ||
      '',
    author:
      channel['itunes:author'] ||
      channel['itunes:owner']?.['itunes:name'] ||
      '',
    imageUrl: channelImage,
    feedUrl: feedConfig.url,
    category:
      channel['itunes:category']?.['@_text'] ||
      channel['itunes:category']?.text ||
      'Podcast',
    language: channel.language || 'en',
    episodeCount: 0, // Will be set after parsing episodes
    lastBuildDate: channel.lastBuildDate
      ? new Date(channel.lastBuildDate)
      : undefined,
    // Optional external resource links from feed config
    youtubePlaylist: feedConfig.youtube_playlist,
    pdfUrl: feedConfig.pdf_url,
    shamelaUrl: feedConfig.shamela_url,
  };

  // Parse episodes
  const items = channel.item || [];
  const itemArray = Array.isArray(items) ? items : [items];

  const episodes: Episode[] = itemArray
    .filter((item: any) => item.enclosure || item['media:content'])
    .map((item: any) => {
      const enclosure = item.enclosure || item['media:content'];

      return {
        id: item.guid?.['#text'] || item.guid || item.link || '',
        showId: feedConfig.id,
        title: item.title || 'Untitled Episode',
        description:
          item.description ||
          item['itunes:summary'] ||
          item['content:encoded'] ||
          '',
        audioUrl: getAudioUrl(enclosure),
        duration: parseDuration(item['itunes:duration']),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        imageUrl: getImageUrl(item, channelImage),
        season: parseInt(item['itunes:season'], 10) || undefined,
        episodeNumber: parseInt(item['itunes:episode'], 10) || undefined,
        fileSize: parseFileSize(enclosure),
      } as Episode;
    });

  show.episodeCount = episodes.length;

  return { show, episodes };
}

// Parse multiple RSS feeds
export async function parseAllFeeds(
  feedConfigs: FeedConfig[]
): Promise<{ shows: Show[]; episodes: Episode[] }> {
  const results = await Promise.allSettled(
    feedConfigs.map((config) => parseRSSFeed(config))
  );

  const shows: Show[] = [];
  const episodes: Episode[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      shows.push(result.value.show);
      episodes.push(...result.value.episodes);
    } else {
      console.error('Failed to parse feed:', result.reason);
    }
  }

  return { shows, episodes };
}

// Strip HTML tags from description
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Format duration for display (seconds -> HH:MM:SS or MM:SS)
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

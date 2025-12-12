import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Show, Episode, FeedConfig } from '../types';
import { zustandStorage } from '../services/storage';
import { DEFAULT_FEEDS, getAllFeeds } from '../config/feeds';
import { parseAllFeeds } from '../services/rssParser';

interface FeedState {
  shows: Show[];
  episodes: Episode[];
  feedConfigs: FeedConfig[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: number | null;
  error: string | null;

  // Actions
  refreshFeeds: () => Promise<void>;
  getShowById: (id: string) => Show | undefined;
  getEpisodeById: (id: string) => Episode | undefined;
  getEpisodesByShowId: (showId: string) => Episode[];
  setError: (error: string | null) => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      shows: [],
      episodes: [],
      feedConfigs: DEFAULT_FEEDS,
      isLoading: false,
      isRefreshing: false,
      lastRefresh: null,
      error: null,

      refreshFeeds: async () => {
        const { isLoading } = get();
        if (isLoading) return;

        set({ isLoading: true, isRefreshing: true, error: null });

        try {
          // Get all feed configs (default + remote)
          const feedConfigs = await getAllFeeds();
          set({ feedConfigs });

          // Parse all RSS feeds
          const { shows, episodes } = await parseAllFeeds(feedConfigs);

          // Sort episodes by publish date (newest first)
          const sortedEpisodes = episodes.sort(
            (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
          );

          set({
            shows,
            episodes: sortedEpisodes,
            lastRefresh: Date.now(),
            isLoading: false,
            isRefreshing: false,
          });
        } catch (error) {
          console.error('Error refreshing feeds:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh feeds',
            isLoading: false,
            isRefreshing: false,
          });
        }
      },

      getShowById: (id: string) => {
        return get().shows.find((show) => show.id === id);
      },

      getEpisodeById: (id: string) => {
        return get().episodes.find((episode) => episode.id === id);
      },

      getEpisodesByShowId: (showId: string) => {
        return get().episodes.filter((episode) => episode.showId === showId);
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'feed-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        shows: state.shows,
        episodes: state.episodes,
        feedConfigs: state.feedConfigs,
        lastRefresh: state.lastRefresh,
      }),
      // Hydrate dates properly
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.episodes = state.episodes.map((ep) => ({
            ...ep,
            publishedAt: new Date(ep.publishedAt),
          }));
          state.shows = state.shows.map((show) => ({
            ...show,
            lastBuildDate: show.lastBuildDate
              ? new Date(show.lastBuildDate)
              : undefined,
          }));
        }
      },
    }
  )
);

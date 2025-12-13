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
  isOffline: boolean;
  isHydrated: boolean;

  // Actions
  refreshFeeds: (options?: { silent?: boolean }) => Promise<void>;
  getShowById: (id: string) => Show | undefined;
  getEpisodeById: (id: string) => Episode | undefined;
  getEpisodesByShowId: (showId: string) => Episode[];
  setError: (error: string | null) => void;
  setHydrated: () => void;
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
      isOffline: false,
      isHydrated: false,

      refreshFeeds: async (options?: { silent?: boolean }) => {
        const { isLoading, isRefreshing, shows: existingShows, episodes: existingEpisodes } = get();
        if (isLoading || isRefreshing) return;

        const silent = options?.silent ?? false;
        const hasCachedData = existingShows.length > 0;

        // Only show loading state if we have no cached data and not silent
        if (!hasCachedData && !silent) {
          set({ isLoading: true, error: null, isOffline: false });
        } else {
          // Background refresh - just set refreshing indicator
          set({ isRefreshing: true, isOffline: false });
        }

        try {
          // Get all feed configs (default + remote)
          let feedConfigs;
          try {
            feedConfigs = await getAllFeeds();
            set({ feedConfigs });
          } catch (configError) {
            console.warn('Failed to fetch feed configs, using existing:', configError);
            feedConfigs = get().feedConfigs;
          }

          // Parse all RSS feeds
          const { shows: newShows, episodes } = await parseAllFeeds(feedConfigs);

          // Only update if we got valid data
          if (newShows.length === 0 && hasCachedData) {
            // Got empty results but have cached data - likely network issue
            // Keep existing data and mark as potentially offline
            console.warn('Refresh returned empty data, keeping cached data');
            set({
              isLoading: false,
              isRefreshing: false,
              isOffline: true,
              error: null,
            });
            return;
          }

          // Sort episodes by publish date (newest first)
          const sortedEpisodes = episodes.sort(
            (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
          );

          // Successfully fetched new data - update state
          set({
            shows: newShows,
            episodes: sortedEpisodes,
            lastRefresh: Date.now(),
            isLoading: false,
            isRefreshing: false,
            error: null,
            isOffline: false,
          });
        } catch (error) {
          console.error('Error refreshing feeds:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh feeds';
          const isNetworkError = errorMessage.toLowerCase().includes('network') ||
                                 errorMessage.toLowerCase().includes('fetch') ||
                                 errorMessage.toLowerCase().includes('internet') ||
                                 errorMessage.toLowerCase().includes('offline') ||
                                 errorMessage.toLowerCase().includes('timeout') ||
                                 errorMessage.toLowerCase().includes('connection');

          // NEVER clear existing data on failure
          // If we have cached data, just mark as offline and don't show error
          if (hasCachedData) {
            set({
              isLoading: false,
              isRefreshing: false,
              isOffline: isNetworkError,
              // Don't set error if we have cached data - fail silently
              error: null,
            });
          } else {
            // No cached data - show the error
            set({
              error: isNetworkError ? 'No internet connection' : errorMessage,
              isLoading: false,
              isRefreshing: false,
              isOffline: isNetworkError,
            });
          }
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

      setHydrated: () => {
        set({ isHydrated: true });
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
        // Don't persist: isLoading, isRefreshing, error, isOffline, isHydrated
      }),
      // Hydrate dates properly and mark as hydrated
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
          // Mark as hydrated so UI knows cached data is ready
          state.isHydrated = true;
          state.isOffline = false;
          state.error = null;
        }
      },
    }
  )
);

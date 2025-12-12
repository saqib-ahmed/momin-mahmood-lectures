import { useEffect, useCallback } from 'react';
import { useFeedStore } from '../stores/feedStore';
import { REFRESH_INTERVAL_MS } from '../constants';

export function useRSSFeed() {
  const {
    shows,
    episodes,
    isLoading,
    isRefreshing,
    lastRefresh,
    error,
    isOffline,
    isHydrated,
    refreshFeeds,
    getShowById,
    getEpisodeById,
    getEpisodesByShowId,
    setError,
  } = useFeedStore();

  // Refresh feeds on mount if stale (silently if we have cached data)
  useEffect(() => {
    // Wait for hydration to complete before deciding to refresh
    if (!isHydrated) return;

    const shouldRefresh =
      !lastRefresh || Date.now() - lastRefresh > REFRESH_INTERVAL_MS;

    if (shouldRefresh && !isLoading && !isRefreshing) {
      // Use silent refresh if we have cached data
      const hasCachedData = shows.length > 0;
      refreshFeeds({ silent: hasCachedData });
    }
  }, [isHydrated]);

  // Pull to refresh handler (not silent - user initiated)
  const onRefresh = useCallback(async () => {
    await refreshFeeds({ silent: false });
  }, [refreshFeeds]);

  // Get recent episodes (across all shows)
  const getRecentEpisodes = useCallback(
    (limit: number = 20) => {
      return episodes.slice(0, limit);
    },
    [episodes]
  );

  // Search episodes
  const searchEpisodes = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return episodes.filter(
        (episode) =>
          episode.title.toLowerCase().includes(lowerQuery) ||
          episode.description.toLowerCase().includes(lowerQuery)
      );
    },
    [episodes]
  );

  return {
    // State
    shows,
    episodes,
    isLoading,
    isRefreshing,
    lastRefresh,
    error,
    isOffline,
    isHydrated,

    // Actions
    refreshFeeds,
    onRefresh,
    setError,

    // Getters
    getShowById,
    getEpisodeById,
    getEpisodesByShowId,
    getRecentEpisodes,
    searchEpisodes,
  };
}

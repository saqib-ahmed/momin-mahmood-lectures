import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DownloadedEpisode, DownloadProgress, Episode } from '../types';
import { zustandStorage } from '../services/storage';

interface DownloadState {
  // Downloaded episodes (episodeId -> DownloadedEpisode)
  downloads: Record<string, DownloadedEpisode>;

  // Current download progress
  activeDownloads: Record<string, DownloadProgress>;

  // Download queue
  downloadQueue: string[];

  // Actions
  addDownload: (episode: Episode, localPath: string) => void;
  removeDownload: (episodeId: string) => void;
  getDownload: (episodeId: string) => DownloadedEpisode | undefined;
  isDownloaded: (episodeId: string) => boolean;
  getLocalPath: (episodeId: string) => string | null;

  // Progress tracking
  setDownloadProgress: (episodeId: string, progress: DownloadProgress) => void;
  removeDownloadProgress: (episodeId: string) => void;
  getDownloadProgress: (episodeId: string) => DownloadProgress | undefined;

  // Queue management
  addToDownloadQueue: (episodeId: string) => void;
  removeFromDownloadQueue: (episodeId: string) => void;
  getNextInQueue: () => string | undefined;

  // Bulk operations
  clearAllDownloads: () => void;
  getDownloadedEpisodes: () => DownloadedEpisode[];
  getTotalDownloadSize: () => number;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      activeDownloads: {},
      downloadQueue: [],

      addDownload: (episode, localPath) => {
        const downloadedEpisode: DownloadedEpisode = {
          ...episode,
          localPath,
          downloadedAt: new Date(),
        };
        set({
          downloads: {
            ...get().downloads,
            [episode.id]: downloadedEpisode,
          },
        });
      },

      removeDownload: (episodeId) => {
        const { downloads } = get();
        const { [episodeId]: _, ...rest } = downloads;
        set({ downloads: rest });
      },

      getDownload: (episodeId) => {
        return get().downloads[episodeId];
      },

      isDownloaded: (episodeId) => {
        return !!get().downloads[episodeId];
      },

      getLocalPath: (episodeId) => {
        const download = get().downloads[episodeId];
        return download?.localPath || null;
      },

      setDownloadProgress: (episodeId, progress) => {
        set({
          activeDownloads: {
            ...get().activeDownloads,
            [episodeId]: progress,
          },
        });
      },

      removeDownloadProgress: (episodeId) => {
        const { activeDownloads } = get();
        const { [episodeId]: _, ...rest } = activeDownloads;
        set({ activeDownloads: rest });
      },

      getDownloadProgress: (episodeId) => {
        return get().activeDownloads[episodeId];
      },

      addToDownloadQueue: (episodeId) => {
        const { downloadQueue, downloads } = get();
        // Don't add if already downloaded or in queue
        if (downloads[episodeId] || downloadQueue.includes(episodeId)) {
          return;
        }
        set({ downloadQueue: [...downloadQueue, episodeId] });
      },

      removeFromDownloadQueue: (episodeId) => {
        set({
          downloadQueue: get().downloadQueue.filter((id) => id !== episodeId),
        });
      },

      getNextInQueue: () => {
        return get().downloadQueue[0];
      },

      clearAllDownloads: () => {
        set({
          downloads: {},
          activeDownloads: {},
          downloadQueue: [],
        });
      },

      getDownloadedEpisodes: () => {
        return Object.values(get().downloads).sort(
          (a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime()
        );
      },

      getTotalDownloadSize: () => {
        return Object.values(get().downloads).reduce(
          (total, download) => total + download.fileSize,
          0
        );
      },
    }),
    {
      name: 'download-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        downloads: state.downloads,
        downloadQueue: state.downloadQueue,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Hydrate dates
          Object.keys(state.downloads).forEach((key) => {
            const download = state.downloads[key];
            download.downloadedAt = new Date(download.downloadedAt);
            download.publishedAt = new Date(download.publishedAt);
          });
        }
      },
    }
  )
);

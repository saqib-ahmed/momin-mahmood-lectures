import { useCallback, useState, useRef } from 'react';
import { downloadService } from '../services/downloadService';
import { useDownloadStore } from '../stores/downloadStore';
import { useFeedStore } from '../stores/feedStore';
import { Episode, DownloadProgress } from '../types';

// Throttle helper
const PROGRESS_UPDATE_INTERVAL = 500; // Update UI every 500ms

export function useDownloads() {
  const {
    downloads,
    activeDownloads,
    downloadQueue,
    addDownload,
    removeDownload,
    isDownloaded,
    getLocalPath,
    setDownloadProgress,
    removeDownloadProgress,
    addToDownloadQueue,
    removeFromDownloadQueue,
    getNextInQueue,
    getDownloadedEpisodes,
    getTotalDownloadSize,
    clearAllDownloads,
  } = useDownloadStore();

  const { getEpisodeById } = useFeedStore();
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const lastProgressUpdateRef = useRef<Record<string, number>>({});

  // Start downloading an episode
  const startDownload = useCallback(
    async (episode: Episode) => {
      if (isDownloaded(episode.id)) {
        return;
      }

      // Set initial progress
      setDownloadProgress(episode.id, {
        episodeId: episode.id,
        progress: 0,
        bytesWritten: 0,
        totalBytes: episode.fileSize,
        status: 'downloading',
      });

      // Initialize last update time
      lastProgressUpdateRef.current[episode.id] = 0;

      try {
        const localPath = await downloadService.downloadEpisode(
          episode,
          (progress: DownloadProgress) => {
            // Throttle progress updates to prevent UI freezing
            const now = Date.now();
            const lastUpdate = lastProgressUpdateRef.current[episode.id] || 0;

            // Always update on completion, otherwise throttle
            if (progress.status === 'completed' || now - lastUpdate >= PROGRESS_UPDATE_INTERVAL) {
              lastProgressUpdateRef.current[episode.id] = now;
              setDownloadProgress(episode.id, progress);
            }
          }
        );

        // Clean up throttle tracking
        delete lastProgressUpdateRef.current[episode.id];

        // Debug logging for download completion
        console.log('[Download] Completed:', episode.id);
        console.log('[Download] Local path saved:', localPath);

        // Add to downloads store
        addDownload(episode, localPath);
        removeDownloadProgress(episode.id);
      } catch (error) {
        console.error('Download failed:', error);
        delete lastProgressUpdateRef.current[episode.id];
        removeDownloadProgress(episode.id);
        throw error;
      }
    },
    [isDownloaded, setDownloadProgress, addDownload, removeDownloadProgress]
  );

  // Queue a download
  const queueDownload = useCallback(
    (episodeId: string) => {
      addToDownloadQueue(episodeId);
      processQueue();
    },
    [addToDownloadQueue]
  );

  // Process download queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueue) return;

    const nextEpisodeId = getNextInQueue();
    if (!nextEpisodeId) return;

    const episode = getEpisodeById(nextEpisodeId);
    if (!episode) {
      removeFromDownloadQueue(nextEpisodeId);
      processQueue();
      return;
    }

    setIsProcessingQueue(true);

    try {
      removeFromDownloadQueue(nextEpisodeId);
      await startDownload(episode);
    } catch (error) {
      console.error('Queue download failed:', error);
    } finally {
      setIsProcessingQueue(false);
      // Process next in queue
      processQueue();
    }
  }, [
    isProcessingQueue,
    getNextInQueue,
    getEpisodeById,
    removeFromDownloadQueue,
    startDownload,
  ]);

  // Cancel a download
  const cancelDownload = useCallback(
    async (episodeId: string) => {
      await downloadService.cancelDownload(episodeId);
      removeDownloadProgress(episodeId);
      removeFromDownloadQueue(episodeId);
    },
    [removeDownloadProgress, removeFromDownloadQueue]
  );

  // Delete a downloaded episode
  const deleteDownload = useCallback(
    async (episodeId: string) => {
      const localPath = getLocalPath(episodeId);
      if (localPath) {
        await downloadService.deleteDownload(localPath);
      }
      removeDownload(episodeId);
    },
    [getLocalPath, removeDownload]
  );

  // Delete all downloads
  const deleteAllDownloads = useCallback(async () => {
    await downloadService.deleteAllDownloads();
    clearAllDownloads();
  }, [clearAllDownloads]);

  // Get download progress for an episode
  const getProgress = useCallback(
    (episodeId: string): DownloadProgress | undefined => {
      return activeDownloads[episodeId];
    },
    [activeDownloads]
  );

  // Check if episode is downloading
  const isDownloading = useCallback(
    (episodeId: string): boolean => {
      const progress = activeDownloads[episodeId];
      return progress?.status === 'downloading';
    },
    [activeDownloads]
  );

  // Check if episode is queued
  const isQueued = useCallback(
    (episodeId: string): boolean => {
      return downloadQueue.includes(episodeId);
    },
    [downloadQueue]
  );

  return {
    // State
    downloads,
    activeDownloads,
    downloadQueue,
    downloadedEpisodes: getDownloadedEpisodes(),
    totalDownloadSize: getTotalDownloadSize(),

    // Actions
    startDownload,
    queueDownload,
    cancelDownload,
    deleteDownload,
    deleteAllDownloads,

    // Helpers
    isDownloaded,
    isDownloading,
    isQueued,
    getLocalPath,
    getProgress,
  };
}

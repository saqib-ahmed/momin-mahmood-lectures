import { useCallback, useState } from 'react';
import { downloadService } from '../services/downloadService';
import { useDownloadStore } from '../stores/downloadStore';
import { useFeedStore } from '../stores/feedStore';
import { Episode, DownloadProgress } from '../types';

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

      try {
        const localPath = await downloadService.downloadEpisode(
          episode,
          (progress: DownloadProgress) => {
            setDownloadProgress(episode.id, progress);
          }
        );

        // Add to downloads store
        addDownload(episode, localPath);
        removeDownloadProgress(episode.id);
      } catch (error) {
        console.error('Download failed:', error);
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

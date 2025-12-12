import * as FileSystem from 'expo-file-system';
import { Episode, DownloadProgress } from '../types';

type ProgressCallback = (progress: DownloadProgress) => void;

// Type for DownloadResumable since it's not exported in types
type DownloadResumable = ReturnType<typeof FileSystem.createDownloadResumable>;

class DownloadService {
  private activeDownloads: Map<string, DownloadResumable> = new Map();
  private downloadsDirectory: string;

  constructor() {
    this.downloadsDirectory = `${FileSystem.documentDirectory || ''}podcasts/`;
  }

  // Ensure downloads directory exists
  async ensureDirectoryExists(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this.downloadsDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.downloadsDirectory, {
        intermediates: true,
      });
    }
  }

  // Generate local file path for an episode
  getLocalPath(episode: Episode): string {
    // Sanitize filename
    const sanitizedTitle = episode.title
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    return `${this.downloadsDirectory}${episode.id}_${sanitizedTitle}.mp3`;
  }

  // Start downloading an episode
  async downloadEpisode(
    episode: Episode,
    onProgress?: ProgressCallback
  ): Promise<string> {
    await this.ensureDirectoryExists();

    const localPath = this.getLocalPath(episode);

    // Check if already downloaded
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      return localPath;
    }

    // Create download resumable
    const downloadResumable = FileSystem.createDownloadResumable(
      episode.audioUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress: DownloadProgress = {
          episodeId: episode.id,
          progress:
            (downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite) *
            100,
          bytesWritten: downloadProgress.totalBytesWritten,
          totalBytes: downloadProgress.totalBytesExpectedToWrite,
          status: 'downloading',
        };
        onProgress?.(progress);
      }
    );

    this.activeDownloads.set(episode.id, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        onProgress?.({
          episodeId: episode.id,
          progress: 100,
          bytesWritten: episode.fileSize,
          totalBytes: episode.fileSize,
          status: 'completed',
        });
        return result.uri;
      }

      throw new Error('Download failed - no URI returned');
    } catch (error) {
      // Check if it was cancelled
      if ((error as Error).message?.includes('cancelled')) {
        onProgress?.({
          episodeId: episode.id,
          progress: 0,
          bytesWritten: 0,
          totalBytes: episode.fileSize,
          status: 'cancelled',
        });
      } else {
        onProgress?.({
          episodeId: episode.id,
          progress: 0,
          bytesWritten: 0,
          totalBytes: episode.fileSize,
          status: 'failed',
        });
      }
      throw error;
    } finally {
      this.activeDownloads.delete(episode.id);
    }
  }

  // Cancel an active download
  async cancelDownload(episodeId: string): Promise<void> {
    const download = this.activeDownloads.get(episodeId);
    if (download) {
      await download.pauseAsync();
      this.activeDownloads.delete(episodeId);

      // Clean up partial file
      const savedData = await download.savable();
      if (savedData.fileUri) {
        const fileInfo = await FileSystem.getInfoAsync(savedData.fileUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(savedData.fileUri, { idempotent: true });
        }
      }
    }
  }

  // Delete a downloaded episode
  async deleteDownload(localPath: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
    }
  }

  // Check if file exists
  async fileExists(localPath: string): Promise<boolean> {
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    return fileInfo.exists;
  }

  // Get file size
  async getFileSize(localPath: string): Promise<number> {
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (fileInfo.exists && 'size' in fileInfo) {
      return (fileInfo as any).size || 0;
    }
    return 0;
  }

  // Get total storage used by downloads
  async getTotalStorageUsed(): Promise<number> {
    await this.ensureDirectoryExists();

    const files = await FileSystem.readDirectoryAsync(this.downloadsDirectory);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${this.downloadsDirectory}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += (fileInfo as any).size || 0;
      }
    }

    return totalSize;
  }

  // Delete all downloads
  async deleteAllDownloads(): Promise<void> {
    // Cancel all active downloads first
    for (const [episodeId] of this.activeDownloads) {
      await this.cancelDownload(episodeId);
    }

    // Delete the entire downloads directory
    const dirInfo = await FileSystem.getInfoAsync(this.downloadsDirectory);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(this.downloadsDirectory, {
        idempotent: true,
      });
    }
  }

  // Check if download is active
  isDownloadActive(episodeId: string): boolean {
    return this.activeDownloads.has(episodeId);
  }
}

// Singleton instance
export const downloadService = new DownloadService();

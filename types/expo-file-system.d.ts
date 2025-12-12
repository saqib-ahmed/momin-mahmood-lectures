import 'expo-file-system';

declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export function createDownloadResumable(
    uri: string,
    fileUri: string,
    options?: any,
    callback?: (downloadProgress: {
      totalBytesWritten: number;
      totalBytesExpectedToWrite: number;
    }) => void,
    resumeData?: string
  ): {
    downloadAsync(): Promise<{ uri: string } | undefined>;
    pauseAsync(): Promise<{ resumeData: string }>;
    resumeAsync(): Promise<{ uri: string } | undefined>;
    savable(): { fileUri: string; resumeData: string };
  };
  export function getInfoAsync(
    fileUri: string,
    options?: { size?: boolean; md5?: boolean }
  ): Promise<{
    exists: boolean;
    uri?: string;
    size?: number;
    modificationTime?: number;
    isDirectory?: boolean;
    md5?: string;
  }>;
  export function makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void>;
  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;
  export function readDirectoryAsync(fileUri: string): Promise<string[]>;
}

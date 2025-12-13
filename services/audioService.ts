/**
 * Audio Service - Wrapper around react-native-audio-pro
 * Provides a clean API for playing audio with all podcast features
 */
import {
  AudioPro,
  AudioProState,
  AudioProTrack,
} from 'react-native-audio-pro';
import { Episode } from '../types';

// Define PlayOptions locally since it's not exported from the package
type PlayOptions = {
  autoPlay?: boolean;
  headers?: {
    audio?: Record<string, string>;
    artwork?: Record<string, string>;
  };
  startTimeMs?: number;
};

/**
 * Convert our Episode type to AudioProTrack
 */
function episodeToTrack(episode: Episode): AudioProTrack {
  return {
    id: episode.id,
    url: episode.audioUrl,
    title: episode.title,
    artwork: episode.imageUrl,
    artist: episode.showId, // Could be show title if available
    album: episode.season ? `Season ${episode.season}` : undefined,
  };
}

class AudioService {
  /**
   * Load and play an episode
   */
  async play(
    episode: Episode,
    uri: string, // Can be local file path or remote URL
    options?: {
      startTimeMs?: number;
      autoPlay?: boolean;
      playbackSpeed?: number;
    }
  ): Promise<void> {
    const track: AudioProTrack = {
      id: episode.id,
      url: uri,
      title: episode.title,
      artwork: episode.imageUrl,
      artist: episode.showId,
      album: episode.season ? `Season ${episode.season}` : undefined,
    };

    const shouldAutoPlay = options?.autoPlay ?? true;
    const playOptions: PlayOptions = {
      autoPlay: shouldAutoPlay,
      startTimeMs: options?.startTimeMs ?? 0,
    };

    AudioPro.play(track, playOptions);

    // Set playback speed if specified
    if (options?.playbackSpeed && options.playbackSpeed !== 1.0) {
      AudioPro.setPlaybackSpeed(options.playbackSpeed);
    }

    // Ensure playback starts if autoPlay is requested
    // Small delay to let the track load before resuming
    if (shouldAutoPlay) {
      setTimeout(() => {
        const state = AudioPro.getState();
        if (state === AudioProState.PAUSED || state === AudioProState.STOPPED) {
          AudioPro.resume();
        }
      }, 100);
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    await AudioPro.pause();
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    await AudioPro.resume();
  }

  /**
   * Stop playback and reset position
   */
  async stop(): Promise<void> {
    await AudioPro.stop();
  }

  /**
   * Clear the player (reset to IDLE state)
   */
  async clear(): Promise<void> {
    await AudioPro.clear();
  }

  /**
   * Seek to a specific position
   */
  async seekTo(positionMs: number): Promise<void> {
    await AudioPro.seekTo(positionMs);
  }

  /**
   * Seek forward by specified amount (default 15 seconds)
   */
  async seekForward(amountMs: number = 15000): Promise<void> {
    await AudioPro.seekForward(amountMs);
  }

  /**
   * Seek backward by specified amount (default 15 seconds)
   */
  async seekBackward(amountMs: number = 15000): Promise<void> {
    await AudioPro.seekBack(amountMs);
  }

  /**
   * Set playback speed (0.25 to 2.0)
   */
  async setPlaybackSpeed(speed: number): Promise<void> {
    const clampedSpeed = Math.max(0.25, Math.min(2.0, speed));
    await AudioPro.setPlaybackSpeed(clampedSpeed);
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    await AudioPro.setVolume(clampedVolume);
  }

  /**
   * Get current playback state
   */
  getState(): AudioProState {
    return AudioPro.getState();
  }

  /**
   * Get current position and duration
   */
  getTimings(): { position: number; duration: number } {
    return AudioPro.getTimings();
  }

  /**
   * Get the currently playing track
   */
  getPlayingTrack(): AudioProTrack | null {
    return AudioPro.getPlayingTrack();
  }

  /**
   * Get current playback speed
   */
  getPlaybackSpeed(): number {
    return AudioPro.getPlaybackSpeed();
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return AudioPro.getVolume();
  }

  /**
   * Get last error if any
   */
  getError(): { error: string; errorCode?: number } | null {
    return AudioPro.getError();
  }

  /**
   * Check if player is currently playing
   */
  isPlaying(): boolean {
    return AudioPro.getState() === AudioProState.PLAYING;
  }

  /**
   * Check if player is loading
   */
  isLoading(): boolean {
    return AudioPro.getState() === AudioProState.LOADING;
  }

  /**
   * Check if a track is loaded
   */
  hasTrack(): boolean {
    const state = AudioPro.getState();
    return state !== AudioProState.IDLE;
  }
}

// Singleton instance
export const audioService = new AudioService();

// Re-export types for convenience
export { AudioProState, AudioProTrack };

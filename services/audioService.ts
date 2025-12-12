import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { Episode } from '../types';

type PlaybackStatusCallback = (status: AVPlaybackStatus) => void;

class AudioService {
  private sound: Audio.Sound | null = null;
  private statusCallback: PlaybackStatusCallback | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });

    this.isInitialized = true;
  }

  setStatusCallback(callback: PlaybackStatusCallback): void {
    this.statusCallback = callback;
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  };

  async loadAudio(
    uri: string,
    initialPosition: number = 0,
    playbackSpeed: number = 1.0
  ): Promise<void> {
    await this.initialize();

    // Unload any existing audio
    await this.unload();

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      {
        shouldPlay: false,
        positionMillis: initialPosition,
        rate: playbackSpeed,
        shouldCorrectPitch: true,
        progressUpdateIntervalMillis: 500,
      },
      this.handlePlaybackStatusUpdate
    );

    this.sound = sound;
  }

  async play(): Promise<void> {
    if (!this.sound) return;
    await this.sound.playAsync();
  }

  async pause(): Promise<void> {
    if (!this.sound) return;
    await this.sound.pauseAsync();
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    await this.sound.stopAsync();
  }

  async seekTo(positionMillis: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setPositionAsync(positionMillis);
  }

  async seekForward(seconds: number): Promise<void> {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.min(
        status.positionMillis + seconds * 1000,
        status.durationMillis || status.positionMillis
      );
      await this.sound.setPositionAsync(newPosition);
    }
  }

  async seekBackward(seconds: number): Promise<void> {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      const newPosition = Math.max(status.positionMillis - seconds * 1000, 0);
      await this.sound.setPositionAsync(newPosition);
    }
  }

  async setPlaybackSpeed(rate: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setRateAsync(rate, true);
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  }

  async getStatus(): Promise<AVPlaybackStatus | null> {
    if (!this.sound) return null;
    return await this.sound.getStatusAsync();
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  isLoaded(): boolean {
    return this.sound !== null;
  }
}

// Singleton instance
export const audioService = new AudioService();

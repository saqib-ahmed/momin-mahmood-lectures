import { useEffect, useCallback, useRef } from 'react';
import { AVPlaybackStatus } from 'expo-av';
import { audioService } from '../services/audioService';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Episode } from '../types';

export function useAudioPlayer() {
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    isBuffering,
    position,
    duration,
    playbackSpeed,
    sleepTimerEndTime,
    setCurrentEpisode,
    setIsPlaying,
    setIsLoading,
    setIsBuffering,
    setPosition,
    setDuration,
    setPlaybackSpeed,
    savePosition,
    getSavedPosition,
    playNext,
    clearSleepTimer,
  } = usePlayerStore();

  const { getLocalPath, isDownloaded } = useDownloadStore();
  const { skipForwardSeconds, skipBackwardSeconds, autoPlayNext } =
    useSettingsStore();

  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle playback status updates
  const handleStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        setIsLoading(true);
        setIsBuffering(false);
        return;
      }

      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
      setPosition(status.positionMillis);

      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }

      // Handle playback finished
      if (status.didJustFinish && autoPlayNext) {
        const nextEpisode = playNext();
        if (nextEpisode) {
          playEpisode(nextEpisode);
        }
      }
    },
    [
      setIsLoading,
      setIsPlaying,
      setIsBuffering,
      setPosition,
      setDuration,
      autoPlayNext,
      playNext,
    ]
  );

  // Set up status callback on mount
  useEffect(() => {
    audioService.setStatusCallback(handleStatusUpdate);
  }, [handleStatusUpdate]);

  // Sleep timer effect
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimerEndTime && isPlaying) {
      const timeUntilSleep = sleepTimerEndTime - Date.now();
      if (timeUntilSleep > 0) {
        sleepTimerRef.current = setTimeout(async () => {
          await audioService.pause();
          clearSleepTimer();
        }, timeUntilSleep);
      } else {
        // Timer already expired
        audioService.pause();
        clearSleepTimer();
      }
    }

    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, [sleepTimerEndTime, isPlaying, clearSleepTimer]);

  // Auto-save position periodically
  useEffect(() => {
    if (positionSaveRef.current) {
      clearInterval(positionSaveRef.current);
    }

    if (currentEpisode && isPlaying) {
      positionSaveRef.current = setInterval(() => {
        const currentPosition = usePlayerStore.getState().position;
        if (currentEpisode && currentPosition > 0) {
          savePosition(currentEpisode.id, currentPosition);
        }
      }, 10000); // Save every 10 seconds
    }

    return () => {
      if (positionSaveRef.current) {
        clearInterval(positionSaveRef.current);
      }
    };
  }, [currentEpisode, isPlaying, savePosition]);

  // Play an episode
  const playEpisode = useCallback(
    async (episode: Episode, startFromBeginning = false) => {
      setIsLoading(true);

      try {
        // Use local file if downloaded, otherwise stream
        const localPath = getLocalPath(episode.id);
        const uri = localPath || episode.audioUrl;

        // Get saved position unless starting from beginning
        const initialPosition = startFromBeginning
          ? 0
          : getSavedPosition(episode.id);

        setCurrentEpisode(episode);
        await audioService.loadAudio(uri, initialPosition, playbackSpeed);
        await audioService.play();
      } catch (error) {
        console.error('Error playing episode:', error);
        setIsLoading(false);
      }
    },
    [getLocalPath, getSavedPosition, playbackSpeed, setCurrentEpisode, setIsLoading]
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!currentEpisode) return;

    if (isPlaying) {
      await audioService.pause();
      // Save position when pausing
      savePosition(currentEpisode.id, position);
    } else {
      // If no audio loaded, load it first
      const status = await audioService.getStatus();
      if (!status || !status.isLoaded) {
        await playEpisode(currentEpisode);
      } else {
        await audioService.play();
      }
    }
  }, [currentEpisode, isPlaying, position, savePosition, playEpisode]);

  // Seek forward
  const seekForward = useCallback(async () => {
    await audioService.seekForward(skipForwardSeconds);
  }, [skipForwardSeconds]);

  // Seek backward
  const seekBackward = useCallback(async () => {
    await audioService.seekBackward(skipBackwardSeconds);
  }, [skipBackwardSeconds]);

  // Seek to position
  const seekTo = useCallback(async (positionMillis: number) => {
    await audioService.seekTo(positionMillis);
  }, []);

  // Change playback speed
  const changePlaybackSpeed = useCallback(
    async (speed: number) => {
      setPlaybackSpeed(speed);
      await audioService.setPlaybackSpeed(speed);
    },
    [setPlaybackSpeed]
  );

  // Stop playback
  const stop = useCallback(async () => {
    if (currentEpisode) {
      savePosition(currentEpisode.id, position);
    }
    await audioService.stop();
    await audioService.unload();
  }, [currentEpisode, position, savePosition]);

  return {
    // State
    currentEpisode,
    isPlaying,
    isLoading,
    isBuffering,
    position,
    duration,
    playbackSpeed,
    sleepTimerEndTime,

    // Actions
    playEpisode,
    togglePlayPause,
    seekForward,
    seekBackward,
    seekTo,
    changePlaybackSpeed,
    stop,

    // Helpers
    isEpisodeDownloaded: isDownloaded,
  };
}

import { useEffect, useCallback, useRef } from 'react';
import { useAudioPro, AudioProState, AudioPro, AudioProEventType } from 'react-native-audio-pro';
import { audioService } from '../services/audioService';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useFeedStore } from '../stores/feedStore';
import { Episode } from '../types';

// Module-level flag to ensure we only register ONE event listener
// This prevents duplicate handling when multiple components use useAudioPlayer
let isEventListenerRegistered = false;

export function useAudioPlayer() {
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    isPlayRequested,
    position,
    duration,
    playbackSpeed,
    queue,
    setCurrentEpisode,
    setIsPlaying,
    setIsLoading,
    setIsBuffering,
    setIsPlayRequested,
    setDuration,
    setPlaybackSpeed,
    savePosition,
    getSavedPosition,
    playNext,
    setQueue,
  } = usePlayerStore();

  const { getLocalPath, isDownloaded } = useDownloadStore();
  const { skipForwardSeconds, skipBackwardSeconds } = useSettingsStore();
  const { getEpisodesByShowId } = useFeedStore();

  // Use the react-native-audio-pro hook for reactive state
  // This will update automatically when audio state changes
  const audioState = useAudioPro();

  // Derive playback state directly from audioState for real-time UI
  const isPlayingNow = audioState.state === AudioProState.PLAYING;
  const isAudioLoading = audioState.state === AudioProState.LOADING;
  // Show loading if: audio is loading OR play was requested but hasn't started yet
  // This prevents the flicker from loading → play → pause
  const isLoadingNow = isAudioLoading || (isPlayRequested && !isPlayingNow);
  const isBufferingNow = isAudioLoading;
  const positionNow = audioState.position ?? position;
  const durationNow = audioState.duration ?? duration;

  // Sync play state to store (for other components like MiniPlayer)
  useEffect(() => {
    if (isPlayingNow !== isPlaying) {
      setIsPlaying(isPlayingNow);
    }
    if (isAudioLoading !== isLoading) {
      setIsLoading(isAudioLoading);
      setIsBuffering(isAudioLoading);
    }
  }, [isPlayingNow, isAudioLoading, isPlaying, isLoading, setIsPlaying, setIsLoading, setIsBuffering]);

  // Sync duration to store (only when it changes significantly)
  useEffect(() => {
    if (durationNow > 0 && Math.abs(durationNow - duration) > 1000) {
      setDuration(durationNow);
    }
  }, [durationNow, duration, setDuration]);

  const positionSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Register event listeners ONCE using module-level singleton pattern
  // This prevents duplicate handling when multiple components use useAudioPlayer
  useEffect(() => {
    if (isEventListenerRegistered) {
      return; // Already registered, don't add another listener
    }

    isEventListenerRegistered = true;
    console.log('[useAudioPlayer] Registering event listener (singleton)');

    const subscription = AudioPro.addEventListener((event) => {
      if (event.type === AudioProEventType.TRACK_ENDED) {
        // Auto-play next if enabled in settings
        const settings = useSettingsStore.getState();
        if (settings.autoPlayNext) {
          const playerState = usePlayerStore.getState();
          console.log('[useAudioPlayer] Track ended, queue length:', playerState.queue.length);
          if (playerState.queue.length > 0) {
            const nextEpisode = playerState.playNext();
            if (nextEpisode) {
              console.log('[useAudioPlayer] Auto-playing next:', nextEpisode.title);
              usePlayerStore.getState().setIsPlayRequested(true);
              const localPath = useDownloadStore.getState().getLocalPath(nextEpisode.id);
              const uri = localPath || nextEpisode.audioUrl;
              const initialPosition = playerState.getSavedPosition(nextEpisode.id);
              audioService.play(nextEpisode, uri, {
                startTimeMs: initialPosition,
                autoPlay: true,
                playbackSpeed: playerState.playbackSpeed,
              });
            }
          }
        }
      } else if (event.type === AudioProEventType.REMOTE_NEXT) {
        // Handle remote next button (lock screen, headphones)
        const playerState = usePlayerStore.getState();
        console.log('[useAudioPlayer] Remote next, queue length:', playerState.queue.length);
        if (playerState.queue.length > 0) {
          // Save current position before switching
          if (playerState.currentEpisode && playerState.position > 0) {
            playerState.savePosition(playerState.currentEpisode.id, playerState.position);
          }
          const nextEpisode = playerState.playNext();
          if (nextEpisode) {
            console.log('[useAudioPlayer] Playing next:', nextEpisode.title);
            usePlayerStore.getState().setIsPlayRequested(true);
            const localPath = useDownloadStore.getState().getLocalPath(nextEpisode.id);
            const uri = localPath || nextEpisode.audioUrl;
            const initialPosition = playerState.getSavedPosition(nextEpisode.id);
            audioService.play(nextEpisode, uri, {
              startTimeMs: initialPosition,
              autoPlay: true,
              playbackSpeed: playerState.playbackSpeed,
            });
          }
        }
      } else if (event.type === AudioProEventType.REMOTE_PREV) {
        // Handle remote previous button (lock screen, headphones)
        const playerState = usePlayerStore.getState();
        const currentEp = playerState.currentEpisode;
        const { position } = AudioPro.getTimings();

        console.log('[useAudioPlayer] Remote prev, position:', position);

        // If more than 3 seconds in, restart current track
        if (position > 3000) {
          console.log('[useAudioPlayer] Restarting current track');
          audioService.seekTo(0);
          return;
        }

        // Get the actual previous episode in the series
        if (currentEp) {
          const showEpisodes = useFeedStore.getState().getEpisodesByShowId(currentEp.showId);
          const currentIndex = showEpisodes.findIndex((ep) => ep.id === currentEp.id);

          console.log('[useAudioPlayer] Current index:', currentIndex, 'of', showEpisodes.length);

          if (currentIndex > 0) {
            const prevEpisode = showEpisodes[currentIndex - 1];
            // Save current position
            if (playerState.position > 0) {
              playerState.savePosition(currentEp.id, playerState.position);
            }

            // Set the current episode and rebuild queue
            usePlayerStore.getState().setCurrentEpisode(prevEpisode);

            // Rebuild queue with episodes after the previous one
            const remainingEpisodes = showEpisodes.slice(currentIndex);
            usePlayerStore.getState().setQueue(remainingEpisodes);

            console.log('[useAudioPlayer] Playing previous:', prevEpisode.title);
            usePlayerStore.getState().setIsPlayRequested(true);
            const localPath = useDownloadStore.getState().getLocalPath(prevEpisode.id);
            const uri = localPath || prevEpisode.audioUrl;
            const initialPosition = playerState.getSavedPosition(prevEpisode.id);
            audioService.play(prevEpisode, uri, {
              startTimeMs: initialPosition,
              autoPlay: true,
              playbackSpeed: playerState.playbackSpeed,
            });
          } else {
            // At the first episode, just restart
            console.log('[useAudioPlayer] At first episode, restarting');
            audioService.seekTo(0);
          }
        } else {
          audioService.seekTo(0);
        }
      }
    });

    // Note: We intentionally do NOT remove the subscription on unmount
    // The listener should persist for the app's lifetime
    // The singleton flag ensures we only have one listener
  }, []);

  // Play an episode (with auto-queue of subsequent episodes from same show)
  const playEpisode = useCallback(
    async (episode: Episode, startFromBeginning = false) => {
      setIsLoading(true);
      setIsPlayRequested(true);

      try {
        // Use local file if downloaded, otherwise stream
        const localPath = getLocalPath(episode.id);
        const uri = localPath || episode.audioUrl;

        // Get saved position unless starting from beginning
        const initialPosition = startFromBeginning
          ? 0
          : getSavedPosition(episode.id);

        setCurrentEpisode(episode);

        // Auto-populate queue with remaining episodes from the same show
        const showEpisodes = getEpisodesByShowId(episode.showId);
        const currentIndex = showEpisodes.findIndex((ep) => ep.id === episode.id);
        if (currentIndex >= 0 && currentIndex < showEpisodes.length - 1) {
          // Add episodes after this one to the queue
          const remainingEpisodes = showEpisodes.slice(currentIndex + 1);
          setQueue(remainingEpisodes);
        }

        await audioService.play(episode, uri, {
          startTimeMs: initialPosition,
          autoPlay: true,
          playbackSpeed,
        });
      } catch (error) {
        console.error('Error playing episode:', error);
        setIsLoading(false);
        setIsPlayRequested(false);
      }
    },
    [getLocalPath, getSavedPosition, getEpisodesByShowId, playbackSpeed, setCurrentEpisode, setIsLoading, setIsPlayRequested, setQueue]
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!currentEpisode) return;

    if (isPlayingNow) {
      await audioService.pause();
      // Save position when pausing
      savePosition(currentEpisode.id, positionNow);
    } else {
      // Check if we have a track loaded
      if (audioService.hasTrack()) {
        setIsPlayRequested(true);
        await audioService.resume();
      } else {
        // No track loaded, load and play
        await playEpisode(currentEpisode);
      }
    }
  }, [currentEpisode, isPlayingNow, positionNow, savePosition, playEpisode, setIsPlayRequested]);

  // Seek forward
  const seekForward = useCallback(async () => {
    // Set isPlayRequested if playing to prevent flicker during seek
    if (isPlayingNow) {
      setIsPlayRequested(true);
    }
    await audioService.seekForward(skipForwardSeconds * 1000);
  }, [skipForwardSeconds, isPlayingNow, setIsPlayRequested]);

  // Seek backward
  const seekBackward = useCallback(async () => {
    // Set isPlayRequested if playing to prevent flicker during seek
    if (isPlayingNow) {
      setIsPlayRequested(true);
    }
    await audioService.seekBackward(skipBackwardSeconds * 1000);
  }, [skipBackwardSeconds, isPlayingNow, setIsPlayRequested]);

  // Seek to position
  const seekTo = useCallback(async (positionMillis: number) => {
    // Set isPlayRequested if playing to prevent flicker during seek
    if (isPlayingNow) {
      setIsPlayRequested(true);
    }
    await audioService.seekTo(positionMillis);
  }, [isPlayingNow, setIsPlayRequested]);

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
      savePosition(currentEpisode.id, positionNow);
    }
    await audioService.stop();
  }, [currentEpisode, positionNow, savePosition]);

  // Play next track from queue
  const skipToNext = useCallback(async () => {
    if (currentEpisode && positionNow > 0) {
      savePosition(currentEpisode.id, positionNow);
    }

    const nextEpisode = playNext();
    if (nextEpisode) {
      setIsPlayRequested(true);
      // Get local path for the next episode
      const localPath = getLocalPath(nextEpisode.id);
      const uri = localPath || nextEpisode.audioUrl;
      const initialPosition = getSavedPosition(nextEpisode.id);

      await audioService.play(nextEpisode, uri, {
        startTimeMs: initialPosition,
        autoPlay: true,
        playbackSpeed,
      });
    }
  }, [currentEpisode, positionNow, savePosition, playNext, getLocalPath, getSavedPosition, playbackSpeed, setIsPlayRequested]);

  // Play previous episode in the series or restart current track
  const skipToPrevious = useCallback(async () => {
    // If more than 3 seconds in, restart current track
    if (positionNow > 3000) {
      await audioService.seekTo(0);
      return;
    }

    if (!currentEpisode) {
      await audioService.seekTo(0);
      return;
    }

    // Get the previous episode in the same series
    const showEpisodes = getEpisodesByShowId(currentEpisode.showId);
    const currentIndex = showEpisodes.findIndex((ep) => ep.id === currentEpisode.id);

    if (currentIndex > 0) {
      const prevEpisode = showEpisodes[currentIndex - 1];

      // Save current position
      if (positionNow > 0) {
        savePosition(currentEpisode.id, positionNow);
      }

      // Set the new episode
      setCurrentEpisode(prevEpisode);

      // Rebuild queue with episodes after the previous one (includes current and beyond)
      const remainingEpisodes = showEpisodes.slice(currentIndex);
      setQueue(remainingEpisodes);

      setIsPlayRequested(true);
      const localPath = getLocalPath(prevEpisode.id);
      const uri = localPath || prevEpisode.audioUrl;
      const initialPosition = getSavedPosition(prevEpisode.id);

      await audioService.play(prevEpisode, uri, {
        startTimeMs: initialPosition,
        autoPlay: true,
        playbackSpeed,
      });
    } else {
      // At the first episode, just restart
      await audioService.seekTo(0);
    }
  }, [currentEpisode, positionNow, getEpisodesByShowId, savePosition, setCurrentEpisode, setQueue, getLocalPath, getSavedPosition, playbackSpeed, setIsPlayRequested]);

  return {
    // State - use real-time values from audioState for smooth UI
    currentEpisode,
    isPlaying: isPlayingNow,
    isLoading: isLoadingNow,
    isBuffering: isBufferingNow,
    position: positionNow,
    duration: durationNow,
    playbackSpeed,

    // Actions
    playEpisode,
    togglePlayPause,
    seekForward,
    seekBackward,
    seekTo,
    changePlaybackSpeed,
    stop,
    skipToNext,
    skipToPrevious,

    // Helpers
    isEpisodeDownloaded: isDownloaded,
    hasQueue: queue.length > 0,
    // Check if there's a previous episode in the series
    hasHistory: (() => {
      if (!currentEpisode) return false;
      const showEpisodes = getEpisodesByShowId(currentEpisode.showId);
      const currentIndex = showEpisodes.findIndex((ep) => ep.id === currentEpisode.id);
      return currentIndex > 0;
    })(),
  };
}

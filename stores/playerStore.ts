import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Episode, PlaybackPosition, QueueItem } from '../types';
import { zustandStorage } from '../services/storage';

interface PlayerState {
  // Current playback
  currentEpisode: Episode | null;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  playbackSpeed: number;

  // Queue
  queue: QueueItem[];

  // Saved positions for resuming
  savedPositions: Record<string, PlaybackPosition>;

  // Sleep timer
  sleepTimerEndTime: number | null;

  // Actions
  setCurrentEpisode: (episode: Episode | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Queue actions
  addToQueue: (episode: Episode) => void;
  removeFromQueue: (episodeId: string) => void;
  clearQueue: () => void;
  playNext: () => Episode | null;
  reorderQueue: (fromIndex: number, toIndex: number) => void;

  // Position tracking
  savePosition: (episodeId: string, position: number) => void;
  getSavedPosition: (episodeId: string) => number;
  clearSavedPosition: (episodeId: string) => void;

  // Sleep timer
  setSleepTimer: (minutes: number | null) => void;
  clearSleepTimer: () => void;

  // Reset
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentEpisode: null,
      isPlaying: false,
      isLoading: false,
      isBuffering: false,
      position: 0,
      duration: 0,
      playbackSpeed: 1.0,
      queue: [],
      savedPositions: {},
      sleepTimerEndTime: null,

      setCurrentEpisode: (episode) => {
        const { currentEpisode, position } = get();
        // Save position of current episode before switching
        if (currentEpisode && position > 0) {
          get().savePosition(currentEpisode.id, position);
        }
        set({ currentEpisode: episode, position: 0, duration: 0 });
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsBuffering: (isBuffering) => set({ isBuffering }),
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

      addToQueue: (episode) => {
        const { queue } = get();
        // Don't add duplicates
        if (queue.some((item) => item.episode.id === episode.id)) {
          return;
        }
        set({
          queue: [...queue, { episode, addedAt: new Date() }],
        });
      },

      removeFromQueue: (episodeId) => {
        set({
          queue: get().queue.filter((item) => item.episode.id !== episodeId),
        });
      },

      clearQueue: () => set({ queue: [] }),

      playNext: () => {
        const { queue, currentEpisode, position } = get();
        if (queue.length === 0) return null;

        // Save current position
        if (currentEpisode && position > 0) {
          get().savePosition(currentEpisode.id, position);
        }

        const nextItem = queue[0];
        set({
          currentEpisode: nextItem.episode,
          queue: queue.slice(1),
          position: 0,
          duration: 0,
        });
        return nextItem.episode;
      },

      reorderQueue: (fromIndex, toIndex) => {
        const { queue } = get();
        const newQueue = [...queue];
        const [removed] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, removed);
        set({ queue: newQueue });
      },

      savePosition: (episodeId, position) => {
        // Only save if meaningful progress (> 5 seconds)
        if (position < 5000) return;

        set({
          savedPositions: {
            ...get().savedPositions,
            [episodeId]: {
              episodeId,
              position,
              updatedAt: new Date(),
            },
          },
        });
      },

      getSavedPosition: (episodeId) => {
        const saved = get().savedPositions[episodeId];
        return saved?.position || 0;
      },

      clearSavedPosition: (episodeId) => {
        const { savedPositions } = get();
        const { [episodeId]: _, ...rest } = savedPositions;
        set({ savedPositions: rest });
      },

      setSleepTimer: (minutes) => {
        if (minutes === null) {
          set({ sleepTimerEndTime: null });
        } else {
          set({ sleepTimerEndTime: Date.now() + minutes * 60 * 1000 });
        }
      },

      clearSleepTimer: () => set({ sleepTimerEndTime: null }),

      reset: () => {
        set({
          currentEpisode: null,
          isPlaying: false,
          isLoading: false,
          isBuffering: false,
          position: 0,
          duration: 0,
        });
      },
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        currentEpisode: state.currentEpisode,
        position: state.position,
        duration: state.duration,
        playbackSpeed: state.playbackSpeed,
        queue: state.queue,
        savedPositions: state.savedPositions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Hydrate dates in queue
          state.queue = state.queue.map((item) => ({
            ...item,
            addedAt: new Date(item.addedAt),
            episode: {
              ...item.episode,
              publishedAt: new Date(item.episode.publishedAt),
            },
          }));
          // Hydrate current episode date
          if (state.currentEpisode) {
            state.currentEpisode.publishedAt = new Date(
              state.currentEpisode.publishedAt
            );
          }
          // Hydrate saved positions dates
          Object.keys(state.savedPositions).forEach((key) => {
            state.savedPositions[key].updatedAt = new Date(
              state.savedPositions[key].updatedAt
            );
          });
          // Don't auto-play on rehydrate
          state.isPlaying = false;
          state.isLoading = false;
          state.isBuffering = false;
        }
      },
    }
  )
);

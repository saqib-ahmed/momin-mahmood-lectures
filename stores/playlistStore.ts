import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Playlist } from '../types';
import { zustandStorage } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

interface PlaylistState {
  playlists: Playlist[];

  // Actions
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  renamePlaylist: (playlistId: string, newName: string) => void;

  // Episode management
  addToPlaylist: (playlistId: string, episodeId: string) => void;
  removeFromPlaylist: (playlistId: string, episodeId: string) => void;
  reorderPlaylist: (
    playlistId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  isInPlaylist: (playlistId: string, episodeId: string) => boolean;

  // Getters
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  getPlaylistsForEpisode: (episodeId: string) => Playlist[];
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (name) => {
        const playlist: Playlist = {
          id: uuidv4(),
          name,
          episodeIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set({ playlists: [...get().playlists, playlist] });
        return playlist;
      },

      deletePlaylist: (playlistId) => {
        set({
          playlists: get().playlists.filter((p) => p.id !== playlistId),
        });
      },

      renamePlaylist: (playlistId, newName) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, name: newName, updatedAt: new Date() }
              : p
          ),
        });
      },

      addToPlaylist: (playlistId, episodeId) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            // Don't add duplicates
            if (p.episodeIds.includes(episodeId)) return p;
            return {
              ...p,
              episodeIds: [...p.episodeIds, episodeId],
              updatedAt: new Date(),
            };
          }),
        });
      },

      removeFromPlaylist: (playlistId, episodeId) => {
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  episodeIds: p.episodeIds.filter((id) => id !== episodeId),
                  updatedAt: new Date(),
                }
              : p
          ),
        });
      },

      reorderPlaylist: (playlistId, fromIndex, toIndex) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const newEpisodeIds = [...p.episodeIds];
            const [removed] = newEpisodeIds.splice(fromIndex, 1);
            newEpisodeIds.splice(toIndex, 0, removed);
            return {
              ...p,
              episodeIds: newEpisodeIds,
              updatedAt: new Date(),
            };
          }),
        });
      },

      isInPlaylist: (playlistId, episodeId) => {
        const playlist = get().playlists.find((p) => p.id === playlistId);
        return playlist?.episodeIds.includes(episodeId) || false;
      },

      getPlaylistById: (playlistId) => {
        return get().playlists.find((p) => p.id === playlistId);
      },

      getPlaylistsForEpisode: (episodeId) => {
        return get().playlists.filter((p) => p.episodeIds.includes(episodeId));
      },
    }),
    {
      name: 'playlist-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Hydrate dates
          state.playlists = state.playlists.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }));
        }
      },
    }
  )
);

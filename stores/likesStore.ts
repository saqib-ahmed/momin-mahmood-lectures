import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../services/storage';

interface LikesState {
  // Set of liked episode IDs
  likedEpisodeIds: string[];

  // Actions
  toggleLike: (episodeId: string) => void;
  isLiked: (episodeId: string) => boolean;
  getLikedEpisodeIds: () => string[];
  clearAllLikes: () => void;
}

export const useLikesStore = create<LikesState>()(
  persist(
    (set, get) => ({
      likedEpisodeIds: [],

      toggleLike: (episodeId: string) => {
        const { likedEpisodeIds } = get();
        const isCurrentlyLiked = likedEpisodeIds.includes(episodeId);

        if (isCurrentlyLiked) {
          set({
            likedEpisodeIds: likedEpisodeIds.filter((id) => id !== episodeId),
          });
        } else {
          set({
            likedEpisodeIds: [episodeId, ...likedEpisodeIds],
          });
        }
      },

      isLiked: (episodeId: string) => {
        return get().likedEpisodeIds.includes(episodeId);
      },

      getLikedEpisodeIds: () => {
        return get().likedEpisodeIds;
      },

      clearAllLikes: () => {
        set({ likedEpisodeIds: [] });
      },
    }),
    {
      name: 'likes-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

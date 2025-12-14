import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Searchbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRSSFeed } from '../hooks/useRSSFeed';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { useLikesStore } from '../stores/likesStore';
import { COLORS } from '../constants';
import { Episode } from '../types';
import { formatDuration } from '../services/rssParser';

function SearchResultCard({
  episode,
  isPlaying,
  isLiked,
  onPlay,
  onPress,
  onToggleLike,
}: {
  episode: Episode;
  isPlaying: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onPress: () => void;
  onToggleLike: () => void;
}) {
  const formattedDate = new Date(episode.publishedAt).toLocaleDateString(
    undefined,
    { year: 'numeric', month: 'short', day: 'numeric' }
  );

  return (
    <TouchableOpacity style={styles.episodeCard} onPress={onPress}>
      <Image
        source={{ uri: episode.imageUrl }}
        style={styles.artwork}
        contentFit="cover"
        cachePolicy="disk"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={4}>
          {episode.title}
        </Text>
        <Text style={styles.meta}>
          {formatDuration(episode.duration)} &middot; {formattedDate}
        </Text>
      </View>
      <View style={styles.actions}>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          iconColor={COLORS.primary}
          size={28}
          onPress={onPlay}
        />
        <IconButton
          icon={isLiked ? 'heart' : 'heart-outline'}
          iconColor={isLiked ? COLORS.error : COLORS.textSecondary}
          size={22}
          onPress={onToggleLike}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const { searchEpisodes, episodes } = useRSSFeed();
  const { playEpisode, currentEpisode, isPlaying, togglePlayPause } = useAudioPlayer();
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);
  const { toggleLike, isLiked } = useLikesStore();

  const bottomPadding = playerHasEpisode ? 80 : 0;

  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return [];
    }
    return searchEpisodes(searchQuery.trim());
  }, [searchQuery, searchEpisodes]);

  const totalEpisodes = episodes.length;

  return (
    <ImageBackground
      source={require('../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search lectures..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor={COLORS.textSecondary}
          placeholderTextColor={COLORS.textSecondary}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <Text style={styles.resultCount}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
        )}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentEpisode = currentEpisode?.id === item.id;
          const isEpisodePlaying = isCurrentEpisode && isPlaying;
          const episodeLiked = isLiked(item.id);
          return (
            <SearchResultCard
              episode={item}
              isPlaying={isEpisodePlaying}
              isLiked={episodeLiked}
              onPlay={() => {
                if (isCurrentEpisode) {
                  togglePlayPause();
                } else {
                  playEpisode(item);
                }
              }}
              onPress={() => router.push(`/episode/${item.id}`)}
              onToggleLike={() => toggleLike(item.id)}
            />
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery.length < 2 ? (
              <>
                <IconButton
                  icon="magnify"
                  iconColor={COLORS.textSecondary}
                  size={64}
                />
                <Text style={styles.emptyText}>Search {totalEpisodes} lectures</Text>
                <Text style={styles.emptySubtext}>
                  Search by title or description
                </Text>
              </>
            ) : (
              <>
                <IconButton
                  icon="file-search-outline"
                  iconColor={COLORS.textSecondary}
                  size={64}
                />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with different keywords
                </Text>
              </>
            )}
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  searchbar: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    color: COLORS.text,
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

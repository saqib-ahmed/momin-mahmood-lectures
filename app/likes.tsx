import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLikesStore } from '../stores/likesStore';
import { useRSSFeed } from '../hooks/useRSSFeed';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { COLORS } from '../constants';
import { Episode } from '../types';
import { formatDuration } from '../services/rssParser';
import { GoldenMandala } from '../components/IslamicPattern';

function LikedEpisodeCard({
  episode,
  isPlaying,
  onPlay,
  onPress,
  onUnlike,
}: {
  episode: Episode;
  isPlaying: boolean;
  onPlay: () => void;
  onPress: () => void;
  onUnlike: () => void;
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
        <Text style={styles.title} numberOfLines={2}>
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
          size={32}
          onPress={onPlay}
        />
        <IconButton
          icon="heart"
          iconColor={COLORS.error}
          size={24}
          onPress={onUnlike}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function LikesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { likedEpisodeIds, toggleLike, clearAllLikes } = useLikesStore();
  const { getEpisodeById } = useRSSFeed();
  const { playEpisode, currentEpisode, isPlaying, togglePlayPause } = useAudioPlayer();
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const bottomPadding = playerHasEpisode ? 80 : 0;

  // Get liked episodes from feed data
  const likedEpisodes = likedEpisodeIds
    .map((id) => getEpisodeById(id))
    .filter((ep): ep is Episode => ep !== undefined);

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Likes',
      'Are you sure you want to remove all liked lectures?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllLikes,
        },
      ]
    );
  };

  const handleUnlike = (episodeId: string) => {
    toggleLike(episodeId);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerInfo}>
        <GoldenMandala size={24} />
        <Text style={styles.headerTitle}>Liked Lectures</Text>
        <Text style={styles.episodeCountText}>
          {likedEpisodes.length} lecture
          {likedEpisodes.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {likedEpisodes.length > 0 && (
        <Button
          mode="outlined"
          onPress={handleClearAll}
          textColor={COLORS.error}
          style={styles.clearAllButton}
        >
          Clear All
        </Button>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <FlatList
        data={likedEpisodes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentEpisode = currentEpisode?.id === item.id;
          const isEpisodePlaying = isCurrentEpisode && isPlaying;
          return (
            <LikedEpisodeCard
              episode={item}
              isPlaying={isEpisodePlaying}
              onPlay={() => {
                if (isCurrentEpisode) {
                  togglePlayPause();
                } else {
                  playEpisode(item);
                }
              }}
              onPress={() => router.push(`/episode/${item.id}`)}
              onUnlike={() => handleUnlike(item.id)}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton
              icon="heart-outline"
              iconColor={COLORS.textSecondary}
              size={64}
            />
            <Text style={styles.emptyText}>No liked lectures</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on lectures to save them here
            </Text>
          </View>
        }
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  episodeCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  clearAllButton: {
    borderColor: COLORS.error,
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
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
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

import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Button } from 'react-native-paper';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaylistStore } from '../../stores/playlistStore';
import { useFeedStore } from '../../stores/feedStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS } from '../../constants';
import { Episode } from '../../types';
import { formatDuration } from '../../services/rssParser';
import { GoldenMandala } from '../../components/IslamicPattern';

const PlaylistEpisodeCard = memo(function PlaylistEpisodeCard({
  episode,
  isPlaying,
  onPlay,
  onRemove,
}: {
  episode: Episode;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.episodeCard}>
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
        <Text style={styles.meta}>{formatDuration(episode.duration)}</Text>
      </View>
      <IconButton
        icon={isPlaying ? 'pause' : 'play'}
        iconColor={COLORS.primary}
        size={32}
        onPress={onPlay}
      />
      <IconButton
        icon="close"
        iconColor={COLORS.textSecondary}
        size={20}
        onPress={onRemove}
      />
    </View>
  );
});

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getPlaylistById, removeFromPlaylist } = usePlaylistStore();
  const { getEpisodeById } = useFeedStore();
  const { playEpisode, togglePlayPause } = useAudioPlayer();
  const { addToQueue } = usePlayerStore();
  // Use selective subscriptions to avoid re-renders from position updates
  const currentEpisodeId = usePlayerStore((s) => s.currentEpisode?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const playlist = getPlaylistById(id || '');
  const bottomPadding = playerHasEpisode ? 80 : 0;

  if (!playlist) {
    return (
      <ImageBackground
        source={require('../../assets/background-transparent.png')}
        style={styles.centerContainer}
        resizeMode="cover"
        imageStyle={{ opacity: 0.1 }}
      >
        <GoldenMandala size={48} />
        <Text style={styles.errorText}>Playlist not found</Text>
      </ImageBackground>
    );
  }

  // Get episode objects for the playlist
  const episodes = playlist.episodeIds
    .map((epId) => getEpisodeById(epId))
    .filter((ep): ep is Episode => ep !== undefined);

  const handlePlayAll = () => {
    if (episodes.length > 0) {
      playEpisode(episodes[0]);
      // Add remaining episodes to queue
      episodes.slice(1).forEach((ep) => addToQueue(ep));
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.playlistName}>{playlist.name}</Text>
      <Text style={styles.episodeCount}>
        {episodes.length} episode{episodes.length !== 1 ? 's' : ''}
      </Text>
      {episodes.length > 0 && (
        <Button
          mode="contained"
          icon="play"
          onPress={handlePlayAll}
          style={styles.playAllButton}
        >
          Play All
        </Button>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <Stack.Screen
        options={{
          title: playlist.name,
        }}
      />
      <FlatList
        data={episodes}
        keyExtractor={(item) => item.id}
        extraData={currentEpisodeId}
        renderItem={({ item }) => {
          const isCurrentEpisode = currentEpisodeId === item.id;
          const isEpisodePlaying = isCurrentEpisode && isPlaying;
          return (
            <PlaylistEpisodeCard
              episode={item}
              isPlaying={isEpisodePlaying}
              onPlay={() => {
                if (isCurrentEpisode) {
                  togglePlayPause();
                } else {
                  playEpisode(item);
                }
              }}
              onRemove={() => removeFromPlaylist(playlist.id, item.id)}
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
            <Text style={styles.emptyText}>This playlist is empty</Text>
            <Text style={styles.emptySubtext}>
              Add episodes from the episode detail screen
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
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    marginBottom: 8,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  episodeCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  playAllButton: {
    backgroundColor: COLORS.primary,
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
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

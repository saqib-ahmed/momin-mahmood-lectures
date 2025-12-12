import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDownloads } from '../hooks/useDownloads';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { COLORS } from '../constants';
import { DownloadedEpisode } from '../types';
import { formatDuration } from '../services/rssParser';

function DownloadedEpisodeCard({
  episode,
  isPlaying,
  onPlay,
  onDelete,
}: {
  episode: DownloadedEpisode;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const fileSizeMB = (episode.fileSize / (1024 * 1024)).toFixed(1);
  const downloadDate = new Date(episode.downloadedAt).toLocaleDateString();

  return (
    <View style={styles.episodeCard}>
      <Image source={{ uri: episode.imageUrl }} style={styles.artwork} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {episode.title}
        </Text>
        <Text style={styles.meta}>
          {formatDuration(episode.duration)} &middot; {fileSizeMB} MB
        </Text>
        <Text style={styles.date}>Downloaded {downloadDate}</Text>
      </View>
      <View style={styles.actions}>
        <IconButton
          icon={isPlaying ? 'pause' : 'play'}
          iconColor={COLORS.primary}
          size={32}
          onPress={onPlay}
        />
        <IconButton
          icon="delete"
          iconColor={COLORS.error}
          size={24}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const { downloadedEpisodes, totalDownloadSize, deleteDownload, deleteAllDownloads } =
    useDownloads();
  const { playEpisode, currentEpisode, isPlaying } = useAudioPlayer();
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const bottomPadding = playerHasEpisode ? 80 : 0;
  const totalSizeMB = (totalDownloadSize / (1024 * 1024)).toFixed(1);
  const totalSizeGB = (totalDownloadSize / (1024 * 1024 * 1024)).toFixed(2);
  const displaySize = totalDownloadSize > 1024 * 1024 * 1024 ? `${totalSizeGB} GB` : `${totalSizeMB} MB`;

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Downloads',
      'Are you sure you want to delete all downloaded episodes? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: deleteAllDownloads,
        },
      ]
    );
  };

  const handleDeleteEpisode = (episodeId: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this downloaded episode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDownload(episodeId),
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.storageInfo}>
        <Text style={styles.storageLabel}>Storage Used</Text>
        <Text style={styles.storageValue}>{displaySize}</Text>
        <Text style={styles.episodeCountText}>
          {downloadedEpisodes.length} episode
          {downloadedEpisodes.length !== 1 ? 's' : ''}
        </Text>
      </View>
      {downloadedEpisodes.length > 0 && (
        <Button
          mode="outlined"
          onPress={handleDeleteAll}
          textColor={COLORS.error}
          style={styles.deleteAllButton}
        >
          Delete All
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={downloadedEpisodes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DownloadedEpisodeCard
            episode={item}
            isPlaying={currentEpisode?.id === item.id && isPlaying}
            onPlay={() => playEpisode(item)}
            onDelete={() => handleDeleteEpisode(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton
              icon="download-off"
              iconColor={COLORS.textSecondary}
              size={64}
            />
            <Text style={styles.emptyText}>No downloaded episodes</Text>
            <Text style={styles.emptySubtext}>
              Download episodes to listen offline
            </Text>
          </View>
        }
      />
    </View>
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
  storageInfo: {
    flex: 1,
  },
  storageLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  storageValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  episodeCountText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deleteAllButton: {
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
  date: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  },
});

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { Text, Button, IconButton, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRSSFeed } from '../../hooks/useRSSFeed';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDownloads } from '../../hooks/useDownloads';
import { usePlayerStore } from '../../stores/playerStore';
import { usePlaylistStore } from '../../stores/playlistStore';
import { COLORS } from '../../constants';
import { formatDuration, stripHtml } from '../../services/rssParser';
import { GoldenMandala } from '../../components/IslamicPattern';

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getEpisodeById, getShowById } = useRSSFeed();
  const { playEpisode, currentEpisode, isPlaying, togglePlayPause } = useAudioPlayer();
  const {
    isDownloaded,
    isDownloading,
    startDownload,
    deleteDownload,
    getProgress,
  } = useDownloads();
  const { addToQueue } = usePlayerStore();
  const { playlists, addToPlaylist } = usePlaylistStore();

  const episode = getEpisodeById(id || '');
  const show = episode ? getShowById(episode.showId) : null;
  const downloaded = episode ? isDownloaded(episode.id) : false;
  const downloading = episode ? isDownloading(episode.id) : false;
  const downloadProgress = episode ? getProgress(episode.id) : undefined;
  const isCurrentEpisode = currentEpisode?.id === episode?.id;
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const bottomPadding = playerHasEpisode ? 80 : 0;

  if (!episode) {
    return (
      <ImageBackground
        source={require('../../assets/background-transparent.png')}
        style={styles.centerContainer}
        resizeMode="cover"
        imageStyle={{ opacity: 0.1 }}
      >
        <GoldenMandala size={48} />
        <Text style={styles.errorText}>Lecture not found</Text>
      </ImageBackground>
    );
  }

  const formattedDate = new Date(episode.publishedAt).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const fileSizeMB = (episode.fileSize / (1024 * 1024)).toFixed(1);

  return (
    <ImageBackground
      source={require('../../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <Stack.Screen
        options={{
          title: 'Lecture Details',
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + insets.bottom + 20 },
        ]}
      >
        <Image source={{ uri: episode.imageUrl }} style={styles.artwork} />

        <View style={styles.content}>
          {episode.season && episode.episodeNumber && (
            <Text style={styles.meta}>
              Season {episode.season} &middot; Episode {episode.episodeNumber}
            </Text>
          )}
          <Text style={styles.title}>{episode.title}</Text>
          {show && (
            <Text style={styles.showName}>{show.title}</Text>
          )}
          <Text style={styles.date}>
            {formattedDate} &middot; {formatDuration(episode.duration)} &middot;{' '}
            {fileSizeMB} MB
          </Text>

          {/* Play/Pause Button */}
          <Button
            mode="contained"
            icon={isCurrentEpisode && isPlaying ? 'pause' : 'play'}
            onPress={() => {
              if (isCurrentEpisode) {
                togglePlayPause();
              } else {
                playEpisode(episode);
              }
            }}
            style={styles.playButton}
            contentStyle={styles.playButtonContent}
          >
            {isCurrentEpisode && isPlaying ? 'Pause' : 'Play Episode'}
          </Button>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {/* Download/Delete Button */}
            {downloaded ? (
              <Button
                mode="outlined"
                icon="delete"
                onPress={() => deleteDownload(episode.id)}
                style={styles.actionButton}
                textColor={COLORS.error}
              >
                Remove
              </Button>
            ) : downloading ? (
              <View style={styles.downloadingContainer}>
                <Text style={styles.downloadingText}>
                  Downloading... {downloadProgress?.progress.toFixed(0)}%
                </Text>
                <ProgressBar
                  progress={(downloadProgress?.progress || 0) / 100}
                  color={COLORS.primary}
                  style={styles.downloadProgress}
                />
              </View>
            ) : (
              <Button
                mode="outlined"
                icon="download"
                onPress={() => startDownload(episode)}
                style={styles.actionButton}
              >
                Download
              </Button>
            )}

            {/* Add to Queue */}
            <IconButton
              icon="playlist-plus"
              iconColor={COLORS.text}
              size={24}
              onPress={() => addToQueue(episode)}
              style={styles.iconButton}
            />
          </View>

          {/* Add to Playlist */}
          {playlists.length > 0 && (
            <View style={styles.playlistSection}>
              <Text style={styles.sectionTitle}>Add to Playlist</Text>
              <View style={styles.playlistButtons}>
                {playlists.map((playlist) => (
                  <Button
                    key={playlist.id}
                    mode="outlined"
                    compact
                    onPress={() => addToPlaylist(playlist.id, episode.id)}
                    style={styles.playlistButton}
                  >
                    {playlist.name}
                  </Button>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {stripHtml(episode.description)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  scrollContent: {
    paddingBottom: 20,
  },
  artwork: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.surfaceLight,
  },
  content: {
    padding: 16,
  },
  meta: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  showName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    marginBottom: 16,
  },
  playButtonContent: {
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderColor: COLORS.surfaceLight,
  },
  iconButton: {
    backgroundColor: COLORS.surface,
  },
  downloadingContainer: {
    flex: 1,
  },
  downloadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  downloadProgress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceLight,
  },
  playlistSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  playlistButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playlistButton: {
    borderColor: COLORS.surfaceLight,
  },
  descriptionSection: {
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
});

import React, { useMemo, memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Chip, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRSSFeed } from '../../hooks/useRSSFeed';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDownloads } from '../../hooks/useDownloads';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS } from '../../constants';
import { Episode, Show } from '../../types';
import { formatDuration, stripHtml } from '../../services/rssParser';
import { GoldenMandala, HeaderDecoration } from '../../components/IslamicPattern';

// Memoized header component to prevent re-renders during audio playback
const ShowHeader = memo(function ShowHeader({
  show,
  seasons,
  selectedSeason,
  onSeasonSelect,
}: {
  show: Show;
  seasons: number[];
  selectedSeason: number | null;
  onSeasonSelect: (season: number | null) => void;
}) {
  const hasResourceLinks = show.youtubePlaylist || show.pdfUrl || show.shamelaUrl;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.header}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: show.imageUrl }}
          style={styles.showImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.showDetails}>
        <Text style={styles.showTitle}>{show.title}</Text>
        <Text style={styles.episodeCount}>
          {show.episodeCount} {show.episodeCount === 1 ? 'Lecture' : 'Lectures'}
        </Text>
      </View>

      {/* External Resource Links */}
      {hasResourceLinks && (
        <View style={styles.resourceLinks}>
          {show.youtubePlaylist && (
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => openUrl(show.youtubePlaylist!)}
            >
              <IconButton
                icon="youtube"
                iconColor={COLORS.text}
                size={20}
                style={styles.resourceIcon}
              />
              <Text style={styles.resourceText}>YouTube</Text>
            </TouchableOpacity>
          )}
          {show.pdfUrl && (
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => openUrl(show.pdfUrl!)}
            >
              <IconButton
                icon="file-pdf-box"
                iconColor={COLORS.text}
                size={20}
                style={styles.resourceIcon}
              />
              <Text style={styles.resourceText}>PDF</Text>
            </TouchableOpacity>
          )}
          {show.shamelaUrl && (
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => openUrl(show.shamelaUrl!)}
            >
              <IconButton
                icon="book-open-variant"
                iconColor={COLORS.text}
                size={20}
                style={styles.resourceIcon}
              />
              <Text style={styles.resourceText}>Shamela</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <HeaderDecoration />
      {seasons.length > 1 && (
        <View style={styles.seasonFilter}>
          <Chip
            selected={selectedSeason === null}
            onPress={() => onSeasonSelect(null)}
            style={[styles.seasonChip, selectedSeason === null && styles.seasonChipSelected]}
            textStyle={styles.seasonChipText}
          >
            All
          </Chip>
          {seasons.map((season) => (
            <Chip
              key={season}
              selected={selectedSeason === season}
              onPress={() => onSeasonSelect(season)}
              style={[styles.seasonChip, selectedSeason === season && styles.seasonChipSelected]}
              textStyle={styles.seasonChipText}
            >
              Part {season}
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
});

function EpisodeCard({
  episode,
  isPlaying,
  isLoading,
  isDownloaded,
  onPlay,
  onPress,
}: {
  episode: Episode;
  isPlaying: boolean;
  isLoading: boolean;
  isDownloaded: boolean;
  onPlay: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.episodeCard} onPress={onPress}>
      <View style={styles.episodeContent}>
        <Image
          source={{ uri: episode.imageUrl }}
          style={styles.episodeImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        <View style={styles.episodeInfo}>
          {/* {episode.season && episode.episodeNumber && (
            <Text style={styles.episodeMeta}>
              S{episode.season} E{episode.episodeNumber}
            </Text>
          )} */}
          <Text style={styles.episodeTitle} numberOfLines={4}>
            {episode.title}
          </Text>
          <View style={styles.episodeFooter}>
            <Text style={styles.episodeDuration}>
              {formatDuration(episode.duration)}
            </Text>
            {isDownloaded && (
              <Chip
                icon="download-circle"
                compact
                style={styles.downloadedChip}
                textStyle={styles.downloadedChipText}
              >
                Downloaded
              </Chip>
            )}
          </View>
        </View>
{isLoading ? (
          <ActivityIndicator size={44} color={COLORS.primary} style={{ marginHorizontal: 12 }} />
        ) : (
          <IconButton
            icon={isPlaying ? 'pause-circle' : 'play-circle'}
            iconColor={COLORS.primary}
            size={44}
            onPress={onPlay}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getShowById, getEpisodesByShowId } = useRSSFeed();
  const { playEpisode, currentEpisode, isPlaying, isLoading, togglePlayPause } = useAudioPlayer();
  const { isDownloaded } = useDownloads();
  const playerCurrentEpisode = usePlayerStore((s) => s.currentEpisode);

  const show = getShowById(id || '');
  const episodes = useMemo(
    () => getEpisodesByShowId(id || ''),
    [id, getEpisodesByShowId]
  );

  const bottomPadding = playerCurrentEpisode ? 80 : 0;

  // Get unique seasons
  const seasons = useMemo(() => {
    const seasonSet = new Set(
      episodes
        .filter((ep) => ep.season)
        .map((ep) => ep.season as number)
    );
    return Array.from(seasonSet).sort((a, b) => b - a);
  }, [episodes]);

  const [selectedSeason, setSelectedSeason] = React.useState<number | null>(null);

  const filteredEpisodes = useMemo(() => {
    if (selectedSeason === null) return episodes;
    return episodes.filter((ep) => ep.season === selectedSeason);
  }, [episodes, selectedSeason]);

  // Memoize the season select callback to prevent ShowHeader re-renders
  const handleSeasonSelect = useCallback((season: number | null) => {
    setSelectedSeason(season);
  }, []);

  // Memoize the header element to prevent recreation on every render
  const headerElement = useMemo(() => {
    if (!show) return null;
    return (
      <ShowHeader
        show={show}
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSeasonSelect={handleSeasonSelect}
      />
    );
  }, [show, seasons, selectedSeason, handleSeasonSelect]);

  if (!show) {
    return (
      <ImageBackground
        source={require('../../assets/background-transparent.png')}
        style={styles.centerContainer}
        resizeMode="cover"
        imageStyle={{ opacity: 0.1 }}
      >
        <GoldenMandala size={48} />
        <Text style={styles.errorText}>Lecture series not found</Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <Stack.Screen
        options={{
          title: show.title,
        }}
      />
      <FlatList
        data={filteredEpisodes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCurrentEpisode = currentEpisode?.id === item.id;
          const isEpisodePlaying = isCurrentEpisode && isPlaying;
          const isEpisodeLoading = isCurrentEpisode && isLoading;
          return (
            <EpisodeCard
              episode={item}
              isPlaying={isEpisodePlaying}
              isLoading={isEpisodeLoading}
              isDownloaded={isDownloaded(item.id)}
              onPlay={() => {
                if (isCurrentEpisode) {
                  togglePlayPause();
                } else {
                  playEpisode(item);
                }
              }}
              onPress={() => router.push(`/episode/${item.id}`)}
            />
          );
        }}
        ListHeaderComponent={headerElement}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom },
        ]}
      />
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
    marginTop: 12,
  },
  header: {
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  showImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  showDetails: {
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  showAuthor: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  showCategory: {
    fontSize: 14,
    color: COLORS.gold,
    marginLeft: 6,
  },
  episodeCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resourceLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: 12,
    paddingVertical: 2,
  },
  resourceIcon: {
    margin: 0,
  },
  resourceText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  seasonFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  seasonChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seasonChipSelected: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.gold,
  },
  seasonChipText: {
    color: COLORS.text,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  episodeCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  episodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    marginRight: 12,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeMeta: {
    fontSize: 12,
    color: COLORS.gold,
    marginBottom: 4,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  episodeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  episodeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  episodeDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  downloadedChip: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  downloadedChipText: {
    fontSize: 11,
    color: COLORS.primary,
  },
});

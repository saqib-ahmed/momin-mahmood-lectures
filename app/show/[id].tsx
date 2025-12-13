import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRSSFeed } from '../../hooks/useRSSFeed';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDownloads } from '../../hooks/useDownloads';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS } from '../../constants';
import { Episode } from '../../types';
import { formatDuration, stripHtml } from '../../services/rssParser';
import { GoldenMandala, HeaderDecoration } from '../../components/IslamicPattern';

function EpisodeCard({
  episode,
  isPlaying,
  isDownloaded,
  onPlay,
  onPress,
}: {
  episode: Episode;
  isPlaying: boolean;
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
          <Text style={styles.episodeTitle} numberOfLines={2}>
            {episode.title}
          </Text>
          <Text style={styles.episodeDescription} numberOfLines={2}>
            {stripHtml(episode.description)}
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
        <IconButton
          icon={isPlaying ? 'pause-circle' : 'play-circle'}
          iconColor={COLORS.primary}
          size={44}
          onPress={onPlay}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getShowById, getEpisodesByShowId } = useRSSFeed();
  const { playEpisode, currentEpisode, isPlaying, togglePlayPause } = useAudioPlayer();
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

  const renderHeader = () => (
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
        <Text style={styles.showAuthor}>{show.author}</Text>
        {/* <View style={styles.categoryRow}>
          <GoldenMandala size={16} />
          <Text style={styles.showCategory}>{show.category}</Text>
        </View> */}
        <Text style={styles.episodeCount}>
          {show.episodeCount} {show.episodeCount === 1 ? 'Lecture' : 'Lectures'}
        </Text>
      </View>
      <HeaderDecoration />
      {seasons.length > 1 && (
        <View style={styles.seasonFilter}>
          <Chip
            selected={selectedSeason === null}
            onPress={() => setSelectedSeason(null)}
            style={[styles.seasonChip, selectedSeason === null && styles.seasonChipSelected]}
            textStyle={styles.seasonChipText}
          >
            All
          </Chip>
          {seasons.map((season) => (
            <Chip
              key={season}
              selected={selectedSeason === season}
              onPress={() => setSelectedSeason(season)}
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
          return (
            <EpisodeCard
              episode={item}
              isPlaying={isEpisodePlaying}
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
        ListHeaderComponent={renderHeader}
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
  },
  showTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
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
    width: 60,
    height: 60,
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

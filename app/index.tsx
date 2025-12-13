import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Image } from 'expo-image';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRSSFeed } from '../hooks/useRSSFeed';
import { usePlayerStore } from '../stores/playerStore';
import { COLORS } from '../constants';
import { Show } from '../types';
import { GoldenMandala, HeaderDecoration } from '../components/IslamicPattern';

function LectureSeriesCard({ show, onPress }: { show: Show; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.lectureCard} onPress={onPress}>
      {/* Decorative corner accents */}
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />

      <Image
        source={{ uri: show.imageUrl }}
        style={styles.lectureImage}
        contentFit="cover"
        cachePolicy="disk"
      />
      <View style={styles.lectureInfo}>
        <Text style={styles.lectureTitle} numberOfLines={2}>
          {show.title}
        </Text>
        <View style={styles.lectureMetaRow}>
          <GoldenMandala size={14} />
          <Text style={styles.lectureMeta}>
            {show.episodeCount} {show.episodeCount === 1 ? 'Lecture' : 'Lectures'}
          </Text>
        </View>
        <Text style={styles.lectureAuthor} numberOfLines={1}>
          {show.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { shows, isLoading, isRefreshing, onRefresh, error, isOffline, isHydrated } = useRSSFeed();
  const { currentEpisode } = usePlayerStore();

  const bottomPadding = currentEpisode ? 80 : 0;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <IconButton
            icon="wifi-off"
            iconColor={COLORS.background}
            size={16}
            style={styles.offlineBannerIcon}
          />
          <Text style={styles.offlineBannerText}>
            No internet connection - showing cached lectures
          </Text>
        </View>
      )}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lecture Series</Text>
          {/* <Text style={styles.headerSubtitle}>Islamic Knowledge & Guidance</Text> */}
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="download"
            iconColor={COLORS.gold}
            size={24}
            onPress={() => router.push('/downloads')}
          />
          <IconButton
            icon="playlist-music"
            iconColor={COLORS.gold}
            size={24}
            onPress={() => router.push('/playlists')}
          />
          <IconButton
            icon="cog"
            iconColor={COLORS.gold}
            size={24}
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>
      <HeaderDecoration />
    </View>
  );

  // Show loading only when we have no cached data and are actually loading
  // Don't show loading during hydration if we have cached data
  if (!isHydrated || (isLoading && shows.length === 0)) {
    return (
      <ImageBackground
        source={require('../assets/background-transparent.png')}
        style={styles.centerContainer}
        resizeMode="cover"
        imageStyle={{ opacity: 0.1 }}
      >
        <GoldenMandala size={64} />
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Loading lectures...</Text>
      </ImageBackground>
    );
  }

  // Only show error screen if we have no cached data
  if (error && shows.length === 0) {
    return (
      <ImageBackground
        source={require('../assets/background-transparent.png')}
        style={styles.centerContainer}
        resizeMode="cover"
        imageStyle={{ opacity: 0.1 }}
      >
        <GoldenMandala size={64} />
        <Text style={styles.errorText}>Failed to load lectures</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <FlatList
        data={shows}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LectureSeriesCard
            show={item}
            onPress={() => router.push(`/show/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GoldenMandala size={48} />
            <Text style={styles.emptyText}>No lectures found</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
    opacity: 0.5,
  },
  loader: {
    marginTop: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  retryText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  headerContainer: {
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gold,
    marginTop: 2,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  offlineBannerIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  offlineBannerText: {
    fontSize: 13,
    color: COLORS.background,
    fontWeight: '600',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  listContent: {
    paddingBottom: 20,
  },
  lectureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative corner accents
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderBottomRightRadius: 12,
  },
  lectureImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lectureInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  lectureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  lectureMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lectureMeta: {
    fontSize: 13,
    color: COLORS.gold,
    marginLeft: 6,
  },
  lectureAuthor: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});

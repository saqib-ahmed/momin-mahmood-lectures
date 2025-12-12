import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, IconButton, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { COLORS } from '../constants';

export default function MiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentEpisode,
    isPlaying,
    isLoading,
    position,
    duration,
    togglePlayPause,
  } = useAudioPlayer();

  if (!currentEpisode) {
    return null;
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { paddingBottom: insets.bottom || 8 }]}
      onPress={() => router.push('/player')}
      activeOpacity={0.9}
    >
      <ProgressBar
        progress={progress}
        color={COLORS.gold}
        style={styles.progressBar}
      />
      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <Image
            source={{ uri: currentEpisode.imageUrl }}
            style={styles.artwork}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentEpisode.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Tap to expand
          </Text>
        </View>
        <IconButton
          icon={isLoading ? 'loading' : isPlaying ? 'pause' : 'play'}
          iconColor={COLORS.gold}
          size={28}
          onPress={togglePlayPause}
          disabled={isLoading}
          style={styles.playButton}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressBar: {
    height: 2,
    backgroundColor: COLORS.surfaceLight,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
  },
  artworkContainer: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  artwork: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  playButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
  },
});

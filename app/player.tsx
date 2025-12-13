import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import { Text, IconButton, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { COLORS, PLAYBACK_SPEEDS, SLEEP_TIMER_OPTIONS } from '../constants';
import { formatDuration } from '../services/rssParser';
import { GoldenMandala } from '../components/IslamicPattern';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentEpisode,
    isPlaying,
    position,
    duration,
    playbackSpeed,
    sleepTimerEndTime,
    togglePlayPause,
    seekForward,
    seekBackward,
    seekTo,
    changePlaybackSpeed,
    skipToNext,
    skipToPrevious,
    hasQueue,
    hasHistory,
  } = useAudioPlayer();

  const { setSleepTimer, clearSleepTimer, queue } = usePlayerStore();

  const [speedMenuVisible, setSpeedMenuVisible] = useState(false);
  const [sleepMenuVisible, setSleepMenuVisible] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  if (!currentEpisode) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <IconButton
            icon="chevron-down"
            iconColor={COLORS.text}
            size={28}
            onPress={() => router.back()}
          />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No episode playing</Text>
        </View>
      </View>
    );
  }

  const positionSeconds = (isSeeking ? seekPosition : position) / 1000;
  const durationSeconds = duration / 1000;
  const progress = durationSeconds > 0 ? positionSeconds / durationSeconds : 0;

  // Calculate remaining sleep time
  const sleepTimeRemaining = sleepTimerEndTime
    ? Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 60000))
    : null;

  return (
    <ImageBackground
      source={require('../assets/background-transparent.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.1 }}
    >
      <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <IconButton
          icon="chevron-down"
          iconColor={COLORS.text}
          size={28}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle} numberOfLines={1}>
          Now Playing
        </Text>
        <View style={{ width: 40 }} />
      </View> */}

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <Image
          source={{ uri: currentEpisode.imageUrl }}
          style={styles.artwork}
          contentFit="cover"
          cachePolicy="disk"
        />
      </View>

      {/* Episode Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {currentEpisode.title}
        </Text>
        {/* {currentEpisode.season && currentEpisode.episodeNumber && (
          <Text style={styles.meta}>
            Season {currentEpisode.season} &middot; Episode{' '}
            {currentEpisode.episodeNumber}
          </Text>
        )} */}
      </View>

      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={progress}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.surfaceLight}
          thumbTintColor={COLORS.primary}
          onSlidingStart={() => {
            setIsSeeking(true);
            setSeekPosition(position);
          }}
          onValueChange={(value) => {
            setSeekPosition(value * duration);
          }}
          onSlidingComplete={async (value) => {
            await seekTo(value * duration);
            setIsSeeking(false);
          }}
        />
        <View style={styles.timeRow}>
          <Text style={styles.time}>
            {formatDuration(positionSeconds)}
          </Text>
          <Text style={styles.time}>
            -{formatDuration(durationSeconds - positionSeconds)}
          </Text>
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.controls}>
        {/* Skip to Previous */}
        <IconButton
          icon="skip-previous"
          iconColor={hasHistory ? COLORS.text : COLORS.textSecondary}
          size={28}
          onPress={skipToPrevious}
          style={styles.skipButton}
        />
        {/* Seek Backward */}
        <IconButton
          icon="rewind-15"
          iconColor={COLORS.text}
          size={28}
          onPress={seekBackward}
          style={styles.seekButton}
        />
        {/* Play/Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
        >
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            iconColor={COLORS.background}
            size={32}
          />
        </TouchableOpacity>
        {/* Seek Forward */}
        <IconButton
          icon="fast-forward-15"
          iconColor={COLORS.text}
          size={28}
          onPress={seekForward}
          style={styles.seekButton}
        />
        {/* Skip to Next */}
        <IconButton
          icon="skip-next"
          iconColor={hasQueue ? COLORS.text : COLORS.textSecondary}
          size={28}
          onPress={skipToNext}
          disabled={!hasQueue}
          style={styles.skipButton}
        />
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        {/* Playback Speed */}
        <Menu
          visible={speedMenuVisible}
          onDismiss={() => setSpeedMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setSpeedMenuVisible(true)}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          }
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <Menu.Item
              key={speed}
              onPress={() => {
                changePlaybackSpeed(speed);
                setSpeedMenuVisible(false);
              }}
              title={`${speed}x`}
              leadingIcon={playbackSpeed === speed ? 'check' : undefined}
            />
          ))}
        </Menu>

        {/* Sleep Timer */}
        <Menu
          visible={sleepMenuVisible}
          onDismiss={() => setSleepMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setSleepMenuVisible(true)}
            >
              <IconButton
                icon="moon-waning-crescent"
                iconColor={
                  sleepTimerEndTime ? COLORS.primary : COLORS.textSecondary
                }
                size={24}
              />
              {sleepTimeRemaining !== null && (
                <Text style={styles.sleepTime}>{sleepTimeRemaining}m</Text>
              )}
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => {
              clearSleepTimer();
              setSleepMenuVisible(false);
            }}
            title="Off"
            leadingIcon={!sleepTimerEndTime ? 'check' : undefined}
          />
          <Divider />
          {SLEEP_TIMER_OPTIONS.map((minutes) => (
            <Menu.Item
              key={minutes}
              onPress={() => {
                setSleepTimer(minutes);
                setSleepMenuVisible(false);
              }}
              title={`${minutes} minutes`}
            />
          ))}
        </Menu>

        {/* Queue */}
        <TouchableOpacity style={styles.controlButton}>
          <IconButton
            icon="playlist-play"
            iconColor={COLORS.textSecondary}
            size={24}
          />
          {queue.length > 0 && (
            <Text style={styles.queueCount}>{queue.length}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  artwork: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    gap: 8,
  },
  skipButton: {
    margin: 0,
  },
  seekButton: {
    margin: 4,
  },
  playButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  secondaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 16,
  },
  controlButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  sleepTime: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: -8,
  },
  queueCount: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: -8,
  },
});

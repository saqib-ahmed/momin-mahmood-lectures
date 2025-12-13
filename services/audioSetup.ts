/**
 * Audio Setup - Initializes react-native-audio-pro outside React lifecycle
 * This ensures audio continues working when the app is backgrounded
 */
import {
  AudioPro,
  AudioProEventType,
  AudioProContentType,
  AudioProEvent,
  AudioProState,
} from 'react-native-audio-pro';
import { usePlayerStore } from '../stores/playerStore';

let isSetupComplete = false;

/**
 * Initialize the audio system - call this from app entry point
 */
export function setupAudio(): void {
  if (isSetupComplete) {
    console.log('[AudioSetup] Already initialized');
    return;
  }

  console.log('[AudioSetup] Initializing audio system...');

  // Configure the audio player
  AudioPro.configure({
    contentType: AudioProContentType.SPEECH, // Optimized for podcasts/lectures
    debug: __DEV__,
    debugIncludesProgress: false, // Don't spam console with progress logs
    progressIntervalMs: 500, // Update progress every 500ms
    showNextPrevControls: true, // Show next/prev on lock screen
    showSkipControls: true, // Show skip forward/back on lock screen
    skipIntervalMs: 15000, // 15-second skip interval
  });

  // Set up event listeners - these persist even when app is backgrounded
  AudioPro.addEventListener(handleAudioEvent);

  isSetupComplete = true;
  console.log('[AudioSetup] Audio system initialized');
}

/**
 * Handle all audio events from react-native-audio-pro
 */
function handleAudioEvent(event: AudioProEvent): void {
  const store = usePlayerStore.getState();
  const payload = event.payload;

  switch (event.type) {
    case AudioProEventType.STATE_CHANGED:
      if (payload?.state !== undefined) {
        handleStateChange(payload.state);
      }
      break;

    case AudioProEventType.PROGRESS:
      if (payload?.position !== undefined && payload?.duration !== undefined) {
        handleProgress(payload.position, payload.duration);
      }
      break;

    case AudioProEventType.TRACK_ENDED:
      handleTrackEnded();
      break;

    case AudioProEventType.SEEK_COMPLETE:
      // Seek completed - position will be updated via PROGRESS event
      break;

    case AudioProEventType.PLAYBACK_SPEED_CHANGED:
      if (payload?.speed !== undefined) {
        store.setPlaybackSpeed(payload.speed);
      }
      break;

    case AudioProEventType.REMOTE_NEXT:
      handleRemoteNext();
      break;

    case AudioProEventType.REMOTE_PREV:
      handleRemotePrev();
      break;

    case AudioProEventType.PLAYBACK_ERROR:
      console.error('[AudioSetup] Playback error:', payload?.error);
      store.setIsLoading(false);
      store.setIsPlaying(false);
      break;
  }
}

/**
 * Handle state changes from the audio player
 */
function handleStateChange(state: AudioProState): void {
  const store = usePlayerStore.getState();

  switch (state) {
    case AudioProState.IDLE:
      store.setIsPlaying(false);
      store.setIsLoading(false);
      store.setIsBuffering(false);
      break;

    case AudioProState.LOADING:
      store.setIsLoading(true);
      store.setIsBuffering(true);
      store.setIsPlaying(false);
      break;

    case AudioProState.PLAYING:
      store.setIsPlaying(true);
      store.setIsLoading(false);
      store.setIsBuffering(false);
      break;

    case AudioProState.PAUSED:
      store.setIsPlaying(false);
      store.setIsLoading(false);
      store.setIsBuffering(false);
      break;

    case AudioProState.STOPPED:
      store.setIsPlaying(false);
      store.setIsLoading(false);
      store.setIsBuffering(false);
      break;

    case AudioProState.ERROR:
      store.setIsPlaying(false);
      store.setIsLoading(false);
      store.setIsBuffering(false);
      break;
  }
}

/**
 * Handle progress updates
 */
function handleProgress(position: number, duration: number): void {
  const store = usePlayerStore.getState();
  store.setPosition(position);
  if (duration > 0) {
    store.setDuration(duration);
  }
}

/**
 * Handle track ended - play next in queue if available
 */
function handleTrackEnded(): void {
  const store = usePlayerStore.getState();
  const { currentEpisode, position } = store;

  // Save final position
  if (currentEpisode && position > 0) {
    store.savePosition(currentEpisode.id, position);
  }

  // Check settings for auto-play next
  // For now, always try to play next if queue has items
  const nextEpisode = store.playNext();
  if (nextEpisode) {
    // Play next episode from queue
    playEpisodeFromStore(nextEpisode.id);
  }
}

/**
 * Handle remote next button (lock screen / headphones)
 */
function handleRemoteNext(): void {
  const store = usePlayerStore.getState();
  const { currentEpisode, position } = store;

  // Save current position before switching
  if (currentEpisode && position > 0) {
    store.savePosition(currentEpisode.id, position);
  }

  // Play next from queue
  const nextEpisode = store.playNext();
  if (nextEpisode) {
    playEpisodeFromStore(nextEpisode.id);
  }
}

/**
 * Handle remote previous button (lock screen / headphones)
 * If more than 3 seconds in, restart track. Otherwise go to previous.
 */
function handleRemotePrev(): void {
  const store = usePlayerStore.getState();
  const { position, currentEpisode } = store;

  // If more than 3 seconds in, just restart the current track
  if (position > 3000) {
    AudioPro.seekTo(0);
    return;
  }

  // Otherwise, we'd go to previous track
  // For now, just restart since we don't have a "previous" queue
  AudioPro.seekTo(0);
}

/**
 * Helper to play episode by ID (used by event handlers)
 * This is a simplified version - the full playEpisode is in useAudioPlayer
 */
async function playEpisodeFromStore(episodeId: string): Promise<void> {
  // This function is called from event handlers when we need to play next track
  // The actual episode data and playback logic is handled by the store/hook
  // We'll emit a custom event or use the store's mechanism
  console.log('[AudioSetup] Playing next episode:', episodeId);
}

export { AudioPro, AudioProState, AudioProEventType };

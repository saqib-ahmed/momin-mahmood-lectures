/**
 * Audio Setup - Initializes react-native-audio-pro outside React lifecycle
 * This ensures audio continues working when the app is backgrounded
 *
 * Note: This file handles STATE_CHANGED, PROGRESS, and other basic events.
 * TRACK_ENDED, REMOTE_NEXT, REMOTE_PREV are handled in useAudioPlayer.ts
 * using a singleton pattern to prevent duplicate handling.
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
  // Note: Per library docs, only one set of controls can be active at a time.
  // If both showNextPrevControls and showSkipControls are true, only Next/Prev is shown.
  // We use Next/Prev for episode navigation (handled by our event handlers above).
  // In-app 15s skip buttons are handled separately in player.tsx via seekForward/seekBackward.
  AudioPro.configure({
    contentType: AudioProContentType.SPEECH, // Optimized for podcasts/lectures
    debug: __DEV__,
    debugIncludesProgress: false, // Don't spam console with progress logs
    progressIntervalMs: 500, // Update progress every 500ms
    showNextPrevControls: true, // Show next/prev on lock screen for episode navigation
    showSkipControls: false, // Disabled - in-app skip buttons handle 15s seek
  });

  // Set up event listeners - these persist even when app is backgrounded
  AudioPro.addEventListener(handleAudioEvent);

  isSetupComplete = true;
  console.log('[AudioSetup] Audio system initialized');
}

/**
 * Handle audio events from react-native-audio-pro
 * Note: TRACK_ENDED, REMOTE_NEXT, REMOTE_PREV are handled in useAudioPlayer.ts
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

    case AudioProEventType.SEEK_COMPLETE:
      // Seek completed - position will be updated via PROGRESS event
      break;

    case AudioProEventType.PLAYBACK_SPEED_CHANGED:
      if (payload?.speed !== undefined) {
        store.setPlaybackSpeed(payload.speed);
      }
      break;

    case AudioProEventType.PLAYBACK_ERROR:
      console.error('[AudioSetup] Playback error:', payload?.error);
      store.setIsLoading(false);
      store.setIsPlaying(false);
      break;

    // TRACK_ENDED, REMOTE_NEXT, REMOTE_PREV handled in useAudioPlayer.ts
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

export { AudioPro, AudioProState, AudioProEventType };

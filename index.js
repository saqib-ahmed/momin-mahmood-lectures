/**
 * App Entry Point
 * Initialize audio system before React starts
 */
import { setupAudio } from './services/audioSetup';

// Initialize audio system BEFORE React loads
// This ensures event listeners persist when app is backgrounded
setupAudio();

// Now load the Expo Router entry point
import 'expo-router/entry';

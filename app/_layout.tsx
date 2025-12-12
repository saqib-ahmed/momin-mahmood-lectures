import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, View, StatusBar as RNStatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { COLORS } from "../constants";
import { useFeedStore } from "../stores/feedStore";
import MiniPlayer from "../components/MiniPlayer";

// Islamic-inspired dark theme
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.gold,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceLight,
    onSurface: COLORS.text,
    onSurfaceVariant: COLORS.textSecondary,
    error: COLORS.error,
    outline: COLORS.border,
  },
};

export default function RootLayout() {
  const { refreshFeeds, isLoading, shows } = useFeedStore();

  // Load feeds on app start
  useEffect(() => {
    if (shows.length === 0 && !isLoading) {
      refreshFeeds();
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider
        style={{
          flex: 1,
          paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
        }}
      >
        <PaperProvider theme={theme}>
          <View style={styles.container}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: COLORS.surface,
                },
                headerTintColor: COLORS.gold,
                headerTitleStyle: {
                  fontWeight: "600",
                  color: COLORS.text,
                },
                contentStyle: {
                  backgroundColor: COLORS.background,
                },
              }}
            >
              <Stack.Screen
                name='index'
                options={{
                  title: "Momin Lectures",
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name='show/[id]'
                options={{
                  title: "Lectures",
                }}
              />
              <Stack.Screen
                name='episode/[id]'
                options={{
                  title: "Lecture",
                }}
              />
              <Stack.Screen
                name='player'
                options={{
                  title: "Now Playing",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name='downloads'
                options={{
                  title: "Downloads",
                }}
              />
              <Stack.Screen
                name='playlists/index'
                options={{
                  title: "Playlists",
                }}
              />
              <Stack.Screen
                name='playlists/[id]'
                options={{
                  title: "Playlist",
                }}
              />
              <Stack.Screen
                name='settings'
                options={{
                  title: "Settings",
                }}
              />
            </Stack>
            <MiniPlayer />
          </View>
          <StatusBar style='light' />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

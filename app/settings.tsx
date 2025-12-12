import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Switch, List, Divider, Button, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../stores/settingsStore';
import { useDownloads } from '../hooks/useDownloads';
import { usePlayerStore } from '../stores/playerStore';
import { COLORS, PLAYBACK_SPEEDS } from '../constants';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    downloadOverWifiOnly,
    skipForwardSeconds,
    skipBackwardSeconds,
    defaultPlaybackSpeed,
    autoPlayNext,
    setDownloadOverWifiOnly,
    setSkipForwardSeconds,
    setSkipBackwardSeconds,
    setDefaultPlaybackSpeed,
    setAutoPlayNext,
    resetSettings,
  } = useSettingsStore();

  const { totalDownloadSize, deleteAllDownloads } = useDownloads();
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const [skipForwardMenuVisible, setSkipForwardMenuVisible] = React.useState(false);
  const [skipBackwardMenuVisible, setSkipBackwardMenuVisible] = React.useState(false);
  const [speedMenuVisible, setSpeedMenuVisible] = React.useState(false);

  const bottomPadding = playerHasEpisode ? 80 : 0;
  const totalSizeMB = (totalDownloadSize / (1024 * 1024)).toFixed(1);

  const skipOptions = [5, 10, 15, 30, 45, 60];

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'This will delete all downloaded episodes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: deleteAllDownloads,
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: resetSettings },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding + insets.bottom + 20 }}
    >
      {/* Playback Section */}
      <Text style={styles.sectionTitle}>Playback</Text>
      <View style={styles.section}>
        <List.Item
          title="Auto-play next episode"
          description="Play next episode when current one finishes"
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
          right={() => (
            <Switch
              value={autoPlayNext}
              onValueChange={setAutoPlayNext}
              color={COLORS.primary}
            />
          )}
        />
        <Divider style={styles.divider} />

        <Menu
          visible={speedMenuVisible}
          onDismiss={() => setSpeedMenuVisible(false)}
          anchor={
            <List.Item
              title="Default playback speed"
              description={`${defaultPlaybackSpeed}x`}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              onPress={() => setSpeedMenuVisible(true)}
              right={() => (
                <List.Icon icon="chevron-right" color={COLORS.textSecondary} />
              )}
            />
          }
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <Menu.Item
              key={speed}
              onPress={() => {
                setDefaultPlaybackSpeed(speed);
                setSpeedMenuVisible(false);
              }}
              title={`${speed}x`}
              leadingIcon={defaultPlaybackSpeed === speed ? 'check' : undefined}
            />
          ))}
        </Menu>
        <Divider style={styles.divider} />

        <Menu
          visible={skipForwardMenuVisible}
          onDismiss={() => setSkipForwardMenuVisible(false)}
          anchor={
            <List.Item
              title="Skip forward"
              description={`${skipForwardSeconds} seconds`}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              onPress={() => setSkipForwardMenuVisible(true)}
              right={() => (
                <List.Icon icon="chevron-right" color={COLORS.textSecondary} />
              )}
            />
          }
        >
          {skipOptions.map((seconds) => (
            <Menu.Item
              key={seconds}
              onPress={() => {
                setSkipForwardSeconds(seconds);
                setSkipForwardMenuVisible(false);
              }}
              title={`${seconds} seconds`}
              leadingIcon={skipForwardSeconds === seconds ? 'check' : undefined}
            />
          ))}
        </Menu>
        <Divider style={styles.divider} />

        <Menu
          visible={skipBackwardMenuVisible}
          onDismiss={() => setSkipBackwardMenuVisible(false)}
          anchor={
            <List.Item
              title="Skip backward"
              description={`${skipBackwardSeconds} seconds`}
              titleStyle={styles.itemTitle}
              descriptionStyle={styles.itemDescription}
              onPress={() => setSkipBackwardMenuVisible(true)}
              right={() => (
                <List.Icon icon="chevron-right" color={COLORS.textSecondary} />
              )}
            />
          }
        >
          {skipOptions.map((seconds) => (
            <Menu.Item
              key={seconds}
              onPress={() => {
                setSkipBackwardSeconds(seconds);
                setSkipBackwardMenuVisible(false);
              }}
              title={`${seconds} seconds`}
              leadingIcon={
                skipBackwardSeconds === seconds ? 'check' : undefined
              }
            />
          ))}
        </Menu>
      </View>

      {/* Downloads Section */}
      <Text style={styles.sectionTitle}>Downloads</Text>
      <View style={styles.section}>
        <List.Item
          title="Download over Wi-Fi only"
          description="Prevent downloads on cellular data"
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
          right={() => (
            <Switch
              value={downloadOverWifiOnly}
              onValueChange={setDownloadOverWifiOnly}
              color={COLORS.primary}
            />
          )}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="Storage used"
          description={`${totalSizeMB} MB`}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
      </View>

      {/* Actions Section */}
      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.section}>
        <Button
          mode="outlined"
          onPress={handleClearDownloads}
          style={styles.actionButton}
          textColor={COLORS.error}
        >
          Clear All Downloads
        </Button>
        <Button
          mode="outlined"
          onPress={handleResetSettings}
          style={styles.actionButton}
          textColor={COLORS.textSecondary}
        >
          Reset Settings to Default
        </Button>
      </View>

      {/* About Section */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.section}>
        <List.Item
          title="Version"
          description="1.0.0"
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemTitle: {
    color: COLORS.text,
  },
  itemDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  divider: {
    backgroundColor: COLORS.surfaceLight,
  },
  actionButton: {
    margin: 12,
    borderColor: COLORS.surfaceLight,
  },
});

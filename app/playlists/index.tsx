import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  IconButton,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Button,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaylistStore } from '../../stores/playlistStore';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS } from '../../constants';
import { Playlist } from '../../types';

function PlaylistCard({
  playlist,
  onPress,
  onDelete,
}: {
  playlist: Playlist;
  onPress: () => void;
  onDelete: () => void;
}) {
  const episodeCount = playlist.episodeIds.length;

  return (
    <TouchableOpacity style={styles.playlistCard} onPress={onPress}>
      <View style={styles.playlistIcon}>
        <IconButton
          icon="playlist-music"
          iconColor={COLORS.primary}
          size={32}
        />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistMeta}>
          {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <IconButton
        icon="delete"
        iconColor={COLORS.textSecondary}
        size={24}
        onPress={onDelete}
      />
    </TouchableOpacity>
  );
}

export default function PlaylistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const playerHasEpisode = usePlayerStore((s) => s.currentEpisode);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const bottomPadding = playerHasEpisode ? 80 : 0;

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setDialogVisible(false);
    }
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlaylist(playlist.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaylistCard
            playlist={item}
            onPress={() => router.push(`/playlists/${item.id}`)}
            onDelete={() => handleDeletePlaylist(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding + insets.bottom + 80 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton
              icon="playlist-plus"
              iconColor={COLORS.textSecondary}
              size={64}
            />
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptySubtext}>
              Create a playlist to organize your episodes
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: bottomPadding + insets.bottom + 16 }]}
        color={COLORS.text}
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>New Playlist</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Playlist Name"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreatePlaylist}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  playlistCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  playlistIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: COLORS.primary,
  },
  dialog: {
    backgroundColor: COLORS.surface,
  },
});

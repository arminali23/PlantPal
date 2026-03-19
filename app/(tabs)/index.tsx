import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plant } from '../../types/plant';
import { getAllPlants, deletePlant } from '../../services/storage';
import { cancelNotification } from '../../services/notifications';
import { PlantCard } from '../../components/PlantCard';

export default function HomeScreen() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [])
  );

  async function loadPlants() {
    const all = await getAllPlants();
    setPlants(all.reverse());
  }

  function handleLongPress(plant: Plant) {
    Alert.alert(
      'Delete Plant',
      `Remove ${plant.commonName} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (plant.notificationId) {
              await cancelNotification(plant.notificationId);
            }
            await deletePlant(plant.id);
            loadPlants();
          },
        },
      ]
    );
  }

  if (plants.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🪴</Text>
        <Text style={styles.emptyTitle}>No plants yet</Text>
        <Text style={styles.emptySub}>
          Tap the Identify tab to photograph your first plant and start your collection.
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/(tabs)/camera')}
        >
          <Text style={styles.emptyBtnText}>📷 Add First Plant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() => router.push(`/plant/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  empty: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

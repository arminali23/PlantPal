import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Plant } from '../types/plant';
import { WateringBadge } from './WateringBadge';

interface Props {
  plant: Plant;
  onPress: () => void;
  onLongPress: () => void;
}

const CARE_COLORS: Record<Plant['careLevel'], { bg: string; text: string }> = {
  easy: { bg: '#DCFCE7', text: '#16A34A' },
  moderate: { bg: '#FEF3C7', text: '#D97706' },
  expert: { bg: '#FEE2E2', text: '#DC2626' },
};

export function PlantCard({ plant, onPress, onLongPress }: Props) {
  const care = CARE_COLORS[plant.careLevel];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: plant.photoUri }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{plant.commonName}</Text>
        <Text style={styles.scientific} numberOfLines={1}>{plant.scientificName}</Text>
        <View style={styles.badges}>
          <View style={[styles.careTag, { backgroundColor: care.bg }]}>
            <Text style={[styles.careText, { color: care.text }]}>
              {plant.careLevel.charAt(0).toUpperCase() + plant.careLevel.slice(1)}
            </Text>
          </View>
          <WateringBadge
            nextWaterAt={plant.watering.nextWaterAt}
            frequencyDays={plant.watering.frequencyDays}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  scientific: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  careTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  careText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

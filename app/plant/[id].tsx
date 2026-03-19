import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useNavigation } from 'expo-router';
import { Plant } from '../../types/plant';
import { getPlantById, updatePlant } from '../../services/storage';
import { scheduleWateringNotification, cancelNotification } from '../../services/notifications';
import { WateringBadge } from '../../components/WateringBadge';

const CARE_COLORS: Record<Plant['careLevel'], { bg: string; text: string }> = {
  easy: { bg: '#DCFCE7', text: '#16A34A' },
  moderate: { bg: '#FEF3C7', text: '#D97706' },
  expert: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [freqInput, setFreqInput] = useState('');
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      loadPlant();
    }, [id])
  );

  async function loadPlant() {
    const p = await getPlantById(id);
    setPlant(p);
    if (p) {
      navigation.setOptions({ title: p.commonName });
    }
  }

  async function markAsWatered() {
    if (!plant) return;
    const now = new Date();
    const nextWaterAt = new Date(
      now.getTime() + plant.watering.frequencyDays * 24 * 60 * 60 * 1000
    ).toISOString();

    if (plant.notificationId) {
      await cancelNotification(plant.notificationId);
    }

    const newNotificationId = await scheduleWateringNotification(
      plant.id,
      plant.commonName,
      plant.watering.frequencyDays,
      now
    );

    const updated: Plant = {
      ...plant,
      notificationId: newNotificationId,
      watering: {
        ...plant.watering,
        lastWateredAt: now.toISOString(),
        nextWaterAt,
      },
    };

    await updatePlant(updated);
    setPlant(updated);
    Alert.alert('✅ Watered!', `Next watering scheduled in ${plant.watering.frequencyDays} days.`);
  }

  async function saveFrequency() {
    if (!plant) return;
    const days = parseInt(freqInput, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      Alert.alert('Invalid', 'Please enter a number between 1 and 365.');
      return;
    }

    const nextWaterAt = plant.watering.lastWateredAt
      ? new Date(
          new Date(plant.watering.lastWateredAt).getTime() + days * 24 * 60 * 60 * 1000
        ).toISOString()
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    if (plant.notificationId) {
      await cancelNotification(plant.notificationId);
    }

    const newNotificationId = await scheduleWateringNotification(
      plant.id,
      plant.commonName,
      days,
      new Date()
    );

    const updated: Plant = {
      ...plant,
      notificationId: newNotificationId,
      watering: { ...plant.watering, frequencyDays: days, nextWaterAt },
    };

    await updatePlant(updated);
    setPlant(updated);
    setEditingFrequency(false);
  }

  if (!plant) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const care = CARE_COLORS[plant.careLevel];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: plant.photoUri }} style={styles.photo} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.commonName}>{plant.commonName}</Text>
              <Text style={styles.scientificName}>{plant.scientificName}</Text>
            </View>
            <View style={[styles.careTag, { backgroundColor: care.bg }]}>
              <Text style={[styles.careText, { color: care.text }]}>
                {plant.careLevel.charAt(0).toUpperCase() + plant.careLevel.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{plant.description}</Text>

          {/* Watering */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💧 Watering</Text>
            <View style={styles.wateringRow}>
              <WateringBadge
                nextWaterAt={plant.watering.nextWaterAt}
                frequencyDays={plant.watering.frequencyDays}
              />
              <TouchableOpacity
                onPress={() => {
                  setFreqInput(String(plant.watering.frequencyDays));
                  setEditingFrequency(true);
                }}
              >
                <Text style={styles.editLink}>Edit frequency</Text>
              </TouchableOpacity>
            </View>
            <InfoRow label="Every" value={`${plant.watering.frequencyDays} days`} />
            <InfoRow label="Amount" value={plant.watering.amount} />
            <InfoRow label="Tips" value={plant.watering.tips} />
            {plant.watering.lastWateredAt && (
              <InfoRow
                label="Last watered"
                value={new Date(plant.watering.lastWateredAt).toLocaleDateString()}
              />
            )}
          </View>

          {/* Placement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>☀️ Placement</Text>
            <InfoRow label="Light" value={plant.placement.light} />
            <Text style={styles.listLabel}>Good spots:</Text>
            {plant.placement.indoorSpots.map((s, i) => (
              <Text key={i} style={styles.listItem}>• {s}</Text>
            ))}
            <Text style={[styles.listLabel, { marginTop: 8 }]}>Avoid:</Text>
            {plant.placement.avoidSpots.map((s, i) => (
              <Text key={i} style={[styles.listItem, { color: '#DC2626' }]}>• {s}</Text>
            ))}
          </View>

          {/* Storage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌡️ Environment</Text>
            <InfoRow label="Temperature" value={plant.storage.temperature} />
            <InfoRow label="Humidity" value={plant.storage.humidity} />
            <InfoRow label="Notes" value={plant.storage.notes} />
          </View>

          <Text style={styles.addedDate}>
            Added {new Date(plant.identifiedAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      {/* Watered button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.wateredBtn} onPress={markAsWatered}>
          <Text style={styles.wateredBtnText}>💧 Mark as Watered</Text>
        </TouchableOpacity>
      </View>

      {/* Edit frequency modal */}
      <Modal visible={editingFrequency} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Watering Frequency</Text>
            <Text style={styles.modalSub}>How many days between waterings?</Text>
            <TextInput
              style={styles.input}
              value={freqInput}
              onChangeText={setFreqInput}
              keyboardType="number-pad"
              placeholder="e.g. 7"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingFrequency(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={saveFrequency}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', fontSize: 16 },
  photo: { width: '100%', height: 280 },
  content: { padding: 20, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: { flex: 1, marginRight: 12 },
  commonName: { fontSize: 24, fontWeight: '800', color: '#111827' },
  scientificName: { fontSize: 14, color: '#6B7280', fontStyle: 'italic', marginTop: 2 },
  careTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  careText: { fontWeight: '700', fontSize: 13 },
  description: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 20 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  wateringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editLink: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: { width: 110, fontSize: 13, color: '#6B7280', fontWeight: '500' },
  infoValue: { flex: 1, fontSize: 13, color: '#111827' },
  listLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 6, marginBottom: 4 },
  listItem: { fontSize: 13, color: '#374151', marginBottom: 2, paddingLeft: 4 },
  addedDate: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  wateredBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  wateredBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

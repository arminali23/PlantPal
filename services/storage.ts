import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Plant } from '../types/plant';

const PLANTS_KEY = '@plantpal_plants';
const isWeb = Platform.OS === 'web';
const PHOTOS_DIR = isWeb ? '' : `${FileSystem.documentDirectory}plantpal_photos/`;

async function ensurePhotoDir() {
  if (isWeb) return;
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function savePhotoToDocuments(tempUri: string, id: string): Promise<string> {
  if (isWeb) {
    // On web, the blob URI is already accessible — just return it
    return tempUri;
  }
  await ensurePhotoDir();
  const dest = `${PHOTOS_DIR}${id}.jpg`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

export async function getAllPlants(): Promise<Plant[]> {
  const json = await AsyncStorage.getItem(PLANTS_KEY);
  if (!json) return [];
  return JSON.parse(json) as Plant[];
}

export async function savePlant(plant: Plant): Promise<void> {
  const plants = await getAllPlants();
  plants.push(plant);
  await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
}

export async function getPlantById(id: string): Promise<Plant | null> {
  const plants = await getAllPlants();
  return plants.find((p) => p.id === id) ?? null;
}

export async function updatePlant(updated: Plant): Promise<void> {
  const plants = await getAllPlants();
  const idx = plants.findIndex((p) => p.id === updated.id);
  if (idx !== -1) {
    plants[idx] = updated;
    await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
  }
}

export async function deletePlant(id: string): Promise<void> {
  const plants = await getAllPlants();
  const filtered = plants.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(filtered));

  if (!isWeb) {
    const photoPath = `${PHOTOS_DIR}${id}.jpg`;
    const info = await FileSystem.getInfoAsync(photoPath);
    if (info.exists) {
      await FileSystem.deleteAsync(photoPath, { idempotent: true });
    }
  }
}

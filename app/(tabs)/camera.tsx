import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { identifyPlant } from '../../services/claude';
import { savePlant, savePhotoToDocuments } from '../../services/storage';
import { scheduleWateringNotification } from '../../services/notifications';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { Plant } from '../../types/plant';

const isWeb = Platform.OS === 'web';

async function uriToBase64(uri: string): Promise<string> {
  if (isWeb) {
    // On web, fetch the blob and convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data URL prefix (data:image/jpeg;base64,)
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Native: compress then read as base64
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export default function CameraScreen() {
  const [loading, setLoading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const router = useRouter();

  async function handleImageSelected(uri: string) {
    setPreviewUri(uri);
    setLoading(true);
    try {
      const base64 = await uriToBase64(uri);
      const result = await identifyPlant(base64);

      const id = uuidv4();
      const now = new Date().toISOString();
      const nextWaterAt = new Date(
        Date.now() + result.watering.frequencyDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const permanentUri = await savePhotoToDocuments(uri, id);

      const notificationId = await scheduleWateringNotification(
        id,
        result.commonName,
        result.watering.frequencyDays,
        new Date()
      );

      const plant: Plant = {
        ...result,
        id,
        photoUri: permanentUri,
        identifiedAt: now,
        notificationId,
        watering: {
          ...result.watering,
          lastWateredAt: null,
          nextWaterAt,
        },
      };

      await savePlant(plant);
      setPreviewUri(null);
      router.push(`/plant/${id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Identification Failed', message, [{ text: 'Try Again' }]);
    } finally {
      setLoading(false);
    }
  }

  async function takePhoto() {
    if (isWeb) {
      Alert.alert('Not Available', 'Camera capture is not available in the browser. Please use "Choose from Gallery" to upload a photo.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to photograph plants.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      await handleImageSelected(result.assets[0].uri);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      bounces={false}
    >
      <LoadingOverlay visible={loading} />

      <View style={styles.hero}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>📷</Text>
            <Text style={styles.placeholderText}>Take or upload a photo of a plant</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>Identify a Plant</Text>
      <Text style={styles.subtitle}>
        Point your camera at any plant and Claude AI will identify it and provide full care instructions.
      </Text>

      {!isWeb && (
        <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto} disabled={loading}>
          <Text style={styles.primaryBtnText}>📷 Take Photo</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={isWeb ? styles.primaryBtn : styles.secondaryBtn} onPress={pickFromGallery} disabled={loading}>
        <Text style={isWeb ? styles.primaryBtnText : styles.secondaryBtnText}>
          🖼️ {isWeb ? 'Upload Plant Photo' : 'Choose from Gallery'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        💡 Tip: Make sure the plant fills most of the frame for best results.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#E5E7EB',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginBottom: 24,
  },
  secondaryBtnText: {
    color: '#374151',
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

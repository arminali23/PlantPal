import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isWeb) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watering', {
      name: 'Watering Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWateringNotification(
  plantId: string,
  commonName: string,
  frequencyDays: number,
  startDate: Date
): Promise<string | null> {
  if (isWeb) return null;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: frequencyDays * 24 * 60 * 60,
    repeats: true,
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to water! 🌿',
      body: `Your ${commonName} needs watering today.`,
      data: { plantId },
    },
    trigger,
  });

  return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (isWeb) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

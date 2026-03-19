import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  nextWaterAt: string | null;
  frequencyDays: number;
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function WateringBadge({ nextWaterAt, frequencyDays }: Props) {
  const days = getDaysUntil(nextWaterAt);

  let label: string;
  let color: string;
  let bg: string;

  if (days === null) {
    label = `Every ${frequencyDays}d`;
    color = '#6B7280';
    bg = '#F3F4F6';
  } else if (days <= 0) {
    label = 'Water today!';
    color = '#DC2626';
    bg = '#FEE2E2';
  } else if (days === 1) {
    label = 'Water tomorrow';
    color = '#D97706';
    bg = '#FEF3C7';
  } else {
    label = `Water in ${days}d`;
    color = '#16A34A';
    bg = '#DCFCE7';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>💧 {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

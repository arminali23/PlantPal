export interface Plant {
  id: string;
  photoUri: string;
  identifiedAt: string;
  commonName: string;
  scientificName: string;
  description: string;
  careLevel: 'easy' | 'moderate' | 'expert';
  placement: {
    light: string;
    indoorSpots: string[];
    avoidSpots: string[];
  };
  storage: {
    temperature: string;
    humidity: string;
    notes: string;
  };
  watering: {
    frequencyDays: number;
    amount: string;
    tips: string;
    lastWateredAt: string | null;
    nextWaterAt: string | null;
  };
  notificationId: string | null;
}

export type PlantIdentificationResult = Omit<Plant, 'id' | 'photoUri' | 'identifiedAt' | 'notificationId'> & {
  watering: Omit<Plant['watering'], 'lastWateredAt' | 'nextWaterAt'>;
};

export interface IdentificationError {
  error: string;
}

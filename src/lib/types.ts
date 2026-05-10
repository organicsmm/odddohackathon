export type Activity = {
  id: string;
  name: string;
  category: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'nightlife' | 'shopping' | 'nature';
  cost: number;        // USD
  durationHours: number;
  description?: string;
  time?: string;       // e.g. "09:00"
};

export type Stop = {
  id: string;
  city: string;
  country: string;
  startDate: string;   // ISO yyyy-mm-dd
  endDate: string;
  notes?: string;
  activities: Activity[];
  costs: {
    transport: number;
    stay: number;        // per night
    meals: number;       // per day
  };
};

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type PackItem = {
  id: string;
  label: string;
  category: 'clothing' | 'documents' | 'electronics' | 'toiletries' | 'misc';
  packed: boolean;
};

export type Trip = {
  id: string;
  ownerEmail: string;
  name: string;
  description?: string;
  cover?: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
  shareId: string;
  stops: Stop[];
  packing: PackItem[];
  notes: Note[];
  budget?: number;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  email: string;
  name: string;
  language: 'en' | 'hi' | 'es';
  saved: string[]; // saved city names
};

// app/(tabs)/home/types/index.ts

import { StackNavigationProp } from '@react-navigation/stack';

export type Service = {
  id: number;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type Category = {
  name: string;
  icon: string;
};

export type City = {
  name: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type FilterOptions = {
  minRating: number;
  maxPrice: number;
  maxDistance: number;
  sortBy: 'rating' | 'price' | 'distance';
};

export type RootStackParamList = {
  Booking: { tasker: any };
  BookingSummary: {
    tasker: any;
    date: Date;
    address: string;
    notes: string;
  };
};

export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Booking'>;
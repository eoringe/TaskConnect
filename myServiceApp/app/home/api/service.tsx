// app/(tabs)/home/api/service.ts

import { getAuth } from 'firebase/auth';
import { db } from '@/firebase-config';
import { collection, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Service } from '../types';

interface FirestoreService {
  id: string;
  title: string;
  category: string;
  description: string;
  rate: string;
  submissionDate: string;
  location?: string;
  rating?: number;
  reviews?: number;
  coordinates?: { latitude: number; longitude: number };
}

export async function fetchServices(): Promise<Service[]> {
  const user = getAuth().currentUser;
  if (!user) return [];

  const snap = await getDocs(collection(db, 'users', user.uid, 'services'));
  return snap.docs.map((doc: QueryDocumentSnapshot) => {
    const data = doc.data() as FirestoreService;

    return {
      id: data.id,
      name: data.title,
      category: data.category,
      description: data.description,
      price: `Ksh ${data.rate}`,
      submissionDate: new Date(data.submissionDate),
      // **These four must be present** to satisfy your UI type:
      location: data.location ?? '0 km',       // fallback if missing
      rating:  data.rating   ?? parseFloat(data.rate),
      reviews: data.reviews  ?? 0,
      coordinates: data.coordinates ?? { latitude:0, longitude:0 },
    };
  });
}

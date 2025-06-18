// app/(tabs)/home/api/service.ts

import { getAuth } from 'firebase/auth';
import { db } from '@/firebase-config';
import { collection, getDocs, QueryDocumentSnapshot, doc, getDoc } from 'firebase/firestore';
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
  // reviews?: number;
  // coordinates?: { latitude: number; longitude: number };
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
      rating: data.rating ?? parseFloat(data.rate),
      reviews: data.reviews ?? 0,
      coordinates: data.coordinates ?? { latitude: 0, longitude: 0 },
    };
  });
}

export async function fetchServicesByCategory(category: string): Promise<Service[]> {
  // 1. grab the serviceCategory doc
  const catSnap = await getDoc(doc(db, 'serviceCategories', category));
  if (!catSnap.exists()) return [];

  // 2. pull out your embedded array
  const raw: { services?: RawService[] } = catSnap.data();
  const list = raw.services ?? [];

  // 3. for each service entry, fetch its tasker
  const enriched = await Promise.all(
    list.map(async (svc) => {
      const taskerSnap = await getDoc(doc(db, 'taskers', svc.taskerId));
      const tasker = taskerSnap.exists() ? taskerSnap.data() : {};

      return {
        id: svc.id,
        title: svc.title,
        name: svc.title,              // legacy UI prop
        category: svc.category,
        description: svc.description,
        price: `Ksh ${svc.rate}`,
        submissionDate: new Date(svc.submissionDate),
        location: svc.location || '0 km',     // fallback
        rating: svc.rating  ?? 4.0,            // fallback
        reviews: svc.reviews ?? 0,             // fallback
        coordinates: svc.coordinates ?? { latitude: 0, longitude: 0 },
        // **new** fields from the tasker doc:
        taskerName: `${(tasker as any).firstName || ''} ${(tasker as any).lastName || ''}`.trim(),
        taskerProfileImage: (tasker as any).profileImageBase64 || null,
      } as Service;
    })
  );

  return enriched;
}

export async function fetchAllServices(): Promise<Service[]> {
  const categoriesSnap = await getDocs(collection(db, 'serviceCategories'));
  let allServices: Service[] = [];
  for (const docSnap of categoriesSnap.docs) {
    const { services } = docSnap.data() as { services: any[] };
    if (services && Array.isArray(services)) {
      const merged = await Promise.all(services.map(async (service) => {
        const taskerId = service.taskerId || service.TaskerId || service.taskerID;
        const taskerDoc = await getDoc(doc(db, 'taskers', taskerId));
        const tasker = taskerDoc.exists() ? taskerDoc.data() : null;
        return {
          id: service.id,
          name: service.title,
          title: service.title,
          category: service.category,
          description: service.description,
          price: `Ksh ${service.rate}`,
          submissionDate: new Date(),
          location: service.location ?? '0 km',
          rating: service.rating ?? 4.0,
          reviews: service.reviews ?? 0,
          coordinates: service.coordinates ?? { latitude: 0, longitude: 0 },
          taskerName: tasker ? `${tasker.firstName} ${tasker.lastName}` : 'Unknown',
          taskerProfileImage: tasker?.profileImageBase64 ?? '',
        };
      }));
      allServices = allServices.concat(merged);
    }
  }
  return allServices;
}

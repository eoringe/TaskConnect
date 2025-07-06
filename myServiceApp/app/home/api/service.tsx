// app/(tabs)/home/api/service.ts

import { getAuth } from 'firebase/auth';
import { db } from '@/firebase-config';
import { collection, getDocs, QueryDocumentSnapshot, doc, getDoc } from 'firebase/firestore';
import type { Service } from '../types';

// Fetch services added by the current user
export async function fetchServices(): Promise<Service[]> {
  const user = getAuth().currentUser;
  if (!user) return [];

  const snap = await getDocs(collection(db, 'users', user.uid, 'services'));
  return snap.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data() as any;
    return {
      id: data.id,
      name: data.title,
      title: data.title,
      category: data.category,
      description: data.description,
      price: `Ksh ${data.rate}`,
      submissionDate: new Date(data.submissionDate),
      location: data.location ?? '0 km',
      rating: data.rating ?? parseFloat(data.rate),
      reviews: data.reviews ?? 0,
      coordinates: data.coordinates ?? { latitude: 0, longitude: 0 },
      taskerName: '', // no tasker info here
      taskerProfileImage: null,
      taskerIdString: '',
      rate: data.rate,
    } as unknown as Service;
  });
}

// Fetch services by a given category
export async function fetchServicesByCategory(category: string): Promise<Service[]> {
  const catSnap = await getDoc(doc(db, 'serviceCategories', category));
  if (!catSnap.exists()) return [];

  const raw = catSnap.data() as { services?: any[] };
  const list = raw.services ?? [];

  const enriched = await Promise.all(
    list.map(async (svc) => {
              const taskerId = svc.taskerId ?? '';
        const taskerSnap = await getDoc(doc(db, 'taskers', taskerId));
        const tasker = taskerSnap.exists() ? (taskerSnap.data() as any) : {};

        console.log('🔍 DEBUG SERVICE API: Tasker data for', taskerId, ':', tasker);
        console.log('🔍 DEBUG SERVICE API: Tasker bio:', tasker.bio);
        console.log('🔍 DEBUG SERVICE API: Tasker areas served:', tasker.areasServed);
        console.log('🔍 DEBUG SERVICE API: Tasker services:', tasker.services);
        console.log('🔍 DEBUG SERVICE API: Tasker profileImageBase64 exists:', !!tasker.profileImageBase64);
        console.log('🔍 DEBUG SERVICE API: Tasker profileImageBase64 length:', tasker.profileImageBase64?.length);

        return {
          id: svc.id,
          name: svc.title,
          title: svc.title,
          category: svc.category,
          description: svc.description,
          price: `Ksh ${svc.rate}`,
          submissionDate: new Date(svc.submissionDate),
          location: svc.location ?? '0 km',
          rating: svc.rating ?? 4.0,
          reviews: svc.reviews ?? 0,
          coordinates: svc.coordinates ?? { latitude: 0, longitude: 0 },
          taskerName: `${tasker.firstName ?? ''} ${tasker.lastName ?? ''}`.trim(),
          taskerProfileImage: tasker.profileImageBase64 ?? null,
          taskerIdString: taskerId,
          rate: svc.rate,
          // Add the missing fields
          bio: tasker.bio ?? null,
          areasServed: tasker.areasServed ?? [],
          services: tasker.services ?? [],
          taskerId: taskerId,
          // Add the actual tasker Firestore document ID
          taskerFirestoreId: taskerId,
        } as unknown as Service;
    })
  );

  return enriched;
}

// Fetch all services across categories
export async function fetchAllServices(): Promise<Service[]> {
  const categoriesSnap = await getDocs(collection(db, 'serviceCategories'));
  const allServices: Service[] = [];

  for (const categoryDoc of categoriesSnap.docs) {
    const { services } = categoryDoc.data() as { services?: any[] };
    if (!services) continue;

    const enriched = await Promise.all(
      services.map(async (svc) => {
        const taskerId = svc.taskerId ?? '';
        const taskerSnap = await getDoc(doc(db, 'taskers', taskerId));
        const tasker = taskerSnap.exists() ? (taskerSnap.data() as any) : {};

        console.log('🔍 DEBUG SERVICE API (ALL): Tasker data for', taskerId, ':', tasker);
        console.log('🔍 DEBUG SERVICE API (ALL): Tasker bio:', tasker.bio);
        console.log('🔍 DEBUG SERVICE API (ALL): Tasker areas served:', tasker.areasServed);
        console.log('🔍 DEBUG SERVICE API (ALL): Tasker services:', tasker.services);
        console.log('🔍 DEBUG SERVICE API (ALL): Tasker profileImageBase64 exists:', !!tasker.profileImageBase64);
        console.log('🔍 DEBUG SERVICE API (ALL): Tasker profileImageBase64 length:', tasker.profileImageBase64?.length);

        return {
          id: svc.id,
          name: svc.title,
          title: svc.title,
          category: svc.category,
          description: svc.description,
          price: `Ksh ${svc.rate}`,
          submissionDate: svc.submissionDate ? new Date(svc.submissionDate) : new Date(),
          location: svc.location ?? '0 km',
          rating: svc.rating ?? 4.0,
          reviews: svc.reviews ?? 0,
          coordinates: svc.coordinates ?? { latitude: 0, longitude: 0 },
          taskerName: `${tasker.firstName ?? ''} ${tasker.lastName ?? ''}`.trim(),
          taskerProfileImage: tasker.profileImageBase64 ?? null,
          taskerIdString: taskerId,
          rate: svc.rate,
          // Add the missing fields
          bio: tasker.bio ?? null,
          areasServed: tasker.areasServed ?? [],
          services: tasker.services ?? [],
          taskerId: taskerId,
          // Add the actual tasker Firestore document ID
          taskerFirestoreId: taskerId,
        } as unknown as Service;
      })
    );

    allServices.push(...enriched);
  }

  return allServices;
}

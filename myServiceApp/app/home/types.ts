// app/(tabs)/home/types.ts

// The raw shape as stored in Firestore:
export interface FirestoreService {
  id: string;
  title: string;
  category: string;
  description: string;
  rate: string;
  submissionDate: string;
  // etc… add extra fields you stored, like coordinates, reviews, …
}

// The UI‐friendly shape that ServiceCard expects:
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;              // e.g. "Ksh 3500"
  submissionDate: Date;
  location: string;           // e.g. "2 km away"
  rating: number;
  reviews: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  title: string; // Service title
  taskerName: string; // Tasker's full name
  taskerProfileImage: string; // base64 or URL
}

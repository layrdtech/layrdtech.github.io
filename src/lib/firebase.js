import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCJwq6rhuYdxx1q-1IsvVYyM1Tg_jZ7aoc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'layrd-tech-website-afsadk-2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'layrd-tech-website-afsadk-2026',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'layrd-tech-website-afsadk-2026.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '292458787200',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:292458787200:web:01121427ce423a9f095165',
}

let firebaseApp = null
let firestoreDb = null

if (firebaseConfig.projectId) {
  firebaseApp = initializeApp(firebaseConfig)
  firestoreDb = getFirestore(firebaseApp)
}

export const isFirebaseConfigured = () => Boolean(firestoreDb)

export const saveSubmissionToFirebase = async (type, payload) => {
  if (!firestoreDb) {
    return { ok: false, reason: 'not-configured' }
  }

  try {
    await addDoc(collection(firestoreDb, 'submissions'), {
      type,
      payload,
      createdAt: serverTimestamp(),
    })

    return { ok: true }
  } catch (error) {
    console.error('Firebase save failed:', error)
    return { ok: false, reason: error.message }
  }
}

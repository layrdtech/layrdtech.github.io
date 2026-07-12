import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

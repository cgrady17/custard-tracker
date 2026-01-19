import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFirestore, doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
});

const getOrInitApp = () => {
  if (getApps().length > 0) return getApp();
  const config = getFirebaseConfig();
  if (!config.projectId) return null;
  return initializeApp(config);
};

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const app = getOrInitApp();
    if (!app) return null;

    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.getRegistration();
    return await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
  }
  return null;
};

export const subscribeToFlavor = async (flavorName: string) => {
  const token = await requestNotificationPermission();
  if (!token) throw new Error('Permission denied or config missing');

  const app = getOrInitApp();
  if (!app) throw new Error('App init failed');
  const db = getFirestore(app);

  const subId = `${token.substring(0, 20)}_${flavorName.replace(/\s+/g, '_').toLowerCase()}`;
  await setDoc(doc(db, 'subscriptions', subId), {
    token,
    flavorName: flavorName.toLowerCase(),
    createdAt: new Date().toISOString()
  });
};

export const unsubscribeFromFlavor = async (flavorName: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  
  const app = getOrInitApp();
  if (!app) return;

  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
  if (!token) return;

  const db = getFirestore(app);
  const subId = `${token.substring(0, 20)}_${flavorName.replace(/\s+/g, '_').toLowerCase()}`;
  await deleteDoc(doc(db, 'subscriptions', subId));
};

export const getSubscribedFlavors = async () => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return [];
  }

  try {
    const app = getOrInitApp();
    if (!app) return [];

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
    if (!token) return [];

    const db = getFirestore(app);
    const q = query(collection(db, 'subscriptions'), where('token', '==', token));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().flavorName);
  } catch (e) {
    console.warn("Watchlist fetch failed (silent):", e);
    return [];
  }
};
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

export function getFirebaseServer() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return {
        app,
        auth: getAuth(app),
        firestore: getFirestore(app),
    };
}

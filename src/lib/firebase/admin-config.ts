// src/lib/firebase/admin-config.ts
import { initializeApp, getApps, App, cert, getApp } from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const appName = 'firebase-admin-app';

let app: App;
if (getApps().length === 0) {
  app = initializeApp(
    {
      credential: cert(serviceAccount!),
    },
    appName
  );
} else {
  app = getApp(appName);
}

export { app };

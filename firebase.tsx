// Import Firebase modules for authentication, Firestore, and storage
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

// Import AsyncStorage for storing data persistently in React Native applications
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Import Firebase functions for app initialization and accessing Firebase services
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Import Firebase compatibility version for better compatibility with React Native
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Firebase configuration details for the web app
const firebaseConfig = {
};

// Initialize Firebase variables
let app;
let auth;
let firestore;
let database;
let storage

// Initialize Firebase if it hasn't been initialized yet
if (getApps().length < 1) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    firestore = getFirestore(app);
    storage = getStorage(app, "gs://jargle-ca313.appspot.com");
} else {
    app = getApp();
    auth = getAuth();
    firestore = getFirestore();
    storage = getStorage();
}

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { app, auth, firestore, database, storage, firebase };

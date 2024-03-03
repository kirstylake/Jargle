import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import firebase from 'firebase/app';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC2Qi4TQUtYcwJrcHHk1xEHjMjVlhBj7uU",
    authDomain: "jargle-ca313.firebaseapp.com",
    projectId: "jargle-ca313",
    storageBucket: "jargle-ca313.appspot.com",
    messagingSenderId: "646348725676",
    appId: "1:646348725676:web:ada10ccd1ac4c2c17bee09",
    measurementId: "G-MBJ7LXCQZT"
};

// Initialize Firebase
let app;
let auth;
let firestore;
let database;
if (getApps().length < 1) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    firestore = getFirestore(app);
    // database = firebase.firestore();

} else {
    app = getApp();
    auth = getAuth();
    firestore = getFirestore();
    // database = firebase.firestore();
}

export { app, auth, firestore, database};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { firebase };
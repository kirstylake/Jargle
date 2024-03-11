// functions/test/offline.test.ts
import 'jest';

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { updateCurrentUser } from 'firebase/auth';

admin.initializeApp();

//https://fireship.io/lessons/testing-cloud-functions-in-firebase/
// Firestore Function

//https://firebase.google.com/docs/functions/unit-testing
// At the top of test/index.test.js
const testEnv = require('firebase-functions-test')({
    databaseURL: 'jargle-ca313.firebaseio.com',
    storageBucket: 'jargle-ca313.appspot.com',
    projectId: 'jargle-ca313',
}, 'jargle-ca313-firebase-adminsdk-g8tmt-3261f0da9b.json');


//Change Username Test
export const changeUsername = functions.firestore
    .document('Users/{userId}')
    .onCreate((snap, context) => {
        const data = snap.data();
        const username = 'testing123';
        return admin.firestore().doc(`Users/${snap.id}`).update({ username });
    });

//Change Score Test
export const changeScore = functions.firestore
    .document('Users/{userId}')
    .onCreate((snap, context) => {
        const data = snap.data();
        const score = 3;
        return admin.firestore().doc(`Users/${snap.id}`).update({ score });
    });

//Create User Record Test
export const createUserRecord = functions.auth
    .user()
    .onCreate((user, context) => {
        return admin
            .firestore()
            .doc(`users/${user.uid}`)
            .set({ email: 'testing12345@gmail.com' });
    });

export const addJargon = functions.https.onCall(async (data, context) => {
    // Extract data from request
    try {
        const { CategoryID, DateAdded, Definition, DifficultyLevel, Word } = data;
        const docRef = admin.firestore().collection('Jargon').doc(Word.toUpperCase());
        await docRef.set({
            CategoryID,
            DateAdded,
            Definition,
            DifficultyLevel,
            Word
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
})

// Add this Firestore function to your functions/index.ts or similar file
export const getCategoryById = functions.https.onCall(async (data, context) => {
    try {

        // Extract id from request data
        const categoryId = data.id;

        // Retrieve category document from Firestore
        const categorySnapshot = await admin.firestore().collection('Categories').doc(categoryId).get();
        const categoryData = categorySnapshot.data();

        if (!categoryData) {
            return { success: false };
        }

        return categoryData;
    } catch (error) {
        return { success: false, error };
    }
});


describe('Users Tests', () => {
    let wrapped;
    // Applies only to tests in this describe block
    beforeAll(() => {
        wrapped = testEnv.wrap(changeUsername);
    });

    test('changes a username', async () => {
        const path = 'Users/XnQenVCoHWYt4EKFfXnXNKQLz8x2';
        const data = { username: 'TestScript' };

        // Create a Firestore snapshot
        const snap = testEnv.firestore.makeDocumentSnapshot(data, path);

        // Execute the function
        await wrapped(snap);

        const after = await admin.firestore().doc(path).get();

        expect(after.data().username).toBe('testing123');
    });

    test('changes a score', async () => {
        wrapped = testEnv.wrap(changeScore);
        const path = 'Users/XnQenVCoHWYt4EKFfXnXNKQLz8x2';
        const data = { score: 3 };

        // Create a Firestore snapshot
        const snap = testEnv.firestore.makeDocumentSnapshot(data, path);

        // Execute the function
        await wrapped(snap);

        const after = await admin.firestore().doc(path).get();

        expect(after.data().score).toBe(3);
    });
});

describe('createUserRecord', () => {
    let wrapped;
    // Applies only to tests in this describe block
    beforeAll(() => {
        wrapped = testEnv.wrap(createUserRecord);
    });

    afterAll(() => {
        admin.firestore().doc(`users/dummyUser`).delete();
        testEnv.cleanup();
    });

    test('Create and Authenticate a NewUser', async () => {
        const user = testEnv.auth.makeUserRecord({ uid: 'dummyUser' })
        await wrapped(user);

        const doc = await admin.firestore().doc(`users/${user.uid}`).get();

        expect(doc.data().email).toBe('testing12345@gmail.com');
    });
});



// Add this test case to your functions/test/offline.test.ts file
describe('JargonTest', () => {
    let wrapped;

    beforeAll(() => {
        wrapped = testEnv.wrap(addJargon);
    });

    test('adds a jargon document to Firestore', async () => {
        const jargonData = {
            CategoryID: "2",
            DateAdded: new Date(),
            Definition: "A group of living organisms of the same species, occupying a particular geographic area.",
            DifficultyLevel: 2,
            Word: "Population"
        };

        const result = await wrapped(jargonData);

        expect(result.success).toBe(true);

        // Verify document is added to Firestore
        const addedDoc = await admin.firestore().collection('Jargon').where('Word', '==', 'Population').get();
        expect(addedDoc.docs.length).toBe(1);

        // Verify document data matches input
        const addedData = addedDoc.docs[0].data();
        expect(addedData.CategoryID).toBe(jargonData.CategoryID);
        expect(addedData.DateAdded.toDate()).toEqual(jargonData.DateAdded);
        expect(addedData.Definition).toBe(jargonData.Definition);
        expect(addedData.DifficultyLevel).toBe(jargonData.DifficultyLevel);
        expect(addedData.Word).toBe(jargonData.Word);

    });
});



describe('Categories Test', () => {
    let wrapped;

    beforeAll(() => {
        wrapped = testEnv.wrap(getCategoryById);
    });

    test('retrieves a category document from Firestore by id', async () => {
        const categoryId = "1";

        // Call the function to retrieve the category document
        const result = await wrapped({ id: categoryId });

        // Verify that the result is not null
        expect(result).toBeDefined();

        // Verify that the retrieved category document has the correct id
        expect(result.CategoryName).toBe("Technology");
    });
});
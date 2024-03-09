const admin = require('firebase-admin');
var serviceAccount = require("./jargle-ca313-firebase-adminsdk-g8tmt-3261f0da9b.json");

// Get a Firestore database reference
// const firebaseApp = mockFirebaseFirestore();
// const db = firebaseApp.firestore();

// // Mock Firestore admin
// jest.mock('@react-native-firebase/auth', () => ({
//     ...jest.requireActual('@react-native-firebase/auth'),
//     firebase: {
//         firestore: () => db,
//     },
// }));

jest.mock('firebase/auth');

describe('Login', () => {
    it('Logs user in', async () => {
        const mockedSignIn = jest.mocked(signInWithEmailAndPassword);
        // mockedSignIn.mockResolvedValue(mockDeep<UserCredential>)(user: 'a user'});

        // const user = await getService().login('email', 'password');

        // expect(mockedSignIn).toHaveBeenCalledWith(undefined, 'email', 'password');

    });
});


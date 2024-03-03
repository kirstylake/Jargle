import React from 'react';
import { View, TouchableOpacity, Image, Text, Alert } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, firebase } from '../../firebase';

// Configure Google Sign-In (replace YOUR_WEB_CLIENT_ID with your actual web client ID)
GoogleSignin.configure({
    webClientId: '646348725676-6qmhp72olb7pcg7uks7p2gs9vqcnhfjb.apps.googleusercontent.com',
});

const googleSignIn = async () => {
    try {
        // First, we need to prompt the user to sign in with their Google account
        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();

        // Then, create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Finally, sign in with the credential
        return signInWithCredential(auth, googleCredential);
    } catch (error) {
        console.error(error);
        Alert.alert("Google Sign-In Error", "Failed to sign in with Google.");
    }
};

const GoogleButton = () => {
    return (
        <TouchableOpacity onPress={googleSignIn}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                    source={require('path/to/google_logo.png')}
                    style={{ width: 20, height: 20, marginRight: 10 }}
                />
                <Text>Sign in with Google</Text>
            </View>
        </TouchableOpacity>
    );
};

export default GoogleButton;
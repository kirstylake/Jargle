import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View, TouchableOpacity, ImageBackground, Image, Alert } from 'react-native'
import React, { useEffect, useState, useLayoutEffect } from 'react'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from '@react-navigation/core';
import GoogleButton from './components/GoogleButton';
import { LinearGradient } from 'expo-linear-gradient';

// Define the types for navigation if not already defined
type AuthNavigationProp = {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
};
//https://www.youtube.com/watch?v=onW84a_p4VA&list=PLO3Dk6jx9EISXHQ41tqkBQJLR3FqBYoW9&index=22 

const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const video = React.useRef(null);
    const [status, setStatus] = React.useState({});

    // Cast the navigation object to use our custom navigation prop types
    const navigation = useNavigation<AuthNavigationProp>();

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //       title: "",
    //       headerStyle: { backgroundColor: '#004aad' },
    //       headerShadowVisible: false,
    //       headerTitleStyle: { flex: 1, textAlign: 'left' },
    //      })
    //   })

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                navigation.replace("HomeScreen")
            }
        })

        return unsubscribe
    }, [])


    const handleSignUp = () => {
        navigation.navigate('RegisterScreen')
    }

    const handleLogin = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredentials) => {
                const user = userCredentials.user;
                console.log('Logged in with:', user.email);
            })
            .catch(error => alert(error.message))
    }
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding">
            <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
                <View>
                    <Image style={styles.logo} source={require('../assets/icons/Logo5.png')}/>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={text => setEmail(text)}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={text => setPassword(text)}
                        style={styles.input}
                        secureTextEntry
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={handleLogin}
                        style={styles.button}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSignUp}
                        style={[styles.button, styles.buttonOutline]}
                    >
                        <Text style={styles.buttonOutlineText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 10
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    button: {
        backgroundColor: '#004aad',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonOutline: {
        backgroundColor: 'white',
        marginTop: 5,
        borderColor: '#004aad',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonOutlineText: {
        color: '#004aad',
        fontWeight: '700',
        fontSize: 16,
    },
    background: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logo: {
        width: 250,
        height: 250,
        marginBottom: 60,
    }
})
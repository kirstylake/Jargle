import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {

    //sets the style of the header to a custom styling
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white'
        })
    })

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Jargle!</Text>
            <TouchableOpacity
                style={styles.playButton}
                onPress={() => navigation.navigate('GameScreen', { key: new Date().toString() })} //Ensure a new definition is used every time the app loads
            >
                <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
        </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'white'
    },
    playButton: {
        backgroundColor: '#6200EE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    background: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default HomeScreen;
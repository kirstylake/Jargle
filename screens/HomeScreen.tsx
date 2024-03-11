import React, { useLayoutEffect, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Timer from './components/Timer';
import TimerComponent from './components/Timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, getDocs, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { auth, firebase, firestore } from '../firebase'
import { SafeAreaView } from 'react-native-safe-area-context';
import { forModalPresentationIOS } from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/CardStyleInterpolators';

const HomeScreen = ({ navigation }) => {

    const [remainingTime, setRemainingTime] = useState(0);
    const [forceRefresh, setForceRefresh] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true)   

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'center' },
            headerTintColor: 'white',
            headerTitleAlign: 'center',
            headerLeft: () => (
                <TouchableOpacity onPress={logout} style={{ marginLeft: 20 }}>
                    <Text style={styles.helpButtonText}>Logout</Text>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={showJargonRules} style={{ marginRight: 20 }}>
                    <Text style={styles.helpButtonText}>Help</Text>
                </TouchableOpacity>
            ),
        })
    })

    const logout = async () => {
        try {
            await firebase.auth().signOut();
            navigation.replace('LoginScreen', { 'route': 'true' });
        } catch (e) {
            console.log(e);
        }
    }

    const [value, setValue] = useState({
        id: '',
        email: '',
        password: '',
        username: '',
        file: null,
        error: '',
        category: '',
        difficulty: '',
        score: ''
    })


    useEffect(() => {
        setLoading(true);
        let unsubscribeUser = null;
        if (userData == null) {
            unsubscribeUser = onSnapshot(
                query(
                    collection(firestore, "Users"),
                    where("id", "==", auth.currentUser.uid)
                ),
                (snapshot) => {
                    const userData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    setUserData(userData);
                    setValue({ ...value, ...userData[0] });

                }
            );
        }
        setLoading(false)
        // }
    }, [userData])

    useEffect(() => {
        // Refresh the screen when navigating back from GameScreen
        const unsubscribe = navigation.addListener('focus', () => {
            if (forceRefresh) {
                console.log("Refreshed HomeScreen");
                setForceRefresh(false);
            }
        });

        return unsubscribe;
    }, [navigation, forceRefresh]);


    useEffect(() => {
        const loadTimer = async () => {
            try {
                // Check if a timer is stored in AsyncStorage
                const endTime = await AsyncStorage.getItem('@timer:endTime');
                if (endTime) {
                    // Calculate remaining time
                    const currentTime = new Date().getTime();
                    const remaining = parseInt(endTime) - currentTime;
                    if (remaining > 0) {
                        setRemainingTime(remaining);
                    } else {
                        // Timer has expired, remove from storage
                        setRemainingTime(0);
                        await AsyncStorage.removeItem('@timer:endTime');
                    }
                }
            } catch (error) {
                console.error('Error loading timer:', error.message);
            }
        };

        loadTimer();
    });

    // Function to display game rules
    const showJargonRules = () => {
        Alert.alert(
            "Jargon Rules", // Title of the alert
            "Here are the game rules: \n\n" + // Message of the alert
            "1. Play the game to earn points.\n" +
            "2. Every round you lose will trigger a timeout, you will not be able to play while this is counting down.\n" +
            "3. Score as high as possible through the game modes to win a spot on the leaderboard.\n" +
            "4. Change settings such as preferred category, profile picture, user name etc. in Settings.\n" +
            "\nEnjoy the game!", // Example rules
            [{ text: "OK" }] // Button to close the alert
        );
    };
    const changeCategory = async () => {
        try {
            navigation.replace('CategoryScreen');
        } catch (e) {
            console.log(e);
        }
    }
    const handleGameScreenNavigation = () => {
        // Navigate to GameScreen and set forceRefresh to true
        console.log(userData[0].category)
        if (userData[0].category == "0") {
            changeCategory()
        } else {
            navigation.navigate('GameScreen', { 'route': 'true' });
            setForceRefresh(true);
        }
    };

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
            <SafeAreaView style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <>
                        {userData && (
                            <View style={styles.container}>
                                {value.file ? (<Image source={{ uri: userData && userData[0] && userData[0].file }} style={styles.userImg} />
                                ) : (
                                <Image source={require('../assets/icons/emptyUser.png')} style={styles.userImg} />
                                )}
                                <View
                                    style={styles.welcome}>
                                    <Image style={styles.logo} source={require('../assets/icons/HomeLogo.png')} />
                                </View>

                                {remainingTime > 0 &&
                                    <TimerComponent shouldStart={false} hidden={false} />}
                                <Text style={styles.scoreText}>Score : {userData && userData[0] && userData[0].score ? userData[0].score : 0}</Text>
                                {/* <Text style={styles.scoreText}>Category : {userData && userData[0] && userData[0].category ? userData[0].category : 0}</Text> */}
                                <ScrollView>
                                    <View style={styles.container} >
                                        <View>
                                            <Text
                                                style={styles.scoreText
                                                }> Welcome Back {userData && userData[0] && userData[0].username ? userData[0].username : ""}
                                            </Text>
                                        </View>
                                        {userData && userData[0] && remainingTime === 0 && (
                                            <View style={styles.playButton}>
                                                <TouchableOpacity onPress={handleGameScreenNavigation}>
                                                    <Text style={styles.playButtonText}>
                                                        Play
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                        )}
                                    </View>
                                </ScrollView>
                            </View>
                        )}
                    </>
                )}
            </SafeAreaView>
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
        marginBottom: 10,
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
    userImg: {
        padding: 10,
        margin: 10,
        width: 150,
        height: 150,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center'
    },
    logo: {
        width: 250,
        height: 150,
    },
    welcome: {
        backgroundColor: 'transparent',
        paddingHorizontal: 30,
        paddingVertical: 10,
        margin: 10,
        borderRadius: 15,
        alignItems: 'center'
    },
    analytics: {
        flexDirection: 'row',
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white'
    },
    helpButtonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
});

export default HomeScreen;
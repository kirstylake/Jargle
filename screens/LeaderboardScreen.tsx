import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firebase } from '../firebase';

const LeaderboardScreen = ({ navigation }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(false)

    // Set header style
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Leaderboard",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white'
        })
    }, [navigation]);

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    const fetchLeaderboardData = async () => {
        setLoading(true)
        try {
            const usersCollection = firebase.firestore().collection('Users');
            const snapshot = await usersCollection.orderBy('score', 'desc').limit(10).get();

            if (!snapshot.empty) {
                const leaderboardData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setLeaderboardData(leaderboardData);
                setLoading(false)
            } else {
                console.log('No users found in Firestore.');
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard data from Firestore:', error);
        }
    };

    const renderLeaderboardItem = ({ item, index }) => (
        <View style={styles.leaderboardItem}>
            <Text style={styles.rank}>{index + 1}</Text>
            {item.file ? (
                <Image source={{ uri: item.file }} style={styles.profilePicture} />
            ) : (
                <Image source={require('../assets/icons/emptyUser.png')} style={styles.profilePicture} />
            )}
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.score}>{item.score}</Text>
        </View>
    );

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
            {loading ? (
                <ActivityIndicator size="large" color="white" />
            ) : (
                <>
                    <FlatList
                        data={leaderboardData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderLeaderboardItem}
                        contentContainerStyle={styles.container}
                        horizontal={false}
                    />
                </>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    container: {
        paddingHorizontal: 5, // Adjust padding to create space on the sides
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Align items to the sides
        marginBottom: 10,
        paddingHorizontal: 5, // Adjust padding for each item
        width: '80%', // Ensure each item takes up the full width
    },
    rank: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        color: 'white',
    },
    profilePicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    username: {
        flex: 1,
        fontSize: 16,
        color: 'white',
        marginRight: 10, // Add some space between username and score
    },
    score: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default LeaderboardScreen;
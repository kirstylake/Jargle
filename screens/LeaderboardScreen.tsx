import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firebase, storage } from '../firebase';
import { getDownloadURL, ref } from 'firebase/storage';

const LeaderboardScreen = ({ navigation }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(false)
    const [leaderboardImg, setLeaderboardImg] = useState([]);

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

// This function fetches leaderboard data from Firestore, including user scores and profile images.
// It updates the local state with the fetched data and handles loading indicators.
const fetchLeaderboardData = async () => {
    // Initialize temporary array to store leaderboard data
    var leaderboardDataTemp = [];
    // Set loading indicator to true
    setLoading(true);
    try {
        // Get reference to the 'Users' collection in Firestore
        const usersCollection = firebase.firestore().collection('Users');
        // Query Firestore to get top 10 users ordered by score in descending order
        const snapshot = await usersCollection.orderBy('score', 'desc').limit(10).get();
        
        // Check if the snapshot is not empty
        if (!snapshot.empty) {
            // Map snapshot documents to leaderboardData array
            const leaderboardData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Set leaderboardData state with fetched data
            setLeaderboardData(leaderboardData);
            // Assign fetched data to temporary array
            leaderboardDataTemp = leaderboardData;

            // Fetch image URLs for each user with Promise.all
            const fetchImageUrls = async () => {
                return Promise.all(leaderboardDataTemp.map(async (user, index) => {
                    // Get reference to the user's profile image in Firebase Storage
                    const imageRef = ref(storage, 'profile/' + user.id);
                    try {
                        // Get download URL for the profile image
                        const url = await getDownloadURL(imageRef);
                        // Return user object with image URL
                        return {...user, file: url};
                    } catch (error) {
                        // If image cannot be retrieved, set a placeholder or null
                        return {...user, file: null};
                    }
                }));
            };
            // Fetch image URLs for all users in leaderboardDataTemp
            leaderboardDataTemp = await fetchImageUrls();
            // Update leaderboardData state with fetched image URLs
            setLeaderboardData(leaderboardDataTemp);
        } else {
            // Log a message if no users are found in Firestore
            console.log('No users found in Firestore.');
        }
    } catch (error) {
        // Log error message if fetching leaderboard data fails
        console.error('Failed to fetch leaderboard data from Firestore:', error);
    } finally {
        // Set loading indicator to false regardless of success or failure
        setLoading(false);
    }
};

    const renderLeaderboardItem = ({ item, index }) => (

        <View style={styles.leaderboardItem}>
            <Text style={styles.rank}>{index + 1}</Text>
            {item.file ? (
                <Image source={{ uri: leaderboardData[index].file }} style={styles.profilePicture} />
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
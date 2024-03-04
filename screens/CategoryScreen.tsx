//https://www.youtube.com/watch?v=aFtYsghw-1k
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { auth, firebase, firestore } from '../firebase'
import * as ImagePicker from "expo-image-picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import RegisterScreen from './RegisterScreen';

// Define the types for navigation if not already defined

const CategoryScreen = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [value, setValue] = useState({
        id: '',
        categoryID: ''
    })

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const categoriesCollection = firebase.firestore().collection('Categories');
            const snapshot = await categoriesCollection.get();

            if (!snapshot.empty) {
                // Assuming each document has 'word' and 'definition'
                const categoriesArray = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                console.log(categoriesArray)

                setCategories(categoriesArray); // Update state with fetched categories
            } else {
                console.log('No categories found in Firestore.');
            }
        } catch (error) {
            console.error('Failed to fetch categories from Firestore:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };

    useEffect(() => {
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
        fetchCategories();
    }, [userData]);

    const updateProfile = (categoryID: string)  => {
        // Ensure `userData` is not empty and has the correct structure
        console.log(userData)
        if (userData && userData.length > 0 && userData[0].id) {
            
            firebase.firestore().collection('Users')
                .doc(userData[0].id) // Use the correct document ID from `userData[0].id`
                .update({
                    category : 'Categories/' + categoryID // If you want to store a reference to the category document
                })
                .then(() => {
                    console.log('User updated!');
                    navigation.navigate('SettingsScreen');
                })
                .catch((error) => {
                    // It's important to catch and handle any errors
                    console.error("Error updating user's category:", error);
                });
        } else {
            // Handle the case where `userData` may not be correctly populated
            console.log('No valid user data available for updating.');
        }
    }
    if (loading) {
        return <Text>Loading...</Text>; // Loading indicator
    }
    console.log(userData[0])
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding">
            <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
                <ScrollView style={styles.scrollContainer}>
                    <View style={styles.container}>
                        <ScrollView style={styles.scrollContainer}>
                            {categories.map((category, index) => (
                                <View key={category.id} style={{ margin: 10 }}>
                                    <TouchableOpacity
                                        onPress={() => updateProfile(category.id)}
                                        style={styles.button}>
                                        <Text style={styles.buttonText}>{category.CategoryName}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controls: {
        flex: 1,
        alignItems: 'center'
    },
    control: {
        flex: 1,
        marginTop: 10
    },
    signUpButtonContainer: {
        width: 125,
        margin: '5%'
    },
    greetingContainer: {
        alignItems: 'center',
        margin: '2.5%'
    },
    greetingText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 20
    },
    background: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileImageText: {
        fontSize: 13,
        fontWeight: '600',
        paddingTop: 10,
        color: '#94b9ff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20
    },
    profileImageSelectorContainer: {
        alignItems: 'center'
    },
    profileImageContainer: {
        flex: 1,
        width: 200,
        height: 200,
        justifyContent: 'center',
        // borderWidth: 3,
        borderRadius: 125,
        margin: '2.5%'
    },
    profileImageButton: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    profileImage: {
        width: 200,
        height: 200,
        // borderWidth: 3,
        borderRadius: 125,
        borderColor: 'lightblue'
    },
    cameraContainer: {
        position: 'absolute',
        right: 20,
        bottom: 10
    },
    cameraImageContainer: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#200F77'
    },
    cameraImage: {
        width: 25,
        height: 25
    },
    textFields: {
        height: 50,
        width: '60%',
        margin: '1%',
        borderWidth: 1,
        backgroundColor: 'white',
        borderRadius: 10,
        justifyContent: 'center',
        paddingLeft: 6,
        paddingRight: 6,
        flexDirection: 'row'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5
    },
    image: {
        flex: 1,
        justifyContent: "center",
        width: '100%',
        height: '100%',
    },
    scrollContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        marginTop: "10%"
    },
    error: {
        marginTop: 10,
        padding: 10,
        color: '#fff',
        backgroundColor: '#D54826FF',
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
        borderColor: '#0782F9',
        borderWidth: 2,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },

});

export default CategoryScreen


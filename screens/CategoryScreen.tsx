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
    ActivityIndicator,
} from 'react-native';
import { auth, firebase, firestore } from '../firebase'
import * as ImagePicker from "expo-image-picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import RegisterScreen from './RegisterScreen';
import { useRoute } from '@react-navigation/native';


// Define the types for navigation if not already defined

const CategoryScreen = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [newUser, setNewUser] = useState(false);
    const [value, setValue] = useState({
        id: '',
        categoryID: ''
    })
    const [selectedCategory, setSelectedCategory] = useState(null);
    const route = useRoute();
    const { params } = route;

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white',
            headerLeft: () => (
                <TouchableOpacity onPress={handleBack} style={{ marginLeft: 20 }}>
                    {selectedCategory && !newUser && (
                        <Text style={styles.helpButtonText}>Back</Text>
                    )}
                </TouchableOpacity>
            ),
        })
    })

    const handleBack = async () => {
        try {
            navigation.replace('HomeScreen');
        } catch (e) {
            console.log(e);
        }
    }

    const fetchCategories = async () => {
        setLoading(true);
        try {
            //get the firebase collection
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
            //set the delected category to either null or the one that the user has assigned to their profile
            setSelectedCategory(userData && userData.length > 0 ? userData[0].category : null)
        }
    };

    useEffect(() => {
        // Define a variable to hold the unsubscribe function
        let unsubscribeUser = null;
    
        // Check if userData is null
        if (userData == null) {
            // If userData is null, subscribe to changes in the Users collection
            // for the current authenticated user's ID
            unsubscribeUser = onSnapshot(
                query(
                    collection(firestore, "Users"),
                    where("id", "==", auth.currentUser.uid)
                ),
                (snapshot) => {
                    // Map the snapshot documents to userData array
                    const userData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    // Set the userData state with the fetched data
                    setUserData(userData);
                    // Update the value state with the data of the first user
                    setValue({ ...value, ...userData[0] })
                }
            );
        }
        // Fetch categories data
        fetchCategories();
    
        // Cleanup function to unsubscribe when component unmounts or userData changes
        return () => {
            if (unsubscribeUser) {
                unsubscribeUser();
            }
        };
    }, [userData]);

    const updateProfile = (categoryID: string) => {
        // Ensure `userData` is not empty and has the correct structure
        console.log(userData)
        if (userData && userData.length > 0 && userData[0].id) {

            firebase.firestore().collection('Users')
                .doc(userData[0].id) // Use the correct document ID from `userData[0].id`
                .update({
                    category: categoryID // If you want to store a reference to the category document
                })
                .then(() => {
                    console.log('User updated!');
                    navigation.navigate("HomeScreen", { 'route': 'true' })
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


    // Function to handle category selection
    const handleCategorySelect = (categoryId) => {
        setSelectedCategory(categoryId);
    }

    // Function to handle saving changes
    const handleSaveChanges = () => {
        if (selectedCategory) {
            setLoading(true);
            updateProfile(selectedCategory);
        } else {
            console.log("Please select a category before saving changes.");
        }
    }

    console.log(userData && userData.length > 0 ? userData[0] : null);
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding">

            <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
                {loading && userData && categories ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <>
                        <Text style={styles.categoryText}>Choose a Category</Text>
                        <ScrollView style={styles.scrollContainer}>
                            <View style={styles.container}>
                                <ScrollView style={styles.scrollContainer}>
                                    {categories.map((category, index) => (
                                        <View key={category.id} style={{ margin: 10 }}>
                                            <TouchableOpacity
                                                onPress={() => handleCategorySelect(category.id)}
                                                style={[
                                                    styles.button,
                                                    selectedCategory === category.id && { backgroundColor: 'white' }
                                                ]}
                                            >
                                                <Text style={[styles.buttonText, selectedCategory === category.id && { color: '#3D87D4' }]}>
                                                    {category.CategoryName}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                    </>
                )}
            </LinearGradient>

        </KeyboardAvoidingView>
    )
};

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
        height: '100%'
    },
    error: {
        marginTop: 10,
        padding: 10,
        color: '#fff',
        backgroundColor: '#D54826FF',
    },
    button: {
        backgroundColor: '#3D87D4',
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
        color: 'black',
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
    helpButtonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    categoryText: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingTop: 10,
        paddingBottom: 10,
        color: 'white'
    },
    saveButton: {
        width: '50%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        borderColor: '#3D87D4',
        borderWidth: 5
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },

});

export default CategoryScreen


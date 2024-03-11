import React, { useState, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { firebase } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';

const AddJargonScreen = ({navigation}) => {

    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState(1);
    const [loading, setLoading] = useState(true)   

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "",
            headerStyle: { backgroundColor: '#004aad' },
            headerShadowVisible: false,
            headerTitleStyle: { flex: 1, textAlign: 'left' },
            headerTintColor: 'white',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.replace("SettingsScreen", { 'route': 'true' })} style={{ marginLeft: 20 }}>
                    <Text style={styles.helpButtonText}>Settings</Text>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={showHelp} style={{ marginRight: 20 }}>
                    <Text style={styles.helpButtonText}>Help</Text>
                </TouchableOpacity>
            ),
        })
    })

    useEffect(() => {
        fetchCategories();
    }, []);

        // Function to display game rules
        const showHelp = () => {
            Alert.alert(
                "Add Jargon", // Title of the alert
                "You can add Jargon here \n\n" + // Message of the alert
                "This will update the Jargon database for the specified category.", 
                [{ text: "OK" }] // Button to close the alert
            );
        };

    const fetchCategories = async () => {
        try {
            const categoryCollection = firebase.firestore().collection('Categories');
            const snapshot = await categoryCollection.get();

            if (!snapshot.empty) {
                const categoriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCategories(categoriesData);
                
            } else {
                console.log('No categories found in Firestore.');
            }
        } catch (error) {
            console.error('Failed to fetch categories from Firestore:', error);
        }
        setLoading(false)
    };

    const handleAddJargon = async () => {
        try {
            // Validate inputs
            if (!word || !definition || !selectedCategory) {
                throw new Error('Please fill in all fields');
            }

                    // Check if the word has spaces
        const hasSpaces = word.includes(' ');

        // Set the default difficulty level
        let difficultyLevel = 1;

        // Assign difficulty based on word length and spaces
        if (hasSpaces) {
            difficultyLevel = 5;
        } else if (word.length <= 6) {
            difficultyLevel = 1;
        } else {
            // Assign some default difficulty level if conditions are not met
            difficultyLevel = 3;
        }
        setLoading(true);
            // Create a new Jargon entry
            const jargonRef = firebase.firestore().collection('Jargon').doc(word.toUpperCase());
            await jargonRef.set({
                CategoryID: selectedCategory,
                DateAdded: firebase.firestore.FieldValue.serverTimestamp(),
                Definition: definition,
                DifficultyLevel: difficultyLevel,
                Word: word,
            });

            // Clear input fields
            setWord('');
            setDefinition('');
            setSelectedCategory('');
            setDifficultyLevel(1);

            Alert.alert('Success', 'Jargon added successfully');
        } catch (error) {
            Alert.alert('Error', error.message);      
        }
        navigation.replace("SettingsScreen", { 'route': 'true' })
        setLoading(false)
    };

    return (
        <KeyboardAvoidingView
        style={styles.container}
        behavior="padding">
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
        {loading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <>
        <Text style={styles.title}>Add New Jargon</Text>
            <ScrollView style={styles.scrollContainer}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Word:</Text>
                <TextInput
                    style={styles.input}
                    value={word}
                    onChangeText={setWord}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Definition:</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={definition}
                    onChangeText={setDefinition}
                    multiline
                />
            </View>
            <View style={styles.inputContainerPicker}>
                <Text style={styles.label}>Category:</Text>
                <Picker
                    selectedValue={selectedCategory}
                    style={[styles.inputPicker]}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    itemStyle={{ color: 'white' }}
                    
                >
                    <Picker.Item label="Select Category" value="" />
                    {categories.map((category) => (
                        <Picker.Item key={category.id} label={category.CategoryName} value={category.id} />
                    ))}
                </Picker>
            </View>
            <TouchableOpacity
                onPress={handleAddJargon}
                style={styles.button}>
                <Text style={styles.buttonText}>Add New Jargon</Text>
              </TouchableOpacity>
            </ScrollView>
            </>
        )}
        </LinearGradient>
    </KeyboardAvoidingView>
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
        color: "white"
    },
    inputContainer: {
        marginBottom: 10,
        color: "white",
    },
    inputContainerPicker: {
        marginBottom: 10,
        color: "white"
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: "white"
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 5,
        color: "black",
        backgroundColor: "white"
    },
    inputPicker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        color: "white"
    },
    multilineInput: {
        minHeight: 100,
    },
    background: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    helpButtonText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        width: '80%',
        height: '100%',
        marginTop: "2%"
    },
    button: {
        backgroundColor: '#004aad',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },

});

export default AddJargonScreen;
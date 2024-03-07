import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { firebase } from '../firebase';

const QuizScreen = () => {
    const [loading, setLoading] = useState(true);
    const [jargonWords, setJargonWords] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [definition, setDefinition] = useState('');
    const [selectedWord, setSelectedWord] = useState('');

    useEffect(() => {
        fetchRandomJargon();
    }, []);

    const fetchRandomJargon = async () => {
        setLoading(true);
        try {
            const jargonCollection = firebase.firestore().collection('Jargon');
            const snapshot = await jargonCollection.get();

            if (!snapshot.empty) {
                const jargonsArray = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const randomIndex = Math.floor(Math.random() * jargonsArray.length);
                const randomJargon = jargonsArray[randomIndex];
                setCorrectAnswer(randomJargon.Word.toUpperCase());
                setDefinition(randomJargon.Definition);
                const jargonWords = [randomJargon.Word.toUpperCase()];

                // Add three more random jargon words
                while (jargonWords.length < 4) {
                    const newIndex = Math.floor(Math.random() * jargonsArray.length);
                    const newJargon = jargonsArray[newIndex].Word.toUpperCase();
                    if (!jargonWords.includes(newJargon)) {
                        jargonWords.push(newJargon);
                    }
                }

                jargonWords.sort(() => Math.random() - 0.5); // Shuffle the words
                setJargonWords(jargonWords);
                setSelectedWord('');
            } else {
                console.log('No jargon found in Firestore.');
            }
        } catch (error) {
            console.error('Failed to fetch random jargon from Firestore:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWordSelect = (selectedWord) => {
        setSelectedWord(selectedWord);
        if (selectedWord === correctAnswer) {
            Alert.alert('Correct!', 'You selected the correct word!');
        } else {
            Alert.alert('Incorrect', 'Please try again.');
        }
    };

    return (
        <LinearGradient colors={['#004aad', '#cb6ce6']} style={styles.background}>
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <>
                        <View style={styles.clueContainer}>
                            <Text style={styles.clueText}>{definition}</Text>
                        </View>
                        <View style={styles.wordsContainer}>
                            {jargonWords.map((word, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.wordButton,
                                        selectedWord === word && styles.selectedWordButton,
                                    ]}
                                    onPress={() => handleWordSelect(word)}
                                    disabled={selectedWord !== ''}
                                >
                                    <Text style={styles.wordButtonText}>{word}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    background: {
        width: '100%',
        height: '100%',
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    clueContainer: {
        marginBottom: 20,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        elevation: 5, // Shadow for Android
    },
    clueText: {
        fontSize: 16,
    },
    wordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    wordButton: {
        backgroundColor: '#6200EE',
        paddingVertical: 10,
        paddingHorizontal: 20,
        margin: 5,
        borderRadius: 5,
    },
    selectedWordButton: {
        backgroundColor: 'green',
    },
    wordButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default QuizScreen;
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ViewStyle, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TextStyle } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { firestore } from '../firebase';

// const correctAnswer = 'LEVERAGE';

const GameScreen: React.FC = () => {
    const [guess, setGuess] = useState<string>('');
    const [guesses, setGuesses] = useState<Array<string | null>>(new Array(6).fill(null));
    const [currentAttempt, setCurrentAttempt] = useState<number>(0);
    const [gameWon, setGameWon] = useState<boolean>(false);
    const confettiRef = useRef<ConfettiCannon>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string>('LEVERAGE'); // Initialize with default value
    const [definition, setDefinition] = useState<string>(''); // State to store the definition
    const [jargons, setJargons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Function to fetch a random jargon word
    const fetchRandomJargon = async () => {
        const subscriber = firestore()
            .collection('Jargon')
            .onSnapshot(querySnapshot => {
                const jargonsArray = [];

                querySnapshot.forEach(documentSnapshot => {
                    jargonsArray.push({
                        ...documentSnapshot.data(),
                        word: documentSnapshot.data().word,
                        definition: documentSnapshot.data().definition,

                    });
                });

                setJargons(jargonsArray);
                setLoading(false);

                console.log(jargonsArray)
            });

        // Unsubscribe from events when no longer in use
        return () => subscriber();
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }

    // useEffect to call fetchRandomJargon when the component mounts
    useEffect(() => {
        fetchRandomJargon();
    }, []);


    const handleInput = (text: string) => {
        if (text.length <= correctAnswer.length) {
            setGuess(text.toUpperCase());
        }
    };

    const checkWin = (word: string): boolean => {
        return word.toUpperCase() === correctAnswer.toUpperCase();
    };

    const handleSubmit = () => {
        if (guess.length === correctAnswer.length) {
            const newGuesses = [...guesses];
            newGuesses[currentAttempt] = guess.toUpperCase();
            setGuesses(newGuesses);

            if (checkWin(guess)) {
                let boxStyle: ViewStyle = { ...styles.charBox };
                let textStyle: TextStyle = { ...styles.charText };
                boxStyle = { ...boxStyle, backgroundColor: 'green' };
                textStyle = { ...textStyle, color: 'white' }
                setGameWon(true);
                confettiRef.current?.start();
                setTimeout(() => Alert.alert('Congratulations!', 'You guessed the word!'), 1000);
            }

            setGuess('');
            if (currentAttempt < guesses.length - 1) {
                setCurrentAttempt(currentAttempt + 1);
            } else {
                Alert.alert('Game Over', 'You have used all your attempts!');
            }
        } else {
            Alert.alert(`Guess must be ${correctAnswer.length} letters.`);
        }
    };

    const getBoxStyle = (char: string, charIndex: number, attemptIndex: number): { boxStyle: ViewStyle, textStyle: TextStyle } => {
        let boxStyle: ViewStyle = { ...styles.charBox };
        let textStyle: TextStyle = { ...styles.charText };
        if (attemptIndex < currentAttempt) {
            const correctChar = correctAnswer[charIndex].toUpperCase();
            if (char.toUpperCase() === correctChar) {
                boxStyle = { ...boxStyle, backgroundColor: 'green' };
                textStyle = { ...textStyle, color: 'white' };
            } else if (correctAnswer.toUpperCase().includes(char.toUpperCase())) {
                boxStyle = { ...boxStyle, backgroundColor: 'yellow' };
            }
        }

        return { boxStyle, textStyle };
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.clueText}>{definition}</Text>
                <View style={styles.grid}>
                    {guesses.map((wordGuess, attemptIndex) => (
                        <View key={attemptIndex} style={styles.wordRow}>
                            {Array.from({ length: correctAnswer.length }).map((_, charIndex) => {
                                const char = wordGuess ? wordGuess[charIndex] : '';
                                const { boxStyle, textStyle } = getBoxStyle(char, charIndex, attemptIndex);
                                return (
                                    <View key={charIndex} style={boxStyle}>
                                        <Text style={textStyle}>{char?.toUpperCase()}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
                <TextInput
                    style={styles.input}
                    onChangeText={handleInput}
                    value={guess}
                    maxLength={correctAnswer.length}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                {gameWon && (
                    <ConfettiCannon
                        ref={confettiRef}
                        count={100}
                        origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
                        fallSpeed={5000}
                    />
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        // justifyContent: 'center',
        backgroundColor: '#fff',
    },
    clueText: {
        marginBottom: 20,
        fontSize: 16,
        textAlign: 'center',
    },
    grid: {
        maxWidth: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wordRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    charBox: {
        borderWidth: 1,
        borderColor: '#000',
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 1,
        backgroundColor: 'white',
    },
    charText: {
        fontSize: 18,
        color: 'black'
    },
    input: {
        borderWidth: 1,
        borderColor: '#000',
        width: 200,
        padding: 10,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        alignSelf: 'center'
    },
    submitButton: {
        backgroundColor: '#6200EE',
        padding: 10,
        borderRadius: 5,
        alignSelf: 'center'
    },
    submitButtonText: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
    },
});

export default GameScreen;
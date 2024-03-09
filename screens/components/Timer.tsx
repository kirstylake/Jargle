import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimerComponent = ({ shouldStart = false , hidden }) => {
    const initialDuration = 2 * 60 * 1000; // 2 minutes in milliseconds
    const [remainingTime, setRemainingTime] = useState(0);
    const [timer, setTimer] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

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
                        await AsyncStorage.removeItem('@timer:endTime');
                    }
                }
            } catch (error) {
                console.error('Error loading timer:', error.message);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTimer();

        if (shouldStart && isLoaded) {
            handleStartTimer();
        }

        return () => {
            // Clean up timer interval when component unmounts
            if (timer) {
                clearInterval(timer.intervalId);
                clearTimeout(timer.timeoutId);
            }
        };
    });

    useEffect(() => {

    }, [shouldStart, isLoaded]);

    

    const startTimer = async (duration) => {
        const timer = setTimeout(async () => {
            // Timer expired, do something (e.g., show a notification)
            console.log('Timer expired');

            // Remove timer from storage
            await AsyncStorage.removeItem('@timer:endTime');

            // Update UI
            setRemainingTime(0);
        }, duration);

        // Update remaining time on each tick of the timer
        const interval = 1000; // Update every second
        const tick = () => {
            setRemainingTime(prevTime => Math.max(0, prevTime - interval)); // Decrease remaining time by interval
        };
        const timerInterval = setInterval(tick, interval);

        // Store both the timeout and interval IDs
        setTimer({ timeoutId: timer, intervalId: timerInterval });

        return timer;
    };

    const formatTime = (milliseconds) => {
        const minutes = Math.floor(milliseconds / 60000); // Convert milliseconds to minutes
        const seconds = Math.floor((milliseconds % 60000) / 1000); // Convert remaining milliseconds to seconds
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // Ensure seconds are displayed with leading zero if needed
    };

    const handleStartTimer = async () => {
        // Save end time to AsyncStorage
        const endTime = new Date().getTime() + initialDuration;
        await AsyncStorage.setItem('@timer:endTime', endTime.toString());

        // Start the timer
        const timer = await startTimer(initialDuration);
        console.log(timer)
    };

    return (
        <View>
            <Text style={styles.timerText}> You are in timeout: {formatTime(remainingTime)}</Text>
        </View>
    )};
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'darkred'
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

export default TimerComponent;
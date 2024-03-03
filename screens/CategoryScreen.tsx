import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { firestore } from '../firebase';

const CategoryScreen: React.FC = () => {
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const snapshot = await firestore().collection('Categories').get();
            const fetchedCategories = snapshot.docs.map((doc) => doc.data().category);
            setCategories(fetchedCategories);
        };

        fetchCategories();
    }, []);

    return (
        <View>
            <Text>Select a Category</Text>
            <FlatList
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => <Text>{item}</Text>}
            />
        </View>
    );
};

export default CategoryScreen;
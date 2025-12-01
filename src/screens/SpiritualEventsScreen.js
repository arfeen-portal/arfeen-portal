import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SpiritualEventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spiritual Tracker</Text>
      <Text style={styles.text}>
        Yahan baad mein:
        {'\n'}- Haram visits count
        {'\n'}- Masjid Nabawi visits
        {'\n'}- Umrah performed
        {'\n'}- Ziyarat auto check-in
        {'\n'} ka UI aayega.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  text: { fontSize: 14, lineHeight: 20 }
});

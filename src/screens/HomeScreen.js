import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arfeen Travel App</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('FamilyLocator')}
      >
        <Text style={styles.buttonText}>Family Locator</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SpiritualEvents')}
      >
        <Text style={styles.buttonText}>Spiritual Events / Ziyarat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Voucher')}
      >
        <Text style={styles.buttonText}>My Voucher (QR)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DriverTrips')}
      >
        <Text style={styles.buttonText}>Driver Mode (Trips)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 30 },
  button: {
    backgroundColor: '#0047AB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    width: '100%',
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
});

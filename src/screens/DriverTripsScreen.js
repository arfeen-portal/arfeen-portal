import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { getSupabaseClient } from '@/lib/supabaseClient';

import { useAuth } from '../context/AuthContext';
const supabase = getSupabaseClient();
export default function DriverTripsScreen() {
  const { session } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const driverId = session?.user?.id; // Auth user → driver

  useEffect(() => {
    if (!driverId) return;

    const loadTrips = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transport_bookings')
        .select(
          'id, booking_code, status, pickup_location, dropoff_location, travel_date'
        )
        .eq('driver_id', driverId)
        .order('travel_date', { ascending: true });

      if (error) {
        console.log(error);
        Alert.alert('Error', 'Failed to load trips');
      } else {
        setTrips(data || []);
      }
      setLoading(false);
    };

    loadTrips();
  }, [driverId]);

  async function sendPing(bookingId) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission required.');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { error } = await supabase.from('driver_locations').insert([
      {
        driver_id: driverId,
        booking_id: bookingId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      },
    ]);

    if (error) {
      console.log(error);
      Alert.alert('Error', 'Could not send location');
    } else {
      Alert.alert('Sent', 'Location ping sent to portal');
    }
  }

  const renderItem = ({ item }) => (
    <View style={styles.tripCard}>
      <Text style={styles.tripTitle}>{item.booking_code || item.id}</Text>
      <Text style={styles.tripText}>Status: {item.status}</Text>
      <Text style={styles.tripText}>
        {item.pickup_location} ➜ {item.dropoff_location}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sendPing(item.id)}
      >
        <Text style={styles.buttonText}>Send Location</Text>
      </TouchableOpacity>
    </View>
  );

  if (!driverId) {
    return (
      <View style={styles.container}>
        <Text>Please login again (no driver id).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : trips.length === 0 ? (
        <Text>No trips assigned.</Text>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  tripCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tripTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  tripText: { fontSize: 12, marginBottom: 2 },
  button: {
    marginTop: 8,
    backgroundColor: '#0047AB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

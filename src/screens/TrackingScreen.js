// src/screens/TrackingScreen.js

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { locatorApi } from '../api';
import { useLocator } from '../context';

export default function TrackingScreen({ navigation }) {
  const { member, trip } = useLocator();
  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState(null);
  const [locations, setLocations] = useState([]);
  const intervalRef = useRef(null);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setStatus('Location permission denied');
      setHasPermission(false);
    } else {
      setHasPermission(true);
      setStatus('Location permission granted');
    }
  };

  const sendLocationOnce = async () => {
    if (!trip || !member) {
      setStatus('No trip/member selected');
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const batteryPercent = Math.round(batteryLevel * 100);

      await locatorApi.sendLocation(
        trip.id,
        member.id,
        lat,
        lng,
        accuracy,
        batteryPercent
      );
      setStatus(
        `Location sent (${lat.toFixed(5)}, ${lng.toFixed(
          5
        )}) – Battery ${batteryPercent}%`
      );
    } catch (e) {
      setStatus(e.message);
    }
  };

  const loadMembersLocations = async () => {
    if (!trip) return;
    try {
      const data = await locatorApi.listLocations(trip.id);
      setLocations(data.locations || []);
    } catch (e) {
      // ignore small errors
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    if (!hasPermission || !trip || !member) return;

    // Send first immediately
    sendLocationOnce();
    loadMembersLocations();

    // Every 5 seconds location + refresh list
    intervalRef.current = setInterval(() => {
      sendLocationOnce();
      loadMembersLocations();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasPermission, trip, member]);

  if (!trip || !member) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No trip/member selected. Go back to setup screen.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
        Live Tracking
      </Text>
      <Text style={{ marginBottom: 4 }}>
        Trip: {trip.trip_name} ({trip.trip_code})
      </Text>
      <Text style={{ marginBottom: 12 }}>You: {member.member_name}</Text>

      {status && (
        <Text
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 8,
            marginBottom: 12,
          }}
        >
          {status}
        </Text>
      )}

      <TouchableOpacity
        onPress={sendLocationOnce}
        style={{
          backgroundColor: '#2563eb',
          padding: 10,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: '#fff' }}>Send Location Now</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={loadMembersLocations}
        style={{
          backgroundColor: '#4b5563',
          padding: 10,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#fff' }}>Refresh Members List</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('SOS')}
        style={{
          backgroundColor: '#b91c1c',
          padding: 10,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>OPEN SOS</Text>
      </TouchableOpacity>

      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Family members</Text>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const m = item.family_member;
          return (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#eee',
                padding: 8,
                marginBottom: 6,
              }}
            >
              <Text style={{ fontWeight: '600' }}>
                {m?.member_name || '—'}{' '}
                {m?.relation ? `(${m.relation})` : ''}
              </Text>
              <Text style={{ fontSize: 12 }}>
                Lat: {item.lat.toFixed(5)} | Lng: {item.lng.toFixed(5)}
              </Text>
              <Text style={{ fontSize: 12 }}>
                Battery:{' '}
                {item.battery != null ? `${item.battery}%` : '—'}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                Last updated:{' '}
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: '#6b7280' }}>
            No locations yet. Other members must open app.
          </Text>
        }
      />
    </View>
  );
}

// src/screens/SosScreen.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { locatorApi } from '../api';
import { useLocator } from '../context';

export default function SosScreen() {
  const { trip, member } = useLocator();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('SOS – please help');

  const sendSos = async () => {
    if (!trip || !member) {
      setStatus('No trip/member selected');
      return;
    }
    try {
      setStatus('Sending SOS...');
      let lat = null;
      let lng = null;
      try {
        const { status: locStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch {
        // ignore location errors, SOS can still go without coordinates
      }

      await locatorApi.sendSos(trip.id, member.id, lat, lng, message);
      setStatus('SOS sent successfully');
    } catch (e) {
      setStatus(e.message);
    }
  };

  if (!trip || !member) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No trip/member selected. Go back.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        SOS – Emergency
      </Text>
      <Text style={{ marginBottom: 4 }}>
        Trip: {trip.trip_name} ({trip.trip_code})
      </Text>
      <Text style={{ marginBottom: 16 }}>
        You: {member.member_name}
      </Text>

      {status && (
        <Text
          style={{
            borderWidth: 1,
            borderColor: '#fca5a5',
            backgroundColor: '#fee2e2',
            padding: 8,
            marginBottom: 12,
          }}
        >
          {status}
        </Text>
      )}

      <Text style={{ marginBottom: 4 }}>Message (optional)</Text>
      <TextInput
        value={message}
        onChangeText={setMessage}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 8,
          marginBottom: 16,
        }}
        multiline
      />

      <TouchableOpacity
        onPress={sendSos}
        style={{
          backgroundColor: '#b91c1c',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          SEND SOS
        </Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
        This will alert your family and Arfeen support (in the future
        dashboard) that you need help, along with your last known
        location if available.
      </Text>
    </View>
  );
}

// src/screens/FamilySetupScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { locatorApi } from '../api';
import { useLocator } from '../context';

export default function FamilySetupScreen({ navigation }) {
  const { family, member, trip, setFamily, setMember, setTrip } = useLocator();
  const [status, setStatus] = useState(null);

  // Create family form
  const [createFamilyName, setCreateFamilyName] = useState('');
  const [createMemberName, setCreateMemberName] = useState('');
  const [createRelation, setCreateRelation] = useState('');

  // Join family form
  const [joinFamilyCode, setJoinFamilyCode] = useState('');
  const [joinMemberName, setJoinMemberName] = useState('');
  const [joinRelation, setJoinRelation] = useState('');

  // Trip form
  const [tripName, setTripName] = useState('');
  const [tripCodeJoin, setTripCodeJoin] = useState('');

  const handleCreateFamily = async () => {
    try {
      setStatus('Creating family...');
      const data = await locatorApi.createFamily(
        createFamilyName,
        createMemberName,
        createRelation
      );
      setFamily(data.family);
      setMember(data.member);
      setStatus(
        `Family created: ${data.family.family_name} (Code: ${data.family.family_code})`
      );
    } catch (e) {
      setStatus(e.message);
    }
  };

  const handleJoinFamily = async () => {
    try {
      setStatus('Joining family...');
      const data = await locatorApi.joinFamily(
        joinFamilyCode,
        joinMemberName,
        joinRelation
      );
      setFamily(data.family);
      setMember(data.member);
      setStatus(
        `Joined family: ${data.family.family_name} (Code: ${data.family.family_code})`
      );
    } catch (e) {
      setStatus(e.message);
    }
  };

  const handleCreateTrip = async () => {
    if (!family) {
      setStatus('Create or join a family first');
      return;
    }
    try {
      setStatus('Creating trip...');
      const data = await locatorApi.createTrip(family.id, tripName);
      setTrip(data.trip);
      setStatus(
        `Trip created: ${data.trip.trip_name} (Code: ${data.trip.trip_code})`
      );
    } catch (e) {
      setStatus(e.message);
    }
  };

  const handleJoinTrip = async () => {
    if (!member) {
      setStatus('Create or join family first');
      return;
    }
    try {
      setStatus('Joining trip...');
      const data = await locatorApi.joinTrip(tripCodeJoin, member.id);
      setTrip(data.trip);
      setStatus(
        `Joined trip: ${data.trip.trip_name} (Code: ${data.trip.trip_code})`
      );
    } catch (e) {
      setStatus(e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>
        Arfeen Locator – Family Setup
      </Text>

      {status && (
        <Text
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 8,
            marginBottom: 12,
          }}
        >
          {status}
        </Text>
      )}

      {/* Current state */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 16,
        }}
      >
        <Text>Family: {family ? family.family_name : '—'}</Text>
        <Text>Member: {member ? member.member_name : '—'}</Text>
        <Text>Trip: {trip ? trip.trip_name : '—'}</Text>
      </View>

      {/* Create family */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
          Create Family
        </Text>
        <TextInput
          placeholder="Family name"
          value={createFamilyName}
          onChangeText={setCreateFamilyName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TextInput
          placeholder="Your name"
          value={createMemberName}
          onChangeText={setCreateMemberName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TextInput
          placeholder="Relation (Father, Son, etc.)"
          value={createRelation}
          onChangeText={setCreateRelation}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TouchableOpacity
          onPress={handleCreateFamily}
          style={{
            backgroundColor: '#2563eb',
            padding: 10,
            borderRadius: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff' }}>Create Family</Text>
        </TouchableOpacity>
      </View>

      {/* Join family */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
          Join Family
        </Text>
        <TextInput
          placeholder="Family code (AF-123456)"
          value={joinFamilyCode}
          onChangeText={setJoinFamilyCode}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TextInput
          placeholder="Your name"
          value={joinMemberName}
          onChangeText={setJoinMemberName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TextInput
          placeholder="Relation"
          value={joinRelation}
          onChangeText={setJoinRelation}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TouchableOpacity
          onPress={handleJoinFamily}
          style={{
            backgroundColor: '#16a34a',
            padding: 10,
            borderRadius: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff' }}>Join Family</Text>
        </TouchableOpacity>
      </View>

      {/* Trip */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 10,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
          Trip (Umrah / Ziyarat)
        </Text>
        <TextInput
          placeholder="Trip name (Umrah Rabi ul Awwal)"
          value={tripName}
          onChangeText={setTripName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TouchableOpacity
          onPress={handleCreateTrip}
          style={{
            backgroundColor: '#2563eb',
            padding: 10,
            borderRadius: 4,
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Text style={{ color: '#fff' }}>Create Trip</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Join trip code (TRP-123456)"
          value={tripCodeJoin}
          onChangeText={setTripCodeJoin}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            marginBottom: 8,
            padding: 8,
          }}
        />
        <TouchableOpacity
          onPress={handleJoinTrip}
          style={{
            backgroundColor: '#16a34a',
            padding: 10,
            borderRadius: 4,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff' }}>Join Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Go to tracking */}
      {trip && member && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Tracking')}
          style={{
            backgroundColor: '#111827',
            padding: 12,
            borderRadius: 4,
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Text style={{ color: '#fff' }}>Go to Live Tracking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// driver/proof.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

export default function ProofScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Missing booking id');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'Not logged in');
      return;
    }
    if (!imageUri) {
      Alert.alert('Photo required', 'Please capture drop-off photo');
      return;
    }

    try {
      setLoading(true);

      const { data: profile, error: profileError } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        Alert.alert('Error', 'Driver profile not found');
        return;
      }

      const driverId = profile.id as string;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const filePath = `${bookingId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase
        .storage
        .from('ride-proofs')
        .upload(filePath, blob as any, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error(uploadError);
        Alert.alert('Upload failed', uploadError.message);
        return;
      }

      const { error: proofError } = await supabase
        .from('transport_ride_proofs')
        .insert({
          booking_id: bookingId,
          driver_id: driverId,
          photo_path: filePath,
          signature_name: signatureName || null,
          notes: notes || null,
        });

      if (proofError) {
        console.error(proofError);
        Alert.alert('Error', 'Failed to save proof');
        return;
      }

      await supabase
        .from('transport_bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      Alert.alert('Success', 'Ride completed with proof', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
          Drop-off Proof
        </Text>

        <TouchableOpacity
          onPress={pickImage}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: 220, borderRadius: 8 }}
            />
          ) : (
            <Text style={{ color: '#555' }}>Tap to capture drop-off photo</Text>
          )}
        </TouchableOpacity>

        <Text style={{ marginBottom: 6 }}>Customer name (signature)</Text>
        <TextInput
          placeholder="e.g. Ahmed Khan"
          value={signatureName}
          onChangeText={setSignatureName}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginBottom: 12,
          }}
        />

        <Text style={{ marginBottom: 6 }}>Notes (optional)</Text>
        <TextInput
          placeholder="Any extra info..."
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            height: 80,
            textAlignVertical: 'top',
          }}
        />

        <TouchableOpacity
          disabled={loading}
          onPress={handleSubmit}
          style={{
            marginTop: 24,
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: '#1f4db3',
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Submit & Complete Ride
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

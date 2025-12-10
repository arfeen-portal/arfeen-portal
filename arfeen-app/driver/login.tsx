// app/driver/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

export default function DriverLoginScreen() {
  const router = useRouter();
  const { session, initialLoading, signIn } = useSupabaseAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!initialLoading && session) {
      // Already logged in → go to rides
      router.replace('/driver/rides');
    }
  }, [initialLoading, session]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/driver/rides');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login failed', error.message ?? 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '600', marginBottom: 24 }}>
        Driver Login
      </Text>

      <Text style={{ marginBottom: 8 }}>Email</Text>
      <TextInput
        placeholder="driver@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 16,
        }}
      />

      <Text style={{ marginBottom: 8 }}>Password</Text>
      <TextInput
        placeholder="●●●●●●●●"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 24,
        }}
      />

      <TouchableOpacity
        disabled={loading}
        onPress={handleLogin}
        style={{
          backgroundColor: '#1f4db3',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600' }}>Sign in</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

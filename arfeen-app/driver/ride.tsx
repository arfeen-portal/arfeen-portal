// driver/ride.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { registerForPushNotificationsAsync } from '../lib/notifications';

type TransportBooking = {
  id: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_time: string | null;
  status: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
};

type DriverProfile = {
  id: string;
  full_name: string | null;
};

type RideAction = 'accept' | 'start' | 'complete';

function getNextAction(status: string | null): RideAction | null {
  const s = (status ?? 'pending').toLowerCase();

  if (s === 'pending' || s === 'assigned' || s === 'confirmed') {
    return 'accept';
  }

  if (s === 'accepted' || s === 'arrived') {
    return 'start';
  }

  if (s === 'ongoing') {
    return 'complete';
  }

  return null;
}

function getNextStatus(currentStatus: string | null): string {
  const s = (currentStatus ?? 'pending').toLowerCase();

  if (s === 'pending' || s === 'assigned' || s === 'confirmed') {
    return 'accepted';
  }

  if (s === 'accepted' || s === 'arrived') {
    return 'ongoing';
  }

  if (s === 'ongoing') {
    return 'completed';
  }

  return 'completed';
}

function getActionLabel(action: RideAction): string {
  if (action === 'accept') return 'Accept Ride';
  if (action === 'start') return 'Start Ride';
  if (action === 'complete') return 'Complete Ride';
  return '';
}

function getActionButtonColor(action: RideAction): string {
  if (action === 'accept') return '#1f4db3';
  if (action === 'start') return '#1f8b4c';
  if (action === 'complete') return '#b37400';
  return '#1f4db3';
}

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function DriverRidesScreen() {
  const { user, initialLoading, signOut } = useSupabaseAuth();
  const router = useRouter();

  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [rides, setRides] = useState<TransportBooking[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRides, setLoadingRides] = useState(true);

  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const ridesRef = useRef<TransportBooking[]>([]);

  const [updatingRideId, setUpdatingRideId] = useState<string | null>(null);

  useEffect(() => {
    ridesRef.current = rides;
  }, [rides]);

  // profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoadingProfile(true);

      const { data, error } = await supabase
        .from('driver_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load driver profile');
      } else if (!data) {
        Alert.alert(
          'Profile missing',
          'No driver profile found for this account. Please ask admin to create one.'
        );
      } else {
        setDriverProfile(data as DriverProfile);
      }

      setLoadingProfile(false);
    };

    if (!initialLoading && user) {
      fetchProfile();
    }
  }, [initialLoading, user]);

  // push token
  useEffect(() => {
    const saveToken = async () => {
      if (!driverProfile) return;
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      await supabase
        .from('driver_profiles')
        .update({ expo_push_token: token })
        .eq('id', driverProfile.id);
    };

    saveToken();
  }, [driverProfile]);

  // rides + realtime
  useEffect(() => {
    if (!driverProfile) return;

    const fetchRides = async () => {
      setLoadingRides(true);

      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, pickup_location, dropoff_location, pickup_time, status, pickup_lat, pickup_lng')
        .eq('driver_id', driverProfile.id)
        .order('pickup_time', { ascending: true });

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load rides');
      } else {
        setRides(data as TransportBooking[]);
      }

      setLoadingRides(false);
    };

    fetchRides();

    const channel = supabase
      .channel(`driver-rides-${driverProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_bookings',
          filter: `driver_id=eq.${driverProfile.id}`,
        },
        (payload: any) => {
          const newRow = payload.new as TransportBooking | null;
          const oldRow = payload.old as TransportBooking | null;

          setRides((current) => {
            const copy = [...current];

            if (payload.eventType === 'INSERT' && newRow) {
              return [newRow, ...copy];
            }

            if (payload.eventType === 'UPDATE' && newRow) {
              const index = copy.findIndex((r) => r.id === newRow.id);
              if (index >= 0) {
                copy[index] = newRow;
              } else {
                copy.unshift(newRow);
              }
              return copy;
            }

            if (payload.eventType === 'DELETE' && oldRow) {
              return copy.filter((r) => r.id !== oldRow.id);
            }

            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverProfile]);

  // location + arrived
  const startLocationSharing = async () => {
    if (!driverProfile) {
      Alert.alert('No profile', 'Driver profile not loaded yet.');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required.');
      setIsSharingLocation(false);
      return;
    }

    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert('Location off', 'Please enable location services on your phone.');
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 10,
        timeInterval: 10_000,
      },
      async (loc) => {
        const { latitude, longitude, accuracy, heading, speed } = loc.coords;

        const { error } = await supabase.from('driver_locations').upsert(
          {
            driver_id: driverProfile.id,
            lat: latitude,
            lng: longitude,
            accuracy,
            heading,
            speed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'driver_id' }
        );

        if (error) {
          console.error('Location upsert error', error);
        }

        const currentRides = ridesRef.current;

        for (const ride of currentRides) {
          const st = (ride.status ?? '').toLowerCase();

          if (
            st === 'accepted' &&
            ride.pickup_lat != null &&
            ride.pickup_lng != null
          ) {
            const dist = haversineDistanceMeters(
              latitude,
              longitude,
              ride.pickup_lat,
              ride.pickup_lng
            );

            if (dist <= 120) {
              const { error: updateError } = await supabase
                .from('transport_bookings')
                .update({ status: 'arrived' })
                .eq('id', ride.id);

              if (!updateError) {
                setRides((current) =>
                  current.map((r) =>
                    r.id === ride.id ? { ...r, status: 'arrived' } : r
                  )
                );
              }
            }
          }
        }
      }
    );

    locationSubscription.current = sub;
    setIsSharingLocation(true);
  };

  const stopLocationSharing = () => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setIsSharingLocation(false);
  };

  const toggleLocationSharing = (value: boolean) => {
    if (value) {
      startLocationSharing();
    } else {
      stopLocationSharing();
    }
  };

  const handleRideAction = async (ride: TransportBooking) => {
    const action = getNextAction(ride.status);
    if (!action) return;

    if (action === 'complete') {
      router.push({
        pathname: '/driver/proof',
        params: { bookingId: ride.id },
      });
      return;
    }

    const newStatus = getNextStatus(ride.status);

    try {
      setUpdatingRideId(ride.id);

      const { error } = await supabase
        .from('transport_bookings')
        .update({ status: newStatus })
        .eq('id', ride.id);

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to update ride status');
        return;
      }

      setRides((current) =>
        current.map((r) =>
          r.id === ride.id ? { ...r, status: newStatus } : r
        )
      );
    } finally {
      setUpdatingRideId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (initialLoading || loadingProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading driver data...</Text>
      </View>
    );
  }

  if (!user || !driverProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ marginBottom: 12 }}>Driver not logged in or profile missing.</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#1f4db3',
          }}
        >
          <Text style={{ color: '#1f4db3' }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 50, paddingHorizontal: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            Welcome, {driverProfile.full_name ?? 'Driver'}
          </Text>
          <Text style={{ color: '#666', marginTop: 4 }}>Assigned rides</Text>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: 'red', fontWeight: '500' }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: '#f4f6fb',
          marginBottom: 16,
        }}
      >
        <View>
          <Text style={{ fontWeight: '600' }}>Share live location</Text>
          <Text style={{ color: '#555', fontSize: 12 }}>
            Admin map pe aap ki live position show hogi
          </Text>
        </View>
        <Switch
          value={isSharingLocation}
          onValueChange={toggleLocationSharing}
        />
      </View>

      {loadingRides ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>Loading rides...</Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>No rides assigned yet.</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const pickupTime =
              item.pickup_time ? new Date(item.pickup_time).toLocaleString() : 'N/A';

            const action = getNextAction(item.status);
            const buttonLabel = action ? getActionLabel(action) : '';
            const buttonColor = action ? getActionButtonColor(action) : '#1f4db3';

            const st = (item.status ?? '').toLowerCase();

            return (
              <View
                style={{
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  marginBottom: 10,
                  elevation: 1,
                }}
              >
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                  {item.pickup_location ?? 'Pickup'} → {item.dropoff_location ?? 'Dropoff'}
                </Text>
                <Text style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                  Pickup: {pickupTime}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color:
                      st === 'ongoing'
                        ? '#1f8b4c'
                        : st === 'completed'
                        ? '#555'
                        : st === 'arrived'
                        ? '#0066cc'
                        : '#b37400',
                  }}
                >
                  Status: {item.status ?? 'pending'}
                </Text>

                {action && (
                  <TouchableOpacity
                    disabled={updatingRideId === item.id}
                    onPress={() => handleRideAction(item)}
                    style={{
                      marginTop: 10,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      backgroundColor: buttonColor,
                    }}
                  >
                    {updatingRideId === item.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                        {buttonLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

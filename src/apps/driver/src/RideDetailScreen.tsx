// @ts-nocheck
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DriverRide } from "../types/rides";

export function DriverHomeScreen() {
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  async function load() {
    try {
      setRefreshing(true);
      const res = await fetch(
        "https://YOUR_PORTAL_DOMAIN/api/driver/rides/today"
      );
      const json = await res.json();
      setRides(json.items ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Today&apos;s rides
      </Text>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("RideDetail", {
                rideId: item.id,
              })
            }
            style={{
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {item.pickup_name} → {item.dropoff_name}
            </Text>
            <Text style={{ fontSize: 12, color: "#666" }}>
              {new Date(item.pickup_time).toLocaleTimeString()}
            </Text>
            <Text style={{ fontSize: 12, marginTop: 4 }}>
              {item.passengers} pax • {item.status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

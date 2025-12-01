// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../lib/supabaseClient";

type Props = {
  pilgrimId: string;
  city?: string;
};

export default function LocationPingScreen({ pilgrimId, city }: Props) {
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function start() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location permission denied");
      return;
    }

    setRunning(true);

    intervalRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        await supabase.from("pilgrim_location_logs").insert({
          pilgrim_id: pilgrimId,
          lat,
          lng,
          city: city || null,
        });
      } catch (e) {
        console.log("Location error:", e);
      }
    }, 60 * 1000);
  }

  function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }}>
        Location Auto Ping
      </Text>
      <Text style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
        Jab yeh feature on hoga, app har 60 second me aap ki location secure
        way se Arfeen portal ko bhejega.
      </Text>

      {!running ? (
        <TouchableOpacity
          onPress={start}
          style={{
            backgroundColor: "#16a34a",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Start Location Pings
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={stop}
          style={{
            backgroundColor: "#dc2626",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Stop Location Pings
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

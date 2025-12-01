// @ts-nocheck
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
} from "react-native";
import * as Location from "expo-location";

const PROFILE_ID = "FAMILY-1"; // har user ke liye unique id

const API_URL =
  "https://YOUR_DOMAIN.com/api/locator/ingest"; // <-- apna domain

export default function App() {
  const [status, setStatus] = useState("Idle");
  const [lastSent, setLastSent] = useState<string | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission() {
    const { status } =
      await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Location permission is required for tracking."
      );
    }
  }

  async function sendOnce() {
    try {
      setStatus("Getting location…");
      const pos =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.Balanced,
        });

      const payload = {
        profile_id: PROFILE_ID,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: new Date().toISOString(),
      };

      setStatus("Sending…");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          "HTTP " + res.status
        );
      }

      setLastSent(
        new Date().toLocaleTimeString()
      );
      setStatus("Last ping success");
    } catch (e) {
      console.error(e);
      setStatus("Error sending");
      Alert.alert(
        "Error",
        "Failed to send location"
      );
    }
  }

  useEffect(() => {
    if (!isRunning) return;

    sendOnce(); // first time
    const id = setInterval(
      sendOnce,
      15000
    ); // every 15s

    return () => clearInterval(id);
  }, [isRunning]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Arfeen Locator
      </Text>
      <Text style={styles.status}>
        Status: {status}
      </Text>
      <Text>
        Profile: {PROFILE_ID}
      </Text>
      <Text>
        Last sent:{" "}
        {lastSent ?? "never"}
      </Text>

      <View style={{ height: 20 }} />

      <Button
        title={
          isRunning
            ? "Stop auto tracking"
            : "Start auto tracking"
        }
        onPress={() =>
          setIsRunning((v) => !v)
        }
      />

      <View style={{ height: 10 }} />

      <Button
        title="Send one ping now"
        onPress={sendOnce}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  status: {
    marginTop: 4,
    marginBottom: 4,
  },
});

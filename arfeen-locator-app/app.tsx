// @ts-nocheck
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, Alert } from "react-native";
import * as Location from "expo-location";
import CryptoJS from "crypto-js";

const DOMAIN = "arfeenportal.com";
const PROFILE_ID = "FAMILY-1";
const LOCATOR_INGEST_SECRET = "arfeen_locator_2026_9xKp72mLqTz8R4vN6sYb3QwE5dH1cU";

const API_URL = `https://${DOMAIN}/api/locator/ingest`;

function normalizeOptionalNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createSignature(payload: any) {
  const message = [
    payload.domain,
    payload.profile_id,
    payload.lat,
    payload.lng,
    payload.accuracy ?? "",
    payload.heading ?? "",
    payload.speed ?? "",
    payload.timestamp,
  ].join("|");

  return CryptoJS.HmacSHA256(message, LOCATOR_INGEST_SECRET).toString(
    CryptoJS.enc.Hex
  );
}

export default function App() {
  const [status, setStatus] = useState("Idle");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Location permission is required for tracking.");
    }
  }

  async function sendOnce() {
    try {
      setStatus("Getting location…");

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const payload = {
        domain: DOMAIN,
        profile_id: PROFILE_ID,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: normalizeOptionalNumber(pos.coords.accuracy),
        heading: normalizeOptionalNumber(pos.coords.heading),
        speed: normalizeOptionalNumber(pos.coords.speed),
        timestamp: new Date().toISOString(),
      };

      const signature = createSignature(payload);

      setStatus("Sending…");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locator-signature": signature,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      setLastSent(new Date().toLocaleTimeString());
      setStatus("Last ping success");
    } catch (e) {
      console.error(e);
      setStatus("Error sending");
      Alert.alert("Error", "Failed to send location");
    }
  }

  useEffect(() => {
    if (!isRunning) return;

    sendOnce();
    const id = setInterval(sendOnce, 15000);

    return () => clearInterval(id);
  }, [isRunning]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arfeen Locator</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <Text>Domain: {DOMAIN}</Text>
      <Text>Profile: {PROFILE_ID}</Text>
      <Text>Last sent: {lastSent ?? "never"}</Text>

      <View style={{ height: 20 }} />

      <Button
        title={isRunning ? "Stop auto tracking" : "Start auto tracking"}
        onPress={() => setIsRunning((v) => !v)}
      />

      <View style={{ height: 10 }} />

      <Button title="Send one ping now" onPress={sendOnce} />
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
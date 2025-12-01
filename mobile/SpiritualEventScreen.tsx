// mobile/src/screens/SpiritualEventScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native";
import { supabase } from "../lib/supabaseClient";

const EVENT_TYPES = [
  { key: "salah_haram", label: "Salah in Masjid al-Haram" },
  { key: "salah_hotel", label: "Salah in Hotel" },
  { key: "umrah", label: "Umrah Completed" },
  { key: "tawaf", label: "Tawaf" },
  { key: "rawdah_visit", label: "Rawdah Visit" },
  { key: "ziyarat_visit", label: "Ziyarat Visit" },
] as const;

type EventKey = (typeof EVENT_TYPES)[number]["key"];

type Props = {
  pilgrimId: string; // is screen ko call karte waqt pass karein
};

export default function SpiritualEventScreen({ pilgrimId }: Props) {
  const [selected, setSelected] = useState<EventKey | null>(null);
  const [prayerName, setPrayerName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!selected) {
      Alert.alert("Select event", "Please choose an event type.");
      return;
    }
    try {
      setLoading(true);
      const meta: any = {};
      if (selected === "salah_haram" || selected === "salah_hotel") {
        if (!prayerName) {
          Alert.alert("Prayer name", "Please enter prayer name (e.g. Fajr).");
          setLoading(false);
          return;
        }
        meta.prayer = prayerName;
      }
      if (notes) meta.notes = notes;

      const { error } = await supabase.from("pilgrim_spiritual_events").insert({
        pilgrim_id: pilgrimId,
        event_type: selected,
        meta,
      });

      if (error) {
        console.log(error);
        Alert.alert("Error", "Failed to add event.");
      } else {
        Alert.alert("Saved", "Event recorded successfully.");
        setPrayerName("");
        setNotes("");
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
        Add Spiritual Event
      </Text>

      <Text style={{ fontSize: 14, marginBottom: 8 }}>Select Event Type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {EVENT_TYPES.map((e) => (
          <TouchableOpacity
            key={e.key}
            onPress={() => setSelected(e.key)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: selected === e.key ? "#2563eb" : "#ccc",
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: selected === e.key ? "#2563eb" : "#111",
              }}
            >
              {e.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(selected === "salah_haram" || selected === "salah_hotel") && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, marginBottom: 4 }}>Prayer Name</Text>
          <TextInput
            placeholder="Fajr / Dhuhr / Asr / Maghrib / Isha"
            value={prayerName}
            onChangeText={setPrayerName}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              fontSize: 14,
            }}
          />
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 14, marginBottom: 4 }}>Notes (optional)</Text>
        <TextInput
          placeholder="Any extra notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 14,
            minHeight: 60,
            textAlignVertical: "top",
          }}
        />
      </View>

      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        style={{
          marginTop: 24,
          backgroundColor: "#2563eb",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {loading ? "Saving..." : "Save Event"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

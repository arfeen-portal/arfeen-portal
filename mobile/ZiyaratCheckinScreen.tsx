// @ts-nocheck

"use client";

import { createClient } from "@/lib/supabaseClient";

type Props = {
  pilgrimId: string;
};

export default function ZiyaratCheckinScreen({ pilgrimId }: Props) {
  const [sites, setSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    setLoadingSites(true);
    const { data, error } = await supabase
      .from("ziyarat_sites")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load ziyarat sites.");
    } else {
      setSites(data || []);
    }
    setLoadingSites(false);
  }

  function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function checkIn() {
    try {
      setChecking(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Location permission denied.");
        setChecking(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const nearby: any[] = [];

      for (const site of sites) {
        if (!site.lat || !site.lng) continue;
        const radius = site.radius_m || 150;
        const dist = distanceMeters(lat, lng, site.lat, site.lng);
        if (dist <= radius) nearby.push(site);
      }

      if (nearby.length === 0) {
        Alert.alert(
          "No Ziyarat Detected",
          "You are not inside any Ziyarat mission radius."
        );
        return;
      }

      for (const site of nearby) {
        await supabase.from("ziyarat_checkins").insert({
          pilgrim_id: pilgrimId,
          site_id: site.id,
        });

        await supabase.from("pilgrim_spiritual_events").insert({
          pilgrim_id: pilgrimId,
          event_type: "ziyarat_visit",
          meta: { site_id: site.id, site_name: site.name },
        });
      }

      const names = nearby.map((s) => s.name).join(", ");
      Alert.alert("Check-in Successful", `Missions completed: ${names}`);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to perform check-in.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 8 }}>
        Ziyarat Missions
      </Text>
      <Text style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        App aap ki current location se check karega ke aap kis Ziyarat mission
        ke andar ho – agar inside radius hue to mission auto complete ho jayega.
      </Text>

      <TouchableOpacity
        onPress={checkIn}
        disabled={checking || loadingSites}
        style={{
          backgroundColor: "#2563eb",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {checking ? "Checking..." : "Check-In Now"}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 8 }}>
        Active Ziyarat Sites
      </Text>

      {loadingSites ? (
        <Text style={{ fontSize: 13 }}>Loading sites...</Text>
      ) : (
        sites.map((s) => (
          <View
            key={s.id}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{s.name}</Text>
              <Text style={{ fontSize: 11, color: "#555" }}>{s.city}</Text>
            </View>
            <Text style={{ fontSize: 11, color: "#555" }}>
              Reward: {s.reward_points ?? 25} pts – Radius: {s.radius_m ?? 150}m
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

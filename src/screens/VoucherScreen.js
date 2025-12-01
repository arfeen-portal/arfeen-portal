import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function VoucherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Voucher</Text>
      <Text style={styles.text}>
        Yahan customer apna voucher dekh sakta hai:
        {'\n'}- Passenger details
        {'\n'}- Route, vehicle
        {'\n'}- QR code (live tracking)
        {'\n'}- Status: Pending / In-Progress / Completed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  text: { fontSize: 14, lineHeight: 20 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import BluetoothPairingModal from './BluetoothPairingModal';
import { bleManager } from './BluetoothManager';

export default function LegionellaForm({ onSave }: { onSave: (data: any) => void }) {
  // Bluetooth State
  const [isBleModalVisible, setIsBleModalVisible] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [liveTemp, setLiveTemp] = useState<number | null>(null);
  
  // Which field is currently receiving live data?
  const [activeTempField, setActiveTempField] = useState<'calorifier' | 'sentinelHot' | 'sentinelCold' | null>(null);

  // Form Data
  const [tankCondition, setTankCondition] = useState('');
  const [calorifierTemp, setCalorifierTemp] = useState(''); // Should be > 60
  const [sentinelHot, setSentinelHot] = useState(''); // Should be > 50
  const [sentinelCold, setSentinelCold] = useState(''); // Should be < 20
  const [deadLegs, setDeadLegs] = useState('No');

  useEffect(() => {
    if (connectedDeviceId) {
      // Listen to live data stream from hardware (Thermometer probe)
      const unsubscribe = bleManager.subscribeToData((tempReading) => {
        setLiveTemp(tempReading);
        if (activeTempField === 'calorifier') setCalorifierTemp(tempReading.toString());
        if (activeTempField === 'sentinelHot') setSentinelHot(tempReading.toString());
        if (activeTempField === 'sentinelCold') setSentinelCold(tempReading.toString());
      });

      return () => unsubscribe();
    }
  }, [connectedDeviceId, activeTempField]);

  const disconnectBle = () => {
    bleManager.disconnect();
    setConnectedDeviceId(null);
    setLiveTemp(null);
    setActiveTempField(null);
  };

  const getComplianceStatus = () => {
    const tCal = parseFloat(calorifierTemp) || 0;
    const tHot = parseFloat(sentinelHot) || 0;
    const tCold = parseFloat(sentinelCold) || 100;

    let failReasons = [];
    if (tCal < 60) failReasons.push("Calorifier < 60°C");
    if (tHot < 50) failReasons.push("Sentinel Hot < 50°C");
    if (tCold > 20) failReasons.push("Sentinel Cold > 20°C");
    if (deadLegs.toLowerCase() === 'yes') failReasons.push("Dead legs present");
    if (tankCondition.toLowerCase().includes('poor') || tankCondition.toLowerCase().includes('debris')) failReasons.push("Tank contamination");

    return failReasons.length === 0 ? "Compliant" : "Non-Compliant";
  };

  const handleSave = () => {
    const data = {
      tank_condition: tankCondition,
      calorifier_temp: parseFloat(calorifierTemp) || 0,
      sentinel_hot_temp: parseFloat(sentinelHot) || 0,
      sentinel_cold_temp: parseFloat(sentinelCold) || 0,
      dead_legs_present: deadLegs,
      status: getComplianceStatus(),
      hardware_used: connectedDeviceId || 'None',
    };
    onSave(data);
  };

  const status = getComplianceStatus();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Legionella Risk Assessment</Text>
      
      {/* Bluetooth Integration Bar */}
      <View style={styles.bleCard}>
        <View style={styles.bleHeader}>
          <Text style={styles.bleTitle}>Bluetooth Thermometer</Text>
          {connectedDeviceId ? (
            <TouchableOpacity onPress={disconnectBle}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={() => setIsBleModalVisible(true)}>
              <Text style={styles.connectBtnText}>Connect Probe</Text>
            </TouchableOpacity>
          )}
        </View>

        {connectedDeviceId && (
          <View style={styles.liveDataContainer}>
            <Text style={styles.connectedText}>Connected: {connectedDeviceId}</Text>
            {liveTemp !== null ? (
              <View style={styles.liveReadingBox}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveReadingText}>Live Temp: {liveTemp}°C</Text>
                {!activeTempField && <Text style={styles.autoFillText}>(Select a field below to capture)</Text>}
              </View>
            ) : (
              <ActivityIndicator color="#3b82f6" />
            )}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Cold Water Storage Tank</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Condition (e.g. Clean, Debris present)" 
          placeholderTextColor="#52525b"
          value={tankCondition} 
          onChangeText={setTankCondition} 
        />
        
        <Text style={styles.label}>Dead Legs Present? (Yes/No)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Yes/No" 
          placeholderTextColor="#52525b"
          value={deadLegs} 
          onChangeText={setDeadLegs} 
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Temperature Checks (°C)</Text>
        
        <TouchableOpacity onPress={() => setActiveTempField('calorifier')} style={[styles.tempRow, activeTempField === 'calorifier' && styles.activeTempRow]}>
          <Text style={styles.subLabel}>Calorifier / Cylinder (Target > 60°C)</Text>
          <TextInput 
            style={[styles.inputTemp, connectedDeviceId && activeTempField === 'calorifier' && styles.inputAutoFilled]} 
            value={calorifierTemp} 
            onChangeText={setCalorifierTemp} 
            keyboardType="numeric" 
            editable={!connectedDeviceId} 
            placeholder="0"
            placeholderTextColor="#52525b"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTempField('sentinelHot')} style={[styles.tempRow, activeTempField === 'sentinelHot' && styles.activeTempRow]}>
          <Text style={styles.subLabel}>Sentinel Hot Outlet (Target > 50°C)</Text>
          <TextInput 
            style={[styles.inputTemp, connectedDeviceId && activeTempField === 'sentinelHot' && styles.inputAutoFilled]} 
            value={sentinelHot} 
            onChangeText={setSentinelHot} 
            keyboardType="numeric" 
            editable={!connectedDeviceId}
            placeholder="0"
            placeholderTextColor="#52525b"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTempField('sentinelCold')} style={[styles.tempRow, activeTempField === 'sentinelCold' && styles.activeTempRow]}>
          <Text style={styles.subLabel}>Sentinel Cold Outlet (Target < 20°C)</Text>
          <TextInput 
            style={[styles.inputTemp, connectedDeviceId && activeTempField === 'sentinelCold' && styles.inputAutoFilled]} 
            value={sentinelCold} 
            onChangeText={setSentinelCold} 
            keyboardType="numeric" 
            editable={!connectedDeviceId}
            placeholder="0"
            placeholderTextColor="#52525b"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Compliance Status</Text>
        <Text style={[styles.bandText, status === 'Non-Compliant' ? styles.textRed : styles.textGreen]}>
          {status}
        </Text>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Assessment</Text>
      </TouchableOpacity>

      <BluetoothPairingModal 
        visible={isBleModalVisible} 
        onClose={() => setIsBleModalVisible(false)} 
        onDeviceConnected={setConnectedDeviceId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0B', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  bleCard: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', borderWidth: 1, padding: 16, borderRadius: 12, marginBottom: 20 },
  bleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bleTitle: { color: '#93c5fd', fontSize: 16, fontWeight: 'bold' },
  connectBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  connectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  disconnectText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  liveDataContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(59, 130, 246, 0.2)', paddingTop: 12 },
  connectedText: { color: '#fff', fontSize: 12, marginBottom: 8 },
  liveReadingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3b82f6' },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
  liveReadingText: { color: '#10b981', fontWeight: 'bold', fontSize: 16, flex: 1 },
  autoFillText: { color: '#6b7280', fontSize: 10, fontStyle: 'italic' },
  label: { color: '#a1a1aa', marginBottom: 8, fontSize: 16, fontWeight: '600' },
  subLabel: { color: '#a1a1aa', marginBottom: 8, fontSize: 14 },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', marginBottom: 24 },
  input: { backgroundColor: '#0A0A0B', color: '#fff', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12, marginBottom: 16 },
  inputTemp: { backgroundColor: '#0A0A0B', color: '#fff', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12, width: 80, textAlign: 'center' },
  inputAutoFilled: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', color: '#93c5fd' },
  tempRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 8, borderRadius: 8 },
  activeTempRow: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', borderWidth: 1 },
  scoreCard: { backgroundColor: '#18181b', padding: 24, borderRadius: 12, alignItems: 'center', borderColor: '#27272a', borderWidth: 1, marginBottom: 24 },
  scoreTitle: { color: '#a1a1aa', fontSize: 16 },
  bandText: { fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  textRed: { color: '#ef4444' },
  textGreen: { color: '#10b981' },
  saveBtn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

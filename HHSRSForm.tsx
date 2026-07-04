import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import BluetoothPairingModal from './BluetoothPairingModal';
import { bleManager } from './BluetoothManager';

const HAZARDS = [
  "Damp and mould growth", "Excess cold", "Excess heat", 
  "Asbestos and MMF", "Biocides", "CO and fuel combustion products", 
  "Lead", "Radiation", "Uncombusted fuel gas", 
  "Volatile organic compounds", "Crowding and space", "Entry by intruders", 
  "Lighting", "Noise", "Domestic hygiene, pests and refuse", 
  "Food safety", "Water supply", "Falls (All types combined)", 
  "Electrical hazards", "Fire and Hot Surfaces", 
  "Structural collapse and entrapment"
];

export default function HHSRSForm({ onSave }: { onSave: (data: any) => void }) {
  const [selectedHazard, setSelectedHazard] = useState(0); // 0 is "Damp and mould growth"
  const [likelihood, setLikelihood] = useState('56');
  const [classI, setClassI] = useState('0');
  const [classII, setClassII] = useState('0');
  const [classIII, setClassIII] = useState('0');
  const [classIV, setClassIV] = useState('0');
  
  // Costed Remedial Works Engine
  const [remedialAction, setRemedialAction] = useState('');
  const [remedialCost, setRemedialCost] = useState('');

  // Bluetooth State
  const [isBleModalVisible, setIsBleModalVisible] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [liveMoisture, setLiveMoisture] = useState<number | null>(null);

  useEffect(() => {
    if (connectedDeviceId) {
      // Auto-select "Damp and mould growth" if a Damp meter connects
      if (connectedDeviceId.includes('1A2B')) {
        setSelectedHazard(0);
      }

      // Listen to live data stream from hardware
      const unsubscribe = bleManager.subscribeToData((moistureLevel) => {
        setLiveMoisture(moistureLevel);
        autoFillDampScore(moistureLevel);
      });

      return () => unsubscribe();
    }
  }, [connectedDeviceId]);

  const autoFillDampScore = (moisture: number) => {
    // Translating raw hardware byte values to UK legal HHSRS severity metrics
    if (moisture > 80) { // Extreme damp
      setLikelihood('10'); // 1 in 10 chance of harm
      setClassI('30');
      setClassII('70');
      setClassIII('0');
      setClassIV('0');
    } else if (moisture > 40) { // Severe damp
      setLikelihood('56'); 
      setClassI('0');
      setClassII('50');
      setClassIII('50');
      setClassIV('0');
    } else { // Normal/Low moisture
      setLikelihood('316');
      setClassI('0');
      setClassII('0');
      setClassIII('10');
      setClassIV('90');
    }
  };

  const disconnectBle = () => {
    bleManager.disconnect();
    setConnectedDeviceId(null);
    setLiveMoisture(null);
  };

  const calculateScore = () => {
    const l = parseFloat(likelihood) || 1;
    const c1 = parseFloat(classI) || 0;
    const c2 = parseFloat(classII) || 0;
    const c3 = parseFloat(classIII) || 0;
    const c4 = parseFloat(classIV) || 0;

    if (c1 + c2 + c3 + c4 > 100) return 'Invalid %';
    
    const score1 = (10000 * (c1 / 100)) / l;
    const score2 = (1000 * (c2 / 100)) / l;
    const score3 = (300 * (c3 / 100)) / l;
    const score4 = (10 * (c4 / 100)) / l;
    
    const totalScore = score1 + score2 + score3 + score4;
    return totalScore.toFixed(2);
  };

  const getBand = (score: number) => {
    if (score >= 5000) return 'A (Cat 1)';
    if (score >= 2000) return 'B (Cat 1)';
    if (score >= 1000) return 'C (Cat 1)';
    if (score >= 500) return 'D (Cat 2)';
    if (score >= 220) return 'E (Cat 2)';
    if (score >= 100) return 'F (Cat 2)';
    if (score >= 50) return 'G (Cat 2)';
    if (score >= 20) return 'H (Cat 2)';
    if (score >= 10) return 'I (Cat 2)';
    return 'J (Cat 2)';
  };

  const handleSave = () => {
    const score = parseFloat(calculateScore());
    if (isNaN(score)) return;

    const data = {
      hazard: HAZARDS[selectedHazard],
      likelihood: parseFloat(likelihood),
      spread: { classI, classII, classIII, classIV },
      score,
      band: getBand(score),
      hardware_used: connectedDeviceId || 'None',
      hardware_reading: liveMoisture !== null ? `${liveMoisture}%` : 'N/A',
      remedial_action: remedialAction,
      remedial_cost: parseFloat(remedialCost) || 0
    };
    onSave(data);
  };

  const scoreStr = calculateScore();
  const scoreNum = parseFloat(scoreStr);
  const band = !isNaN(scoreNum) ? getBand(scoreNum) : '-';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HHSRS Hazard Assessment</Text>
      
      {/* Bluetooth Integration Bar */}
      <View style={styles.bleCard}>
        <View style={styles.bleHeader}>
          <Text style={styles.bleTitle}>Hardware Integration</Text>
          {connectedDeviceId ? (
            <TouchableOpacity onPress={disconnectBle}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={() => setIsBleModalVisible(true)}>
              <Text style={styles.connectBtnText}>Connect Tool (BLE)</Text>
            </TouchableOpacity>
          )}
        </View>

        {connectedDeviceId && (
          <View style={styles.liveDataContainer}>
            <Text style={styles.connectedText}>Connected: {connectedDeviceId}</Text>
            {liveMoisture !== null ? (
              <View style={styles.liveReadingBox}>
                <View style={styles.pulsingDot} />
                <Text style={styles.liveReadingText}>Live Moisture: {liveMoisture}%</Text>
                <Text style={styles.autoFillText}>(Auto-filling severity...)</Text>
              </View>
            ) : (
              <ActivityIndicator color="#3b82f6" />
            )}
          </View>
        )}
      </View>

      <Text style={styles.label}>Select Hazard (1-21)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hazardScroll}>
        {HAZARDS.map((h, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.hazardChip, selectedHazard === i && styles.hazardChipActive]}
            onPress={() => setSelectedHazard(i)}
          >
            <Text style={[styles.hazardText, selectedHazard === i && styles.hazardTextActive]}>
              {i + 1}. {h}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.label}>Likelihood (1 in X)</Text>
        <TextInput style={[styles.input, connectedDeviceId && styles.inputAutoFilled]} value={likelihood} onChangeText={setLikelihood} keyboardType="numeric" editable={!connectedDeviceId} />

        <Text style={styles.label}>Spread of Harm (%)</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.subLabel}>Class I (Extreme)</Text>
            <TextInput style={[styles.input, connectedDeviceId && styles.inputAutoFilled]} value={classI} onChangeText={setClassI} keyboardType="numeric" editable={!connectedDeviceId} />
          </View>
          <View style={styles.col}>
            <Text style={styles.subLabel}>Class II (Severe)</Text>
            <TextInput style={[styles.input, connectedDeviceId && styles.inputAutoFilled]} value={classII} onChangeText={setClassII} keyboardType="numeric" editable={!connectedDeviceId} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.subLabel}>Class III (Serious)</Text>
            <TextInput style={[styles.input, connectedDeviceId && styles.inputAutoFilled]} value={classIII} onChangeText={setClassIII} keyboardType="numeric" editable={!connectedDeviceId} />
          </View>
          <View style={styles.col}>
            <Text style={styles.subLabel}>Class IV (Moderate)</Text>
            <TextInput style={[styles.input, connectedDeviceId && styles.inputAutoFilled]} value={classIV} onChangeText={setClassIV} keyboardType="numeric" editable={!connectedDeviceId} />
          </View>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Total Hazard Score</Text>
        <Text style={styles.scoreValue}>{scoreStr}</Text>
        <Text style={[styles.bandText, band.includes('Cat 1') ? styles.textRed : styles.textOrange]}>
          Band {band}
        </Text>
      </View>

      {/* Costed Remedial Works - Dynamic Injection based on severity */}
      {(band.includes('Cat 1') || band.includes('Cat 2')) && (
        <View style={styles.remedialCard}>
          <Text style={styles.remedialTitle}>Statutory Remedial Works</Text>
          <Text style={styles.label}>Action Required</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., Install PIV unit, Repair structural crack" 
            placeholderTextColor="#52525b"
            value={remedialAction} 
            onChangeText={setRemedialAction} 
          />
          
          <Text style={styles.label}>Estimated Cost (£)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., 850" 
            placeholderTextColor="#52525b"
            value={remedialCost} 
            onChangeText={setRemedialCost} 
            keyboardType="numeric" 
          />
        </View>
      )}

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
  subLabel: { color: '#a1a1aa', marginBottom: 4, fontSize: 12 },
  hazardScroll: { marginBottom: 24, maxHeight: 40 },
  hazardChip: { backgroundColor: '#18181b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#27272a' },
  hazardChipActive: { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: '#8b5cf6' },
  hazardText: { color: '#a1a1aa' },
  hazardTextActive: { color: '#8b5cf6', fontWeight: 'bold' },
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', marginBottom: 24 },
  input: { backgroundColor: '#0A0A0B', color: '#fff', borderWidth: 1, borderColor: '#27272a', borderRadius: 8, padding: 12, marginBottom: 16 },
  inputAutoFilled: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.05)', color: '#93c5fd' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  scoreCard: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: 24, borderRadius: 12, alignItems: 'center', borderColor: '#3b82f6', borderWidth: 1, marginBottom: 24 },
  scoreTitle: { color: '#93c5fd', fontSize: 16 },
  scoreValue: { color: '#fff', fontSize: 48, fontWeight: '900', marginVertical: 8 },
  bandText: { fontSize: 20, fontWeight: 'bold' },
  textRed: { color: '#ef4444' },
  textOrange: { color: '#f59e0b' },
  remedialCard: { backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b', marginBottom: 24 },
  remedialTitle: { color: '#fcd34d', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  saveBtn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

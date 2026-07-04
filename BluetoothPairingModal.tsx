import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { bleManager, BLEDevice } from './BluetoothManager';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDeviceConnected: (deviceId: string) => void;
}

export default function BluetoothPairingModal({ visible, onClose, onDeviceConnected }: Props) {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDevices([]);
      setIsScanning(true);
      bleManager.startDeviceScan((device) => {
        setDevices(prev => {
          if (prev.find(d => d.id === device.id)) return prev;
          return [...prev, device];
        });
      });
    } else {
      bleManager.stopDeviceScan();
    }
  }, [visible]);

  const handleConnect = async (deviceId: string) => {
    setConnectingId(deviceId);
    const success = await bleManager.connectToDevice(deviceId);
    if (success) {
      onDeviceConnected(deviceId);
      onClose();
    }
    setConnectingId(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Nearby Hardware</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {isScanning && (
            <View style={styles.scanningIndicator}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={styles.scanningText}>Scanning for BLE devices...</Text>
            </View>
          )}

          <FlatList
            data={devices}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.deviceItem, connectingId === item.id && styles.deviceItemConnecting]}
                onPress={() => handleConnect(item.id)}
                disabled={connectingId !== null}
              >
                <View>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceId}>{item.id} • Signal: {item.rssi}dBm</Text>
                </View>
                {connectingId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.connectText}>Connect</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !isScanning ? <Text style={styles.emptyText}>No devices found.</Text> : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  scanningText: {
    color: '#3b82f6',
    marginLeft: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceItemConnecting: {
    backgroundColor: '#3b82f6',
  },
  deviceName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deviceId: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 4,
  },
  connectText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 20,
  }
});

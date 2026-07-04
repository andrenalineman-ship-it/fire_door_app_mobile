import { Platform } from 'react-native';

export interface BLEDevice {
  id: string;
  name: string | null;
  rssi: number;
}

// In a physical environment, we would use:
// import { BleManager, Device } from 'react-native-ble-plx';
// const manager = new BleManager();

// For this development environment, we will simulate a robust BleManager
// so the UI and Forms can be built and tested without needing physical compilation yet.
class BluetoothManagerSimulator {
  private isScanning = false;
  private connectedDeviceId: string | null = null;
  private listeners: ((data: number) => void)[] = [];

  // Simulated hardware around the inspector
  private MOCK_DEVICES: BLEDevice[] = [
    { id: 'BLE-1A2B', name: 'Protimeter Surveymaster (Damp)', rssi: -45 },
    { id: 'BLE-9F3C', name: 'Leica DISTO (Laser)', rssi: -60 },
    { id: 'BLE-4D5E', name: 'Flir E8 (Thermal)', rssi: -75 },
  ];

  startDeviceScan(onDeviceFound: (device: BLEDevice) => void) {
    if (this.isScanning) return;
    this.isScanning = true;
    
    // Simulate discovering devices over time
    this.MOCK_DEVICES.forEach((device, index) => {
      setTimeout(() => {
        if (this.isScanning) onDeviceFound(device);
      }, (index + 1) * 800);
    });
  }

  stopDeviceScan() {
    this.isScanning = false;
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    this.stopDeviceScan();
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connectedDeviceId = deviceId;
        // Start streaming simulated damp meter data if it's the Protimeter
        if (deviceId.includes('1A2B')) {
          this.simulateDataStream();
        }
        resolve(true);
      }, 1500); // simulate connection delay
    });
  }

  disconnect() {
    this.connectedDeviceId = null;
    this.listeners = [];
  }

  // Simulates reading a characteristic stream (e.g. moisture % from 10 to 60)
  private simulateDataStream() {
    let baseMoisture = 20;
    const interval = setInterval(() => {
      if (!this.connectedDeviceId) {
        clearInterval(interval);
        return;
      }
      
      // Fluctuate the moisture reading randomly between -2 and +5
      const fluctuation = (Math.random() * 7) - 2;
      baseMoisture = Math.max(0, Math.min(100, baseMoisture + fluctuation));
      
      this.listeners.forEach(listener => listener(Math.round(baseMoisture)));
    }, 1000); // 1Hz refresh rate from hardware
  }

  subscribeToData(callback: (data: number) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const bleManager = new BluetoothManagerSimulator();

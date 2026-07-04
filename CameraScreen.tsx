import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

export default function CameraScreen({ onPhotoTaken }: { onPhotoTaken: (uri: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setPhotoUri(photo.uri);
      }
    }
  };

  const acceptPhoto = () => {
    if (photoUri) {
      onPhotoTaken(photoUri);
    }
  };

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotoUri(null)}>
            <Text style={styles.btnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptPhoto}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white'
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginBottom: 40,
  },
  captureButton: {
    alignSelf: 'flex-end',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  retakeBtn: {
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  acceptBtn: {
    padding: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, ImageBackground, TouchableOpacity, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface AnnotationCanvasProps {
  photoUri: string;
  onSave: (annotatedData: string) => void;
  onCancel: () => void;
}

export default function AnnotationCanvas({ photoUri, onSave, onCancel }: AnnotationCanvasProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        setPaths((prev) => [...prev, currentPath]);
        setCurrentPath('');
      },
    })
  ).current;

  const undo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    // In a full implementation, you would capture the View as an image (e.g. react-native-view-shot)
    // For now, we pass the original URI. The drawing vectors can be serialized to JSON and saved alongside the image in S3/Neon.
    onSave(photoUri);
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: photoUri }} style={styles.imageBackground} resizeMode="contain">
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((p, index) => (
              <Path key={index} d={p} stroke="#ef4444" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPath ? (
              <Path d={currentPath} stroke="#ef4444" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </Svg>
        </View>
      </ImageBackground>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.btn} onPress={onCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={undo}>
          <Text style={styles.btnText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageBackground: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#111',
  },
  btn: {
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

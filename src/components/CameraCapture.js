import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors } from '../theme';

export default function CameraCapture({ onCapture, label, disabled }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [visible, setVisible] = useState(false);
  const cameraRef = useRef(null);

  const open = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permission required', 'Camera access is needed for face capture.');
        return;
      }
    }
    setVisible(true);
  };

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );
      onCapture(`data:image/jpeg;base64,${resized.base64}`);
      setVisible(false);
    } catch (e) {
      Alert.alert('Capture failed', e.message);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, disabled && styles.btnDisabled]}
        onPress={open}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.btnText}>{label || 'Capture Face'}</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide">
        <View style={styles.modal}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front">
            <View style={styles.overlay}>
              <View style={styles.faceGuide} />
            </View>
          </CameraView>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={capture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>

          <Text style={styles.hint}>
            Centre your face within the oval  •  Ensure good lighting
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  btnDisabled: { opacity: 0.4 },
  icon: { fontSize: 18, marginRight: 10 },
  btnText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  modal: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 200,
    height: 260,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: colors.cyan,
    borderStyle: 'dashed',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 20,
    backgroundColor: '#111',
  },
  cancelBtn: { width: 80, alignItems: 'center' },
  cancelText: { color: colors.grey, fontSize: 14 },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
  hint: {
    color: colors.grey,
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 16,
    backgroundColor: '#111',
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, shadows } from '../theme';

// status: 'idle' | 'checking' | 'success' | 'fail' | 'unavailable'

export default function FingerprintPrompt({ onResult, disabled }) {
  const [promptStatus, setPromptStatus] = useState('idle');
  const [failReason, setFailReason]     = useState('');

  const triggerPrompt = async () => {
    setPromptStatus('checking');
    setFailReason('');

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        const reason = !hasHardware
          ? 'This device has no biometric hardware.'
          : 'No biometrics enrolled on this device. Enroll a fingerprint in Settings.';
        setPromptStatus('unavailable');
        setFailReason(reason);
        onResult({ success: false, reason });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:          'Verify your fingerprint',
        cancelLabel:            'Cancel',
        disableDeviceFallback:  false,
      });

      if (result.success) {
        setPromptStatus('success');
        onResult({ success: true });
      } else {
        const reason = result.error === 'user_cancel' ? 'Cancelled by user.' : (result.error || 'Fingerprint not recognised.');
        setPromptStatus('fail');
        setFailReason(reason);
        onResult({ success: false, reason });
      }
    } catch (e) {
      setPromptStatus('fail');
      setFailReason(e.message);
      onResult({ success: false, reason: e.message });
    }
  };

  const reset = () => {
    setPromptStatus('idle');
    setFailReason('');
  };

  return (
    <View style={styles.container}>
      {/* Status display */}
      {promptStatus === 'success' && (
        <View style={styles.resultBadge}>
          <Text style={styles.resultIcon}>✓</Text>
          <Text style={styles.resultTextSuccess}>Fingerprint Verified</Text>
          <TouchableOpacity onPress={reset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {(promptStatus === 'fail' || promptStatus === 'unavailable') && (
        <View style={[styles.resultBadge, styles.resultBadgeFail]}>
          <Text style={styles.resultIcon}>✕</Text>
          <Text style={styles.resultTextFail} numberOfLines={2}>{failReason}</Text>
          <TouchableOpacity onPress={reset} style={[styles.resetBtn, styles.resetBtnFail]}>
            <Text style={styles.resetText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Prompt button */}
      {promptStatus !== 'success' && (
        <TouchableOpacity
          style={[styles.btn, (disabled || promptStatus === 'checking') && styles.btnDisabled]}
          onPress={triggerPrompt}
          disabled={disabled || promptStatus === 'checking'}
          activeOpacity={0.8}
        >
          {promptStatus === 'checking' ? (
            <ActivityIndicator color={colors.white} size="small" style={styles.spinner} />
          ) : (
            <Text style={styles.fpIcon}>☝</Text>
          )}
          <Text style={styles.btnText}>
            {promptStatus === 'checking' ? 'Waiting for biometric…' : 'Scan Fingerprint'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 10 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cyan,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  btnDisabled: { opacity: 0.4 },
  fpIcon: { fontSize: 20, marginRight: 10, color: colors.white },
  spinner: { marginRight: 10 },
  btnText: { color: colors.white, fontSize: 14, fontWeight: '600' },

  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3d1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  resultBadgeFail: { backgroundColor: '#3d1a1a' },
  resultIcon: { fontSize: 16, marginRight: 8, color: '#4CAF50' },
  resultTextSuccess: { flex: 1, color: '#4CAF50', fontSize: 13, fontWeight: '700' },
  resultTextFail: { flex: 1, color: colors.danger, fontSize: 12 },

  resetBtn: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  resetBtnFail: { borderColor: colors.danger },
  resetText: { color: colors.white, fontSize: 11 },
});

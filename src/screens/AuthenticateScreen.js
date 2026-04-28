import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, Alert,
} from 'react-native';
import { colors, fonts, shadows } from '../theme';
import PinInput from '../components/PinInput';
import CameraCapture from '../components/CameraCapture';
import FingerprintPrompt from '../components/FingerprintPrompt';
import { authenticateUser } from '../api/mfbasApi';

const METHODS = [
  {
    id: 'face',
    icon: '👁',
    title: 'Face Recognition',
    desc: 'Take a live photo. Your face is compared to your enrolled template.',
    accent: colors.navy,
    bg: colors.navySubtle,
  },
  {
    id: 'fingerprint',
    icon: '☝',
    title: 'Fingerprint',
    desc: 'Your device scans your fingerprint. No biometric data is sent to the server.',
    accent: '#00897B',
    bg: '#E0F2F1',
  },
];

export default function AuthenticateScreen({ navigation }) {
  const [mode, setMode]                                 = useState('face');
  const [username, setUsername]                         = useState('');
  const [pin, setPin]                                   = useState('');
  const [image, setImage]                               = useState(null);
  const [fingerprintConfirmed, setFingerprintConfirmed] = useState(false);
  const [loading, setLoading]                           = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setImage(null);
    setFingerprintConfirmed(false);
  };

  const biometricReady = mode === 'face' ? !!image : fingerprintConfirmed;
  const canSubmit = username.trim().length > 0 && pin.length === 6 && biometricReady;

  const handleAuth = async () => {
    setLoading(true);
    try {
      const imageB64 = mode === 'face' ? image.split(',')[1] : null;
      const { status, data } = await authenticateUser(
        username.trim(), pin, imageB64,
        mode === 'fingerprint' ? fingerprintConfirmed : false,
      );
      navigation.navigate('Result', {
        type: 'authenticate', httpStatus: status, data,
        username: username.trim(), mode,
      });
    } catch (e) {
      Alert.alert('Network error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const selected = METHODS.find(m => m.id === mode);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={s.pageTitle}>Sign In</Text>
        <Text style={s.pageSubtitle}>
          Choose how you want to prove your identity, then enter your PIN.
        </Text>

        {/* Biometric method selector */}
        <Text style={s.sectionLabel}>Identity method</Text>
        <View style={s.methodRow}>
          {METHODS.map(m => {
            const active = mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.methodCard, active && { borderColor: m.accent, backgroundColor: m.bg }]}
                onPress={() => switchMode(m.id)}
                activeOpacity={0.8}
              >
                <Text style={s.methodIcon}>{m.icon}</Text>
                <Text style={[s.methodName, active && { color: m.accent }]}>{m.title}</Text>
                {active && (
                  <View style={[s.methodCheck, { backgroundColor: m.accent }]}>
                    <Text style={s.methodCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected method explanation */}
        <View style={[s.methodBanner, { borderLeftColor: selected.accent, backgroundColor: selected.bg }]}>
          <Text style={[s.methodBannerTitle, { color: selected.accent }]}>{selected.title}</Text>
          <Text style={s.methodBannerDesc}>{selected.desc}</Text>
          <View style={s.factorRow}>
            <View style={[s.factorChip, { borderColor: selected.accent }]}>
              <Text style={[s.factorChipText, { color: selected.accent }]}>Factor 1 — Biometric</Text>
            </View>
            <View style={[s.factorChip, { borderColor: '#5C6BC0' }]}>
              <Text style={[s.factorChipText, { color: '#5C6BC0' }]}>Factor 2 — PIN</Text>
            </View>
          </View>
        </View>

        {/* Account field */}
        <Text style={s.sectionLabel}>Account</Text>
        <TextInput
          style={s.textInput}
          placeholder="Your username"
          placeholderTextColor={colors.greyMid}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Biometric capture */}
        <Text style={s.sectionLabel}>
          {mode === 'face' ? 'Face scan' : 'Fingerprint scan'}
        </Text>
        {mode === 'face' ? (
          <View>
            {image ? (
              <View style={s.capturedRow}>
                <View style={s.capturedBadge}>
                  <Text style={s.capturedText}>Face captured</Text>
                </View>
                <TouchableOpacity onPress={() => setImage(null)} style={s.retakeBtn}>
                  <Text style={s.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={s.captureHint}>Take a photo facing the camera directly.</Text>
            )}
            <CameraCapture
              label={image ? 'Take another photo' : 'Open camera'}
              onCapture={setImage}
            />
          </View>
        ) : (
          <View>
            <Text style={s.captureHint}>
              Tap the button below — your device will prompt you to scan your fingerprint.
            </Text>
            <FingerprintPrompt onResult={(r) => setFingerprintConfirmed(r.success)} />
          </View>
        )}

        {/* PIN */}
        <Text style={s.sectionLabel}>PIN</Text>
        <PinInput value={pin} onChange={setPin} />

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && s.submitDisabled]}
          onPress={handleAuth}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={s.submitText}>Sign in</Text>
          }
        </TouchableOpacity>

        {/* Info note */}
        <Text style={s.infoNote}>
          Both factors must pass for access to be granted. A failed attempt increases your lockout counter.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, alignSelf: 'flex-start' },
  backArrow: { fontSize: 22, color: colors.navy, fontFamily: fonts.regular, marginRight: 6 },
  backLabel: { fontSize: 16, color: colors.navy, fontFamily: fonts.semiBold },

  pageTitle:    { fontSize: 30, fontFamily: fonts.bold, color: colors.text, marginTop: 22, marginBottom: 8 },
  pageSubtitle: { fontSize: 15, fontFamily: fonts.regular, color: colors.textSub, lineHeight: 23, marginBottom: 28 },

  sectionLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textSub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 22,
  },

  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  methodCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    ...shadows.card,
  },
  methodIcon: { fontSize: 26, marginBottom: 6 },
  methodName: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSub, textAlign: 'center' },
  methodCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCheckText: { fontSize: 11, color: colors.white, fontFamily: fonts.bold },

  methodBanner: {
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 16,
    marginBottom: 4,
  },
  methodBannerTitle: { fontSize: 15, fontFamily: fonts.semiBold, marginBottom: 6 },
  methodBannerDesc:  { fontSize: 13, fontFamily: fonts.regular, color: colors.textSub, lineHeight: 20, marginBottom: 12 },
  factorRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  factorChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  factorChipText: { fontSize: 11, fontFamily: fonts.medium, letterSpacing: 0.2 },

  textInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.white,
  },

  capturedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: '#A7D9B8',
  },
  capturedText: { fontSize: 14, fontFamily: fonts.medium, color: colors.success },
  retakeBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: { fontSize: 13, fontFamily: fonts.medium, color: colors.navy },

  captureHint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSub,
    lineHeight: 20,
    marginBottom: 10,
  },

  submitBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
    ...shadows.strong,
  },
  submitDisabled: { opacity: 0.35 },
  submitText: { fontSize: 17, fontFamily: fonts.semiBold, color: colors.white, letterSpacing: 0.2 },

  infoNote: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.greyMid,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, ScrollView, SafeAreaView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors, fonts, shadows, buttonStyles } from '../theme';
import PinInput from '../components/PinInput';
import CameraCapture from '../components/CameraCapture';
import { enrollUser } from '../api/mfbasApi';

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Step 1 of 7',  title: 'Choose a username',         hint: 'Pick a unique name for your account. You will use this every time you sign in.' },
  { id: 2, label: 'Step 2 of 7',  title: 'Set your PIN',              hint: 'Choose a 6-digit PIN. It is stored as a secure hash and never readable by anyone.' },
  { id: 3, label: 'Step 3 of 7',  title: 'Face photo — front view',   hint: 'Look straight into the camera with a neutral expression. Good lighting makes a big difference.' },
  { id: 4, label: 'Step 4 of 7',  title: 'Face photo — looking left', hint: 'Turn your head gently to the left. A small rotation of about 15 to 20 degrees is enough.' },
  { id: 5, label: 'Step 5 of 7',  title: 'Face photo — looking right', hint: 'Now turn your head gently to the right. Same amount as before.' },
  { id: 6, label: 'Step 6 of 7',  title: 'Fingerprint login',         hint: 'Turning this on lets you sign in with your fingerprint and PIN instead of your face and PIN.' },
  { id: 7, label: 'Step 7 of 7',  title: 'Review and confirm',        hint: 'Take a moment to check your details before creating your account.' },
];
const TOTAL = STEPS.length;
const FACE_LABELS = ['Front view', 'Looking left', 'Looking right'];

export default function EnrollScreen({ navigation }) {
  const [step, setStep]                             = useState(1);
  const [username, setUsername]                     = useState('');
  const [pin, setPin]                               = useState('');
  const [images, setImages]                         = useState([null, null, null]);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [loading, setLoading]                       = useState(false);
  const scrollRef = useRef(null);

  // Scroll to top whenever step changes
  const goTo = (s) => { setStep(s); scrollRef.current?.scrollTo({ y: 0, animated: false }); };
  const next = () => goTo(Math.min(step + 1, TOTAL));
  const back = () => { if (step === 1) navigation.goBack(); else goTo(step - 1); };

  const setImage = (index, uri) =>
    setImages(prev => { const n = [...prev]; n[index] = uri; return n; });

  // Per-step "can continue" gate
  const canContinue = (() => {
    if (step === 1) return username.trim().length > 0;
    if (step === 2) return pin.length === 6;
    if (step === 3) return !!images[0];
    if (step === 4) return !!images[1];
    if (step === 5) return !!images[2];
    return true; // steps 6 & 7
  })();

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const b64s = images.map(img => img.split(',')[1]);
      const { status, data } = await enrollUser(username.trim(), pin, b64s, fingerprintEnabled);
      navigation.navigate('Result', { type: 'enroll', httpStatus: status, data, username: username.trim() });
    } catch (e) {
      Alert.alert('Network Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const info = STEPS[step - 1];

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Fixed header ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={back} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backLabel}>{step === 1 ? 'Home' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={s.stepCounter}>{step} / {TOTAL}</Text>
      </View>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(step / TOTAL) * 100}%` }]} />
      </View>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step label pill */}
          <View style={s.labelPill}>
            <Text style={s.labelText}>{info.label}</Text>
          </View>

          {/* Title + hint */}
          <Text style={s.title}>{info.title}</Text>
          <Text style={s.hint}>{info.hint}</Text>

          {/* ── Step content ──────────────────────────────────────────────── */}
          <View style={s.content}>
            {step === 1 && <StepUsername username={username} onChange={setUsername} />}
            {step === 2 && <StepPin pin={pin} onChange={setPin} />}
            {(step === 3 || step === 4 || step === 5) && (
              <StepFace
                index={step - 3}
                image={images[step - 3]}
                label={FACE_LABELS[step - 3]}
                onCapture={(uri) => setImage(step - 3, uri)}
              />
            )}
            {step === 6 && (
              <StepFingerprint
                enabled={fingerprintEnabled}
                onToggle={setFingerprintEnabled}
              />
            )}
            {step === 7 && (
              <StepReview
                username={username}
                pin={pin}
                images={images}
                fingerprintEnabled={fingerprintEnabled}
              />
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Fixed footer buttons ──────────────────────────────────────────── */}
      <View style={s.footer}>
        {step > 1 && (
          <TouchableOpacity style={[s.btnOutline, { flex: 1, marginRight: 10 }]} onPress={back} activeOpacity={0.8}>
            <Text style={s.btnOutlineText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < TOTAL ? (
          <TouchableOpacity
            style={[s.btnPrimary, { flex: step > 1 ? 2 : 1 }, !canContinue && s.btnDisabled]}
            onPress={next}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text style={s.btnPrimaryText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.btnPrimary, { flex: 2 }, loading && s.btnDisabled]}
            onPress={handleEnroll}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={s.btnPrimaryText}>Enroll</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Step sub-components ───────────────────────────────────────────────────────

function StepUsername({ username, onChange }) {
  return (
    <TextInput
      style={step_s.textInput}
      placeholder="e.g. alice"
      placeholderTextColor={colors.greyMid}
      value={username}
      onChangeText={onChange}
      autoCapitalize="none"
      autoCorrect={false}
      autoFocus
      returnKeyType="done"
    />
  );
}

function StepPin({ pin, onChange }) {
  return (
    <View>
      <Text style={step_s.pinLabel}>Enter 6 digits</Text>
      <PinInput value={pin} onChange={onChange} />
    </View>
  );
}

function StepFace({ index, image, label, onCapture }) {
  return (
    <View style={step_s.faceContainer}>
      {/* Oval guide */}
      <View style={step_s.ovalGuide}>
        <Text style={step_s.ovalIcon}>🤳</Text>
        <Text style={step_s.ovalLabel}>{label} angle</Text>
      </View>
      {/* Capture state */}
      {image ? (
        <View style={step_s.capturedCard}>
          <Text style={step_s.capturedIcon}>✓</Text>
          <Text style={step_s.capturedMsg}>Image captured</Text>
        </View>
      ) : null}
      <CameraCapture
        label={image ? `Retake ${label}` : `Capture ${label} Photo`}
        onCapture={onCapture}
      />
    </View>
  );
}

function StepFingerprint({ enabled, onToggle }) {
  return (
    <View>
      <View style={step_s.fpRow}>
        <View style={step_s.fpInfo}>
          <Text style={step_s.fpTitle}>Fingerprint + PIN</Text>
          <Text style={step_s.fpDesc}>
            Authenticate using your device biometric instead of face recognition.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.greyLight, true: colors.cyan }}
          thumbColor={colors.white}
        />
      </View>
      {enabled && (
        <View style={step_s.fpActive}>
          <Text style={step_s.fpActiveText}>
            Fingerprint login is enabled. You can still use Face + PIN at any time.
          </Text>
        </View>
      )}
      {!enabled && (
        <View style={step_s.fpInactive}>
          <Text style={step_s.fpInactiveText}>
            Your account will use Face + PIN only.
          </Text>
        </View>
      )}
    </View>
  );
}

function StepReview({ username, pin, images, fingerprintEnabled }) {
  return (
    <View style={step_s.reviewCard}>
      <ReviewRow label="Username" value={username} />
      <ReviewRow label="PIN" value="● ● ● ● ● ●" mono />
      <ReviewRow label="Face photos" value={`${images.filter(Boolean).length} of 3 taken`} />
      <ReviewRow label="Fingerprint login" value={fingerprintEnabled ? 'Turned on' : 'Turned off'} accent={fingerprintEnabled} />
    </View>
  );
}

function ReviewRow({ label, value, mono, accent }) {
  return (
    <View style={step_s.reviewRow}>
      <Text style={step_s.reviewKey}>{label}</Text>
      <Text style={[step_s.reviewVal, mono && step_s.reviewMono, accent && { color: colors.cyan }]}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
  },
  backArrow: {
    fontSize: 22,
    color: colors.navy,
    fontFamily: fonts.regular,
    marginRight: 6,
  },
  backLabel: {
    fontSize: 16,
    color: colors.navy,
    fontFamily: fonts.semiBold,
  },
  stepCounter: {
    fontSize: 12,
    color: colors.grey,
    fontFamily: fonts.medium,
    letterSpacing: 0.5,
  },

  progressTrack: {
    height: 3,
    backgroundColor: colors.greyLight,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.navy,
    borderRadius: 2,
  },

  scroll: { paddingHorizontal: 24, paddingBottom: 16 },

  labelPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navySubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  labelText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: colors.navy,
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 36,
  },
  hint: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSub,
    lineHeight: 22,
    marginBottom: 32,
  },

  content: { },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },

  btnPrimary: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: 0.2,
  },
  btnOutline: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  btnOutlineText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.navy,
    letterSpacing: 0.2,
  },
  btnDisabled: { opacity: 0.35 },
});

const step_s = StyleSheet.create({
  // Username
  textInput: {
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 17,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.white,
  },

  // PIN
  pinLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSub,
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  // Face
  faceContainer: { gap: 16 },
  ovalGuide: {
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.navySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  ovalIcon:  { fontSize: 44, marginBottom: 8 },
  ovalLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.textSub },

  capturedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#A7D9B8',
  },
  capturedIcon: { fontSize: 18, color: colors.success },
  capturedMsg:  { fontSize: 14, fontFamily: fonts.medium, color: colors.success },

  // Fingerprint
  fpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  fpInfo:  { flex: 1, marginRight: 14 },
  fpTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text, marginBottom: 4 },
  fpDesc:  { fontSize: 13, fontFamily: fonts.regular, color: colors.textSub, lineHeight: 19 },
  fpActive: {
    backgroundColor: colors.cyanLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#9AE3EF',
  },
  fpActiveText:   { fontSize: 13, fontFamily: fonts.regular, color: '#007A8E', lineHeight: 19 },
  fpInactive:     { backgroundColor: colors.offWhite, borderRadius: 12, padding: 14 },
  fpInactiveText: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSub },

  // Review
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.card,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewKey:  { width: 120, fontSize: 13, fontFamily: fonts.medium, color: colors.textSub },
  reviewVal:  { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text },
  reviewMono: { fontFamily: fonts.medium, letterSpacing: 3 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, shadows } from '../theme';
import PinInput from '../components/PinInput';
import CameraCapture from '../components/CameraCapture';
import { authenticateUser } from '../api/mfbasApi';

export default function AuthenticateScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && pin.length === 6 && image;

  const handleAuth = async () => {
    setLoading(true);
    try {
      const b64 = image.split(',')[1];
      const { status, data } = await authenticateUser(username.trim(), pin, b64);
      navigation.navigate('Result', {
        type: 'authenticate',
        httpStatus: status,
        data,
        username: username.trim(),
      });
    } catch (e) {
      Alert.alert('Network Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>3.2  POST /api/biometric/authenticate/</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Dual-gate info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoTitle}>Dual-Gate Authentication</Text>
          <View style={styles.gateRow}>
            <View style={styles.gate}>
              <Text style={styles.gateNum}>GATE 1</Text>
              <Text style={styles.gateName}>FACE</Text>
              <Text style={styles.gateDesc}>Cosine similarity ≥ 0.82{'\n'}(FaceNet embedding)</Text>
            </View>
            <Text style={styles.gateAnd}>AND</Text>
            <View style={styles.gate}>
              <Text style={styles.gateNum}>GATE 2</Text>
              <Text style={styles.gateName}>PIN</Text>
              <Text style={styles.gateDesc}>bcrypt constant-time{'\n'}verification</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Request Body</Text>
        </View>

        <View style={styles.codeBlock}>
          <View style={styles.codeBlockBar}>
            <Text style={styles.codeBlockLabel}>Auth request — application/json</Text>
          </View>
          <View style={styles.codeFields}>
            <Text style={styles.fieldKey}>"username":</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder='"alice"'
              placeholderTextColor={colors.grey}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.separator} />
            <Text style={styles.fieldKey}>"pin":</Text>
            <View style={styles.pinWrapper}>
              <PinInput value={pin} onChange={setPin} />
            </View>
            <View style={styles.separator} />
            <Text style={styles.fieldKey}>"image_b64":</Text>
            <Text style={styles.fieldComment}>
              {'  '}// Single live face capture — frontal preferred
            </Text>
            {image ? (
              <View style={styles.capturedRow}>
                <View style={styles.capturedBadge}>
                  <Text style={styles.capturedText}>✓ Face Captured</Text>
                </View>
                <TouchableOpacity onPress={() => setImage(null)} style={styles.retakeBtn}>
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <CameraCapture
              label={image ? 'Recapture Face' : 'Capture Live Face'}
              onCapture={setImage}
            />
          </View>
        </View>

        {/* Success response reference */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Success Response — HTTP 200</Text>
        </View>
        <View style={styles.responseBlock}>
          <View style={[styles.responseBar, { backgroundColor: '#1a5c1a' }]}>
            <Text style={styles.responseBarText}>200 OK</Text>
          </View>
          <Text style={styles.responseCode}>{`{
  "authenticated": true,
  "user_id":       "<uuid>",
  "username":      "alice",
  "similarity":    0.9341,
  "message":       "Authentication successful. Session granted."
}`}</Text>
        </View>

        {/* Failure responses table */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Failure Responses</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 0.5 }]}>HTTP</Text>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Condition</Text>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2.5 }]}>Key fields</Text>
          </View>
          {[
            ['401', 'Face gate failed (similarity < threshold)', 'authenticated: false, similarity, threshold'],
            ['401', 'PIN gate failed', "authenticated: false, reason: 'Incorrect PIN.'"],
            ['403', 'Account locked out', 'authenticated: false, reason, lockout_until'],
            ['404', 'Username not found', "error: 'User not found.'"],
          ].map(([code, cond, key], i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.codeText, { flex: 0.5 }]}>{code}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{cond}</Text>
              <Text style={[styles.tableCell, styles.monoText, { flex: 2.5 }]}>{key}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleAuth}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>POST  /api/biometric/authenticate/</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  pageHeader: {
    backgroundColor: colors.navy,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  back: { marginBottom: 6 },
  backText: { color: colors.cyan, fontSize: 14, fontWeight: '600' },
  pageTitle: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  scroll: { padding: 16 },

  infoBanner: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  infoTitle: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  gateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gate: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.navyLight,
    borderRadius: 10,
    padding: 12,
  },
  gateNum: {
    color: colors.grey,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  gateName: {
    color: colors.cyan,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  gateDesc: {
    color: '#8AAFCC',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  gateAnd: {
    color: colors.grey,
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 12,
  },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.navy },

  codeBlock: {
    backgroundColor: colors.codeBlock,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadows.card,
  },
  codeBlockBar: {
    backgroundColor: colors.codeBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  codeBlockLabel: {
    color: '#A8D8EA',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  codeFields: { padding: 16 },
  fieldKey: {
    color: '#A8D8EA',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  fieldComment: {
    color: '#5a7a8a',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  fieldInput: {
    backgroundColor: '#1a3a4a',
    borderRadius: 8,
    color: '#E2F4F8',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.codeBorder,
    fontFamily: 'monospace',
  },
  separator: { height: 1, backgroundColor: '#1E3A50', marginVertical: 12 },
  pinWrapper: { marginTop: 4 },

  capturedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  capturedBadge: {
    backgroundColor: '#1a3d1a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  capturedText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
  retakeBtn: {
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  retakeText: { color: colors.grey, fontSize: 11 },

  responseBlock: {
    backgroundColor: colors.codeBlock,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadows.card,
  },
  responseBar: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  responseBarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  responseCode: {
    color: '#A8D8EA',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 14,
    lineHeight: 18,
  },

  table: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.greyLight,
    ...shadows.card,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
  },
  tableRowAlt: { backgroundColor: '#F8FAFC' },
  tableHead: { backgroundColor: colors.tableHeader },
  tableHeadText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  tableCell: { fontSize: 11, color: '#334155', paddingHorizontal: 4, lineHeight: 16 },
  codeText: { color: colors.danger, fontFamily: 'monospace', fontWeight: '700' },
  monoText: { fontFamily: 'monospace', fontSize: 10, color: '#475569' },

  submitBtn: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.card,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});

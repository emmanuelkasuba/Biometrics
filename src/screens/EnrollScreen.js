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
import { enrollUser } from '../api/mfbasApi';

const REQUIRED_IMAGES = 3;
const IMAGE_LABELS = ['Frontal', 'Slight Left', 'Slight Right'];

export default function EnrollScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const setImage = (index, uri) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = uri;
      return next;
    });
  };

  const canSubmit =
    username.trim().length > 0 &&
    pin.length === 6 &&
    images.filter(Boolean).length === REQUIRED_IMAGES;

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const b64s = images.map((img) => img.split(',')[1]);
      const { status, data } = await enrollUser(username.trim(), pin, b64s);
      navigation.navigate('Result', {
        type: 'enroll',
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
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>3.1  POST /api/biometric/enroll/</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Request Body section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Request Body</Text>
        </View>

        {/* Code block style input area */}
        <View style={styles.codeBlock}>
          <View style={styles.codeBlockBar}>
            <Text style={styles.codeBlockLabel}>Enroll request — application/json</Text>
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

            <Text style={styles.fieldKey}>"images_b64": [</Text>
            <Text style={styles.fieldComment}>
              {'  '}// 3 face angles required — MTCNN will detect face in each
            </Text>
            {IMAGE_LABELS.map((lbl, i) => (
              <View key={i} style={styles.imageRow}>
                <View style={styles.imageMeta}>
                  <Text style={styles.imageIndex}>{i + 1}.</Text>
                  <Text style={styles.imageAngle}>{lbl}</Text>
                  {images[i] ? (
                    <View style={styles.capturedBadge}>
                      <Text style={styles.capturedText}>✓ Captured</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
                <CameraCapture
                  label={`Capture ${lbl}`}
                  onCapture={(uri) => setImage(i, uri)}
                />
              </View>
            ))}
            <Text style={styles.fieldKey}>]</Text>
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressRow}>
          {Array.from({ length: REQUIRED_IMAGES }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, images[i] ? styles.progressDotFilled : null]}
            />
          ))}
          <Text style={styles.progressLabel}>
            {images.filter(Boolean).length} / {REQUIRED_IMAGES} images captured
          </Text>
        </View>

        {/* Error codes reference */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Error Responses</Text>
        </View>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 0.5 }]}>HTTP</Text>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Condition</Text>
            <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Response key</Text>
          </View>
          {[
            ['400', 'Missing / invalid fields', 'error: {field: [messages]}'],
            ['409', 'Username already enrolled', "error: \"User 'alice' is already enrolled.\""],
            ['422', 'No face detected', 'error: "Image N: No face detected in image."'],
            ['500', 'Internal processing failure', 'error: "Image N: processing failed..."'],
          ].map(([code, cond, key], i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tableCell, styles.codeText, { flex: 0.5 }]}>{code}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{cond}</Text>
              <Text style={[styles.tableCell, styles.monoText, { flex: 2 }]}>{key}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleEnroll}
          disabled={!canSubmit || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>POST  /api/biometric/enroll/</Text>
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

  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },

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
  separator: {
    height: 1,
    backgroundColor: '#1E3A50',
    marginVertical: 12,
  },
  pinWrapper: { marginTop: 4 },

  imageRow: { marginBottom: 14 },
  imageMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  imageIndex: { color: colors.grey, fontSize: 13, marginRight: 6, fontFamily: 'monospace' },
  imageAngle: { color: '#E2F4F8', fontSize: 13, fontFamily: 'monospace', flex: 1 },
  capturedBadge: {
    backgroundColor: '#1a3d1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  capturedText: { color: '#4CAF50', fontSize: 11, fontWeight: '700' },
  pendingBadge: {
    backgroundColor: '#2a2a1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingText: { color: '#FFC107', fontSize: 11, fontWeight: '600' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.greyLight,
    marginRight: 6,
  },
  progressDotFilled: { backgroundColor: colors.cyan },
  progressLabel: { fontSize: 12, color: colors.grey, marginLeft: 4 },

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
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.card,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});

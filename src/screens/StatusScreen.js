import React, { useState, useEffect } from 'react';
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
import { getUserStatus } from '../api/mfbasApi';

function formatDate(iso) {
  if (!iso) return 'null';
  return new Date(iso).toLocaleString();
}

function LogRow({ log, index }) {
  const isSuccess = log.result === 'SUCCESS';
  return (
    <View style={[styles.logRow, index % 2 === 1 && styles.logRowAlt]}>
      <View style={[styles.resultChip, isSuccess ? styles.chipSuccess : styles.chipFail]}>
        <Text style={[styles.resultChipText, isSuccess ? styles.chipTextSuccess : styles.chipTextFail]}>
          {log.result}
        </Text>
      </View>
      <Text style={styles.logSimilarity}>
        similarity: <Text style={styles.logValue}>{(log.similarity ?? 0).toFixed(4)}</Text>
      </Text>
      <Text style={styles.logDate}>{formatDate(log.at)}</Text>
    </View>
  );
}

export default function StatusScreen({ navigation, route }) {
  const prefill = route.params?.prefill ?? '';
  const [username, setUsername] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState(null);

  const runCheck = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setStatusData(null);
    setError(null);
    try {
      const { status, data } = await getUserStatus(trimmed);
      if (status === 200) {
        setStatusData(data);
      } else {
        setError(data?.error || 'User not found.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefill) runCheck(prefill);
  }, []);

  const handleCheck = () => runCheck(username);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>3.3  GET /api/biometric/status/{'<username>'}/ </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* URL bar */}
        <View style={styles.urlBar}>
          <Text style={styles.urlMethod}>GET</Text>
          <TextInput
            style={styles.urlInput}
            placeholder="alice"
            placeholderTextColor={colors.grey}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleCheck}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !username.trim() && styles.sendBtnDisabled]}
            onPress={handleCheck}
            disabled={!username.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.urlPreview}>
          {`http://localhost:8000/api/biometric/status/${username || '<username>'}/`}
        </Text>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorCode}>404</Text>
            <Text style={styles.errorMsg}>{error}</Text>
          </View>
        )}

        {/* Status response */}
        {statusData && (
          <>
            {/* HTTP status bar */}
            <View style={styles.responseBar}>
              <Text style={styles.responseStatus}>200 OK — Status response</Text>
            </View>

            {/* Identity card */}
            <View style={styles.identityCard}>
              <View style={styles.identityRow}>
                <Text style={styles.identityKey}>user_id</Text>
                <Text style={styles.identityVal} numberOfLines={1}>
                  {statusData.user_id}
                </Text>
              </View>
              <View style={styles.identityRow}>
                <Text style={styles.identityKey}>username</Text>
                <Text style={[styles.identityVal, { fontWeight: '700', color: colors.navy }]}>
                  {statusData.username}
                </Text>
              </View>
              <View style={styles.identityRow}>
                <Text style={styles.identityKey}>enrolled_at</Text>
                <Text style={styles.identityVal}>{formatDate(statusData.enrolled_at)}</Text>
              </View>
              <View style={styles.identityRow}>
                <Text style={styles.identityKey}>last_auth_at</Text>
                <Text style={styles.identityVal}>{formatDate(statusData.last_auth_at)}</Text>
              </View>
            </View>

            {/* Lock status */}
            <View style={styles.lockRow}>
              <View
                style={[
                  styles.lockCard,
                  statusData.locked ? styles.lockCardLocked : styles.lockCardOk,
                ]}
              >
                <Text style={styles.lockIcon}>{statusData.locked ? '🔒' : '🔓'}</Text>
                <Text style={styles.lockLabel}>
                  {statusData.locked ? 'LOCKED' : 'ACTIVE'}
                </Text>
                {statusData.lockout_until && (
                  <Text style={styles.lockUntil}>
                    until {formatDate(statusData.lockout_until)}
                  </Text>
                )}
              </View>

              <View style={styles.failCard}>
                <Text style={styles.failCount}>{statusData.fail_count}</Text>
                <Text style={styles.failLabel}>fail_count</Text>
              </View>
            </View>

            {/* Recent logs */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>recent_logs</Text>
              <Text style={styles.sectionCount}>
                [{statusData.recent_logs?.length || 0} entries]
              </Text>
            </View>

            {statusData.recent_logs?.length > 0 ? (
              <View style={styles.logsTable}>
                <View style={[styles.logRow, styles.logHead]}>
                  <Text style={[styles.logHeadText, { flex: 1.2 }]}>result</Text>
                  <Text style={[styles.logHeadText, { flex: 1 }]}>similarity</Text>
                  <Text style={[styles.logHeadText, { flex: 1.8 }]}>timestamp</Text>
                </View>
                {statusData.recent_logs.map((log, i) => (
                  <LogRow key={i} log={log} index={i} />
                ))}
              </View>
            ) : (
              <Text style={styles.noLogs}>No recent authentication logs.</Text>
            )}

            {/* Raw JSON view */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Raw Response</Text>
            </View>
            <View style={styles.rawBlock}>
              <Text style={styles.rawCode}>
                {JSON.stringify(statusData, null, 2)}
              </Text>
            </View>
          </>
        )}

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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },

  scroll: { padding: 16 },

  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.greyLight,
    overflow: 'hidden',
    ...shadows.card,
  },
  urlMethod: {
    backgroundColor: '#3730A3',
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontFamily: 'monospace',
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
    color: colors.navy,
    paddingHorizontal: 12,
    fontFamily: 'monospace',
  },
  sendBtn: {
    backgroundColor: '#3730A3',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  urlPreview: {
    fontSize: 10,
    color: colors.grey,
    fontFamily: 'monospace',
    marginTop: 6,
    marginBottom: 16,
    marginLeft: 4,
  },

  errorCard: {
    backgroundColor: colors.dangerLight,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: 14,
    marginBottom: 16,
  },
  errorCode: { color: colors.danger, fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
  errorMsg: { color: '#7f1d1d', fontSize: 13, marginTop: 4 },

  responseBar: {
    backgroundColor: '#1a5c1a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  responseStatus: { color: '#4CAF50', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },

  identityCard: {
    backgroundColor: colors.codeBlock,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    ...shadows.card,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A50',
  },
  identityKey: {
    color: '#A8D8EA',
    fontSize: 12,
    fontFamily: 'monospace',
    width: 110,
  },
  identityVal: { color: '#E2F4F8', fontSize: 12, fontFamily: 'monospace', flex: 1 },

  lockRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  lockCard: {
    flex: 2,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  lockCardOk: { backgroundColor: colors.successLight, borderWidth: 1, borderColor: '#A5D6A7' },
  lockCardLocked: { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: '#EF9A9A' },
  lockIcon: { fontSize: 28, marginBottom: 4 },
  lockLabel: { fontSize: 16, fontWeight: '800', color: colors.navy },
  lockUntil: { fontSize: 10, color: colors.grey, marginTop: 4, textAlign: 'center' },

  failCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.greyLight,
    ...shadows.card,
  },
  failCount: { fontSize: 32, fontWeight: '800', color: colors.navy, fontFamily: 'monospace' },
  failLabel: { fontSize: 11, color: colors.grey, fontFamily: 'monospace', marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.navy },
  sectionCount: { fontSize: 12, color: colors.grey, marginLeft: 8, fontFamily: 'monospace' },

  logsTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.greyLight,
    marginBottom: 16,
    ...shadows.card,
  },
  logHead: { backgroundColor: colors.tableHeader },
  logHeadText: { color: colors.white, fontWeight: '700', fontSize: 11, paddingHorizontal: 8 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
  },
  logRowAlt: { backgroundColor: '#F8FAFC' },
  resultChip: {
    flex: 1.2,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginRight: 4,
  },
  chipSuccess: { backgroundColor: colors.successLight },
  chipFail: { backgroundColor: colors.dangerLight },
  resultChipText: { fontSize: 9, fontWeight: '700', fontFamily: 'monospace' },
  chipTextSuccess: { color: colors.success },
  chipTextFail: { color: colors.danger },
  logSimilarity: { flex: 1, fontSize: 10, color: colors.grey, fontFamily: 'monospace' },
  logValue: { color: colors.navy, fontWeight: '600' },
  logDate: { flex: 1.8, fontSize: 9, color: colors.grey, fontFamily: 'monospace' },

  noLogs: { color: colors.grey, fontSize: 13, textAlign: 'center', marginBottom: 16 },

  rawBlock: {
    backgroundColor: colors.codeBlock,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    ...shadows.card,
  },
  rawCode: {
    color: '#A8D8EA',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

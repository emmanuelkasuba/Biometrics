import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors, shadows } from '../theme';

function StatusLine({ label, value, mono }) {
  return (
    <View style={styles.statusLine}>
      <Text style={styles.statusKey}>{label}</Text>
      <Text style={[styles.statusVal, mono && styles.mono]}>{String(value ?? 'null')}</Text>
    </View>
  );
}

export default function ResultScreen({ route, navigation }) {
  const { type, httpStatus, data, username } = route.params;

  const isEnroll = type === 'enroll';
  const isSuccess = isEnroll ? httpStatus === 201 : data?.authenticated === true;
  const isLocked = httpStatus === 403;

  const title = isEnroll
    ? isSuccess
      ? 'Enrollment Successful'
      : 'Enrollment Failed'
    : isSuccess
    ? 'Authentication Granted'
    : isLocked
    ? 'Account Locked'
    : 'Authentication Denied';

  const icon = isSuccess ? '✅' : isLocked ? '🔒' : '❌';
  const httpColor =
    httpStatus < 300 ? colors.success : httpStatus < 500 ? colors.warning : colors.danger;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.back}>
          <Text style={styles.backText}>‹ Home</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Response</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Result hero */}
        <View style={[styles.hero, isSuccess ? styles.heroSuccess : isLocked ? styles.heroLocked : styles.heroFail]}>
          <Text style={styles.heroIcon}>{icon}</Text>
          <Text style={[styles.heroTitle, isSuccess ? styles.heroTitleSuccess : styles.heroTitleFail]}>
            {title}
          </Text>
          <View style={styles.httpBadge}>
            <Text style={[styles.httpCode, { color: httpColor }]}>{httpStatus}</Text>
            <Text style={styles.httpLabel}>
              {httpStatus < 300 ? 'Created / OK' : httpStatus < 500 ? 'Client Error' : 'Server Error'}
            </Text>
          </View>
        </View>

        {/* Enroll success */}
        {isEnroll && isSuccess && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enrolled Identity</Text>
            <StatusLine label="status" value={data.status} mono />
            <StatusLine label="user_id" value={data.user_id} mono />
            <StatusLine label="username" value={data.username} mono />
            <StatusLine label="samples" value={data.samples} mono />
          </View>
        )}

        {/* Auth success */}
        {!isEnroll && isSuccess && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session Granted</Text>
            <StatusLine label="authenticated" value="true" mono />
            <StatusLine label="user_id" value={data.user_id} mono />
            <StatusLine label="username" value={data.username} mono />
            <View style={styles.similarityRow}>
              <Text style={styles.statusKey}>similarity</Text>
              <View style={styles.similarityBar}>
                <View
                  style={[
                    styles.similarityFill,
                    { width: `${Math.round((data.similarity ?? 0) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.similarityVal}>
                {(data.similarity ?? 0).toFixed(4)}
              </Text>
            </View>
            <StatusLine label="threshold" value="0.82 (default)" mono />
            <StatusLine label="message" value={data.message} />
          </View>
        )}

        {/* Auth face failure */}
        {!isEnroll && !isSuccess && data?.similarity !== undefined && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Face Gate — FAILED</Text>
            <View style={styles.similarityRow}>
              <Text style={styles.statusKey}>similarity</Text>
              <View style={styles.similarityBar}>
                <View
                  style={[
                    styles.similarityFill,
                    styles.similarityFillFail,
                    { width: `${Math.round((data.similarity ?? 0) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.similarityVal, { color: colors.danger }]}>
                {(data.similarity ?? 0).toFixed(4)}
              </Text>
            </View>
            <StatusLine label="threshold" value={data.threshold ?? '0.82'} mono />
            <StatusLine label="authenticated" value="false" mono />
          </View>
        )}

        {/* PIN failure */}
        {!isEnroll && !isSuccess && data?.reason && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PIN Gate — FAILED</Text>
            <StatusLine label="authenticated" value="false" mono />
            <StatusLine label="reason" value={data.reason} />
          </View>
        )}

        {/* Lockout */}
        {isLocked && (
          <View style={[styles.card, styles.cardLocked]}>
            <Text style={styles.cardTitle}>Account Locked</Text>
            <StatusLine label="authenticated" value="false" mono />
            <StatusLine label="reason" value={data.reason} />
            <StatusLine label="lockout_until" value={data.lockout_until} mono />
          </View>
        )}

        {/* Error */}
        {data?.error && (
          <View style={[styles.card, styles.cardError]}>
            <Text style={styles.cardTitle}>Error</Text>
            <Text style={styles.errorMsg}>{data.error}</Text>
          </View>
        )}

        {/* Raw JSON */}
        <View style={styles.rawBlock}>
          <View style={styles.rawBar}>
            <Text style={styles.rawBarText}>Raw JSON Response</Text>
          </View>
          <Text style={styles.rawCode}>{JSON.stringify(data, null, 2)}</Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate(isEnroll ? 'Authenticate' : 'Enroll')}
        >
          <Text style={styles.primaryBtnText}>
            {isEnroll ? 'Authenticate this user →' : 'Enroll another user →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            navigation.navigate('Status', { prefill: username })
          }
        >
          <Text style={styles.secondaryBtnText}>Check status for "{username}"</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {},
  backText: { color: colors.cyan, fontSize: 14, fontWeight: '600' },
  pageTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },

  scroll: { padding: 16 },

  hero: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.card,
  },
  heroSuccess: { backgroundColor: colors.successLight, borderWidth: 1, borderColor: '#A5D6A7' },
  heroFail: { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: '#EF9A9A' },
  heroLocked: { backgroundColor: colors.warningLight, borderWidth: 1, borderColor: '#FFB74D' },
  heroIcon: { fontSize: 52, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  heroTitleSuccess: { color: colors.success },
  heroTitleFail: { color: colors.danger },
  httpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  httpCode: { fontSize: 18, fontWeight: '800', fontFamily: 'monospace', marginRight: 8 },
  httpLabel: { fontSize: 12, color: colors.grey },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...shadows.card,
  },
  cardLocked: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  cardError: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.grey,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  statusLine: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
    alignItems: 'flex-start',
  },
  statusKey: { width: 110, fontSize: 12, fontFamily: 'monospace', color: colors.grey },
  statusVal: { flex: 1, fontSize: 12, color: colors.navy, lineHeight: 18 },
  mono: { fontFamily: 'monospace' },

  similarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyLight,
  },
  similarityBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.greyLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  similarityFill: { height: '100%', backgroundColor: colors.cyan, borderRadius: 4 },
  similarityFillFail: { backgroundColor: colors.danger },
  similarityVal: { fontSize: 12, fontFamily: 'monospace', color: colors.navy, width: 55 },

  errorMsg: { fontSize: 13, color: colors.danger, lineHeight: 18 },

  rawBlock: {
    backgroundColor: colors.codeBlock,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    ...shadows.card,
  },
  rawBar: {
    backgroundColor: colors.codeBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rawBarText: { color: '#A8D8EA', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  rawCode: {
    color: '#A8D8EA',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 14,
    lineHeight: 18,
  },

  primaryBtn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.card,
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.navy, fontSize: 13, fontWeight: '600' },
});

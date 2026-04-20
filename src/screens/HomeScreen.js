import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, typography, shadows } from '../theme';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTag}>SEC2201 – BIOMETRICS I  |  GROUP 10</Text>
        <View style={styles.divider} />
        <Text style={styles.title}>MFBAS</Text>
        <Text style={styles.subtitle}>Multi-Factor Biometric{'\n'}Authentication System</Text>
        <View style={styles.divider} />
        <Text style={styles.version}>MFBAS-DG-001  •  Version 1.0  •  April 2025</Text>
        <Text style={styles.org}>AfriCore Intelligence Limited — FinCore Vertical</Text>
      </View>

      {/* Cards */}
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Select Operation</Text>

        <TouchableOpacity
          style={[styles.card, styles.cardEnroll]}
          onPress={() => navigation.navigate('Enroll')}
          activeOpacity={0.85}
        >
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIcon}>👤</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Enroll User</Text>
            <Text style={styles.cardDesc}>
              Register a new user with username, PIN, and 3 face images
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardAuth]}
          onPress={() => navigation.navigate('Authenticate')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconCircle, { backgroundColor: '#E3F6FA' }]}>
            <Text style={styles.cardIcon}>🔒</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.cyan }]}>Authenticate</Text>
            <Text style={styles.cardDesc}>
              Verify identity via face similarity + PIN (dual-gate)
            </Text>
          </View>
          <Text style={[styles.cardArrow, { color: colors.cyan }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.cardStatus]}
          onPress={() => navigation.navigate('Status')}
          activeOpacity={0.85}
        >
          <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.cardIcon}>📊</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: '#3730A3' }]}>Check Status</Text>
            <Text style={styles.cardDesc}>
              View enrollment record, fail count, lockout, and audit logs
            </Text>
          </View>
          <Text style={[styles.cardArrow, { color: '#3730A3' }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          AfriCore Intelligence Limited  |  Zambia DPA 2021 Compliant
        </Text>
        <Text style={styles.footerRight}>Confidential — Group 10</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },

  header: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  headerTag: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  divider: {
    width: '80%',
    height: 1.5,
    backgroundColor: colors.cyan,
    marginVertical: 10,
    opacity: 0.6,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 4,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.cyan,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
  version: {
    fontSize: 11,
    color: colors.grey,
    marginTop: 4,
    textAlign: 'center',
  },
  org: {
    fontSize: 11,
    color: colors.grey,
    marginTop: 2,
    textAlign: 'center',
  },

  body: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grey,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 4,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  cardEnroll: { borderLeftWidth: 4, borderLeftColor: colors.navy },
  cardAuth: { borderLeftWidth: 4, borderLeftColor: colors.cyan },
  cardStatus: { borderLeftWidth: 4, borderLeftColor: '#3730A3' },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIcon: { fontSize: 20 },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.grey,
    lineHeight: 17,
  },
  cardArrow: {
    fontSize: 28,
    color: colors.navy,
    fontWeight: '300',
    marginLeft: 8,
  },

  footer: {
    backgroundColor: colors.offWhite,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.greyLight,
  },
  footerText: { fontSize: 10, color: colors.grey },
  footerRight: { fontSize: 10, color: colors.grey },
});

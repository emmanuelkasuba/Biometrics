import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { colors, fonts, shadows } from '../theme';
import { s, vs, ms } from '../utils/scale';

const METHODS = [
  {
    num:     '01',
    name:    'Face Recognition',
    factor:  'Biometric factor — something you are',
    detail:  'The system captures a live photo and extracts a 512-dimension embedding using FaceNet. It then compares that embedding to your enrolled template. The cosine similarity score must reach 0.82 or higher to pass this gate.',
    color:   colors.navy,
  },
  {
    num:     '02',
    name:    'Fingerprint',
    factor:  'Biometric factor — something you are',
    detail:  'Your device secure enclave handles fingerprint matching directly. No fingerprint data ever leaves the device. When the device confirms a match, the server receives only a confirmation signal and then checks your PIN.',
    color:   '#00695C',
  },
  {
    num:     '03',
    name:    'PIN Code',
    factor:  'Knowledge factor — something you know',
    detail:  'A 6-digit PIN is required as the second factor in every login attempt. It is stored as a bcrypt hash with a cost factor of 12. The comparison is performed in constant time to prevent timing attacks.',
    color:   '#4527A0',
  },
];

const ACTIONS = [
  { label: 'Register',       sub: 'Enroll face, fingerprint, and PIN', screen: 'Enroll' },
  { label: 'Sign In',        sub: 'Verify identity with two factors',   screen: 'Authenticate' },
  { label: 'Account Status', sub: 'View logs, fail count, and locks',   screen: 'Status' },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={ss.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Top bar */}
      <View style={ss.topBar}>
        <View>
          <Text style={ss.brand}>MFBAS</Text>
          <Text style={ss.brandSub}>Multi-Factor Biometric Authentication System</Text>
        </View>
        <View style={ss.badge}>
          <Text style={ss.badgeText}>SEC2201 · Group 10</Text>
        </View>
      </View>

      <ScrollView
        style={ss.scroll}
        contentContainerStyle={ss.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: how the system works */}
        <Text style={ss.sectionLabel}>Authentication factors</Text>
        <Text style={ss.sectionIntro}>
          Every login requires two independent factors. One proves who you are
          physically; the other proves you know your secret PIN.
        </Text>

        {METHODS.map((m, i) => (
          <View key={m.num} style={[ss.methodBlock, i < METHODS.length - 1 && ss.methodBorder]}>
            <View style={ss.methodTop}>
              <View style={[ss.numBadge, { borderColor: m.color }]}>
                <Text style={[ss.numText, { color: m.color }]}>{m.num}</Text>
              </View>
              <View style={ss.methodTitles}>
                <Text style={ss.methodName}>{m.name}</Text>
                <Text style={[ss.methodFactor, { color: m.color }]}>{m.factor}</Text>
              </View>
            </View>
            <Text style={ss.methodDetail}>{m.detail}</Text>
          </View>
        ))}

        {/* Section: actions */}
        <Text style={[ss.sectionLabel, { marginTop: vs(32) }]}>Actions</Text>

        <View style={ss.actionGroup}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={a.screen}
              style={[ss.actionRow, i < ACTIONS.length - 1 && ss.actionBorder]}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.7}
            >
              <View style={ss.actionText}>
                <Text style={ss.actionLabel}>{a.label}</Text>
                <Text style={ss.actionSub}>{a.sub}</Text>
              </View>
              <Text style={ss.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={ss.footer}>
          AfriCore Intelligence Limited  ·  Zambia DPA 2021 Compliant  ·  April 2025
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.navy },
  scroll: { flex: 1, backgroundColor: colors.offWhite },
  scrollContent: { padding: s(22), paddingBottom: vs(48) },

  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: s(22),
    paddingTop: vs(14),
    paddingBottom: vs(20),
    backgroundColor: colors.navy,
  },
  brand: {
    fontSize: ms(34),
    fontFamily: fonts.bold,
    color: colors.white,
    letterSpacing: s(4),
  },
  brandSub: {
    fontSize: ms(11),
    fontFamily: fonts.light,
    color: colors.cyan,
    marginTop: vs(3),
    letterSpacing: 0.2,
  },
  badge: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
  },
  badgeText: {
    fontSize: ms(11),
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },

  sectionLabel: {
    fontSize: ms(11),
    fontFamily: fonts.semiBold,
    color: colors.textSub,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: vs(8),
  },
  sectionIntro: {
    fontSize: ms(14),
    fontFamily: fonts.regular,
    color: colors.textSub,
    lineHeight: ms(14) * 1.6,
    marginBottom: vs(20),
  },

  // Method blocks sit inside one card
  methodBlock: {
    backgroundColor: colors.white,
    paddingVertical: vs(18),
    paddingHorizontal: s(18),
    ...shadows.card,
    borderRadius: 0,
  },
  // Only the wrapping view gets the border-radius
  methodBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  methodTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(10),
  },
  numBadge: {
    width: s(36),
    height: s(36),
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    flexShrink: 0,
  },
  numText: {
    fontSize: ms(12),
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
  },
  methodTitles: { flex: 1 },
  methodName: {
    fontSize: ms(15),
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: vs(3),
  },
  methodFactor: {
    fontSize: ms(11),
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
  methodDetail: {
    fontSize: ms(13),
    fontFamily: fonts.regular,
    color: colors.textSub,
    lineHeight: ms(13) * 1.65,
    paddingLeft: s(48),   // align with title
  },

  // Action group is one card with dividers
  actionGroup: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.card,
    marginBottom: vs(28),
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(16),
    paddingHorizontal: s(18),
  },
  actionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: ms(15),
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: vs(2),
  },
  actionSub: {
    fontSize: ms(12),
    fontFamily: fonts.regular,
    color: colors.textSub,
  },
  actionArrow: {
    fontSize: ms(24),
    color: colors.greyMid,
    fontFamily: fonts.light,
    marginLeft: s(8),
  },

  footer: {
    fontSize: ms(11),
    fontFamily: fonts.light,
    color: colors.greyMid,
    textAlign: 'center',
    lineHeight: ms(11) * 1.7,
  },
});

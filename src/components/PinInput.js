import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

export default function PinInput({ value, onChange, label }) {
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digits = value.split('');
    digits[index] = text.replace(/[^0-9]/g, '').slice(-1);
    const newPin = digits.join('');
    onChange(newPin.padEnd(6, '').slice(0, 6));
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TextInput
            key={i}
            ref={(r) => (inputs.current[i] = r)}
            style={[styles.cell, value[i] ? styles.cellFilled : null]}
            value={value[i] ? '●' : ''}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            caretHidden
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.grey,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.greyLight,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: 22,
    color: colors.navy,
  },
  cellFilled: {
    borderColor: colors.cyan,
    backgroundColor: '#F0FBFD',
  },
});

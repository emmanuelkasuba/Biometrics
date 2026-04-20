export const colors = {
  navy: '#0D2137',
  navyLight: '#1a3a5c',
  cyan: '#00B4CC',
  cyanLight: '#33C9DF',
  white: '#FFFFFF',
  offWhite: '#F5F7FA',
  grey: '#8A9BB0',
  greyLight: '#E8ECF0',
  danger: '#E53935',
  dangerLight: '#FFEBEE',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  tableHeader: '#1a3a5c',
  codeBlock: '#1E2D3D',
  codeBorder: '#2A4A6B',
};

export const typography = {
  heading1: { fontSize: 28, fontWeight: '700', color: colors.navy },
  heading2: { fontSize: 22, fontWeight: '700', color: colors.navy },
  heading3: { fontSize: 16, fontWeight: '600', color: colors.cyan },
  body: { fontSize: 14, color: '#334155' },
  caption: { fontSize: 12, color: colors.grey },
  code: { fontSize: 12, fontFamily: 'monospace', color: '#A8D8EA' },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

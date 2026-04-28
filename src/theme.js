export const colors = {
  navy:        '#0D2137',
  navyLight:   '#1a3a5c',
  navySubtle:  '#EEF2F7',
  cyan:        '#00B4CC',
  cyanLight:   '#E6F9FC',
  white:       '#FFFFFF',
  offWhite:    '#F8F9FB',
  surface:     '#FFFFFF',
  border:      '#E4E8EE',
  grey:        '#8A9BB0',
  greyLight:   '#E4E8EE',
  greyMid:     '#C2CBD6',
  text:        '#0D2137',
  textSub:     '#5A6A7E',
  danger:      '#D93025',
  dangerLight: '#FEF2F1',
  success:     '#1E7E4A',
  successLight:'#F0FAF4',
  warning:     '#E07B00',
  warningLight:'#FFF8EC',
  tableHeader: '#1a3a5c',
  codeBlock:   '#1E2D3D',
  codeBorder:  '#2A4A6B',
};

export const fonts = {
  light:    'Inter-Light',
  regular:  'Inter-Regular',
  medium:   'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold:     'Inter-Bold',
};

export const shadows = {
  card: {
    shadowColor: '#0D2137',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  strong: {
    shadowColor: '#0D2137',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Reusable button styles — import where needed
export const buttonStyles = {
  primary: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.2,
  },
  outline: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  outlineText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.navy,
    letterSpacing: 0.2,
  },
  ghost: {
    height: 48,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ghostText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.navy,
  },
};

export const COLORS = {
  primary: '#0F766E',        // Premium teal / emerald
  primaryDark: '#115E59',    // Deep teal for pressed / hover states
  primaryLight: '#F0FDFA',   // Very soft teal tint
  primaryBorder: '#CCFBF1',  // Subtle teal border
  navy: '#0F172A',           // Deep navy / slate-900 typography
  navySurface: '#1E293B',    // Dark navy card surface
  background: '#F8FAFC',     // Modern soft off-white background
  backgroundSecondary: '#F1F5F9', // Secondary container bg
  card: '#FFFFFF',           // Card surface
  cardHover: '#F8FAFC',      // Interactive card hover
  textPrimary: '#0F172A',    // Main readable text
  textSecondary: '#475569',  // Secondary descriptive text
  textMuted: '#94A3B8',      // Muted metadata & placeholders
  textInverse: '#FFFFFF',    // White text on dark/colored surfaces

  // Semantic Status Tints
  overdue: '#DC2626',        // Alert crimson
  overdueBg: '#FEF2F2',      // Crimson soft tint
  overdueBorder: '#FECACA',  // Crimson light border

  repaid: '#059669',         // Emerald success
  repaidBg: '#ECFDF5',       // Emerald soft tint
  repaidBorder: '#A7F3D0',   // Emerald light border

  pending: '#D97706',        // Amber pending
  pendingBg: '#FFFBEB',      // Amber soft tint
  pendingBorder: '#FDE68A',  // Amber light border

  active: '#0284C7',         // Active blue
  activeBg: '#F0F9FF',       // Active blue soft tint
  activeBorder: '#BAE6FD',   // Active blue border

  // Structural
  border: '#E2E8F0',         // Default subtle border
  borderDark: '#CBD5E1',     // Active/focused border
  borderFocus: '#0F766E',    // Input focus border
  inputBg: '#FFFFFF',        // Input field background
  inputDisabled: '#F1F5F9',  // Disabled input
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const tokens = {
  colors: {
    bgPrimary: "var(--color-bg-primary)",
    bgSecondary: "var(--color-bg-secondary)",
    bgTertiary: "var(--color-bg-tertiary)",
    bgCard: "var(--color-bg-card)",

    textPrimary: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    textTertiary: "var(--color-text-tertiary)",

    accentMint: "var(--color-accent-mint)",
    accentMintLight: "var(--color-accent-mint-light)",
    accentMintDark: "var(--color-accent-mint-dark)",
    accentSuccess: "var(--color-accent-success)",
    accentError: "var(--color-accent-error)",
    accentWarning: "var(--color-accent-warning)",

    border: "var(--color-border)",
    borderLight: "var(--color-border-light)",
  },

  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  },

  shadows: {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
  },
} as const;

export type TokenColors = keyof typeof tokens.colors;

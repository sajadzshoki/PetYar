export default defineAppConfig({
  ui: {
    colors: {
      primary: 'terracotta',
      secondary: 'forest',
      neutral: 'ink',
      success: 'forest',
      error: 'terracotta',
    },
    button: {
      slots: {
        base: 'rounded-md font-medium transition-colors duration-150',
      },
      defaultVariants: {
        color: 'primary',
      },
    },
    input: {
      slots: {
        base: 'rounded-md bg-paper',
      },
    },
    card: {
      slots: {
        root: 'rounded-lg bg-paper ring-1 ring-ink-200/80 shadow-none',
      },
    },
  },
})

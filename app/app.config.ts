export default defineAppConfig({
  ui: {
    colors: {
      primary: 'forest',
      secondary: 'terracotta',
      neutral: 'ink',
      success: 'forest',
      info: 'forest',
      warning: 'amber',
      error: 'red',
    },
    button: {
      slots: {
        base: 'font-semibold transition-colors duration-150 pressable disabled:transform-none',
      },
      defaultVariants: {
        color: 'primary',
        size: 'lg',
      },
    },
    input: {
      slots: {
        base: 'bg-paper',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
    select: {
      slots: {
        base: 'bg-paper',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
    textarea: {
      slots: {
        base: 'bg-paper',
      },
      defaultVariants: {
        size: 'lg',
      },
    },
    formField: {
      slots: {
        label: 'font-semibold text-highlighted',
        description: 'text-muted',
        help: 'text-muted',
      },
    },
    card: {
      slots: {
        root: 'rounded-xl bg-paper ring-1 ring-default shadow-card divide-y-0',
        header: 'p-4 sm:p-5',
        body: 'p-4 sm:p-5',
        footer: 'p-4 sm:p-5',
      },
    },
    badge: {
      slots: {
        base: 'font-medium',
      },
    },
    alert: {
      slots: {
        root: 'rounded-lg',
        title: 'font-semibold',
        description: 'leading-7',
      },
    },
    modal: {
      slots: {
        content: 'bg-paper rounded-t-2xl sm:rounded-2xl',
      },
    },
    slideover: {
      slots: {
        content: 'bg-paper',
      },
    },
    dropdownMenu: {
      slots: {
        content: 'bg-paper ring-default shadow-raised min-w-48',
        item: 'min-h-10',
      },
    },
    checkbox: {
      slots: {
        label: 'text-default',
      },
    },
    tabs: {
      slots: {
        list: 'bg-canvas-deep',
      },
    },
  },
})

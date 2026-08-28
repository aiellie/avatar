export type AvatarStyle = 'gradient' | 'glass' | 'orb'

export type StylePreset = {
  id: AvatarStyle
  label: string
  hint: string
  aliases?: string[]
}

export const DEFAULT_STYLE: AvatarStyle = 'gradient'

/** Everything `?style=` accepts. Unlike ratios, this one *is* a whitelist. */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'gradient',
    label: 'Gradient',
    hint: 'Two-tone blend',
  },
  {
    id: 'glass',
    label: 'Glass',
    hint: 'Frosted, blurred',
    aliases: ['glassmorphism', 'frosted'],
  },
  {
    id: 'orb',
    label: 'Orb',
    hint: 'Luminous sphere',
    aliases: ['sphere'],
  },
]

const PRESETS_BY_KEY = new Map<string, StylePreset>()
for (const preset of STYLE_PRESETS) {
  PRESETS_BY_KEY.set(preset.id, preset)
  for (const alias of preset.aliases ?? []) PRESETS_BY_KEY.set(alias, preset)
}

/** Anything unrecognised falls back to the default rather than erroring. */
export function parseStyle(input: string | null | undefined): AvatarStyle {
  if (!input) return DEFAULT_STYLE
  return PRESETS_BY_KEY.get(input.trim().toLowerCase())?.id ?? DEFAULT_STYLE
}

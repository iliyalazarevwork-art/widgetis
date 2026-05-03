export type TagSlug =
  | 'conversion'
  | 'trust'
  | 'social-proof'
  | 'visual'
  | 'avg-order'
  | 'urgency'
  | 'loyalty'
  | 'engagement'

export type TagColorClass = 'green' | 'blue' | 'orange' | 'purple' | 'pink'

export const TAG_COLOR_CLASS: Record<TagSlug, TagColorClass> = {
  conversion: 'green',
  trust: 'blue',
  'social-proof': 'orange',
  visual: 'purple',
  'avg-order': 'green',
  urgency: 'pink',
  loyalty: 'blue',
  engagement: 'purple',
}

export function getTagColorClass(tagSlug: string | null | undefined): TagColorClass {
  return TAG_COLOR_CLASS[tagSlug as TagSlug] ?? 'green'
}

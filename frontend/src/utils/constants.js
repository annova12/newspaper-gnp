export const CATEGORIES = [
  'होम',
  'राजनीति',
  'खेल',
  'मनोरंजन',
  'व्यापार',
  'राज्य',
  'देश-दुनिया',
  'अपराध',
  'स्वास्थ्य',
]

export const CATEGORY_ICONS = {
  राजनीति: '🏛️',
  खेल: '⚽',
  मनोरंजन: '🎬',
  व्यापार: '💼',
  राज्य: '🗺️',
  'देश-दुनिया': '🌍',
  अपराध: '⚠️',
  स्वास्थ्य: '❤️',
}

export const CONTENT_CATEGORIES = CATEGORIES.slice(1) // without 'होम'

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\u0900-\u097fa-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)

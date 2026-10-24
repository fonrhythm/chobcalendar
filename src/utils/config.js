import { eventArtistTypeKeys, artistTypeKey } from './artistFilters.js';
import { usesOutline } from './artistSelection.js';

// IDOL is a singing/dancing idol group; GROUP is a musical ensemble.
export const ARTIST_COLORS = {
  bl: { bg: '#C96D8A', text: '#FFFFFF' },
  gl: { bg: '#6F8FBD', text: '#FFFFFF' },
  band: { bg: '#9A4650', text: '#FFFFFF' },
  singer: { bg: '#B97A3E', text: '#FFFFFF' },
  idol: { bg: '#7A5446', text: '#FFFFFF' },
  group: { bg: '#4F6491', text: '#FFFFFF' },
  actor: { bg: '#DDBE82', text: '#4A3426' },
  other: { bg: '#B3A59B', text: '#4A3426' },
};
const base = { bg: '#faf9f7', surface: '#fff', border: '#e6e2dc', 'border-soft': '#f1eee8', text: '#1a1a1a', sub: '#666', muted: '#8a8a8a' };
const categoryTokens = Object.fromEntries(Object.entries(ARTIST_COLORS).flatMap(([key, color]) => [['c-' + key, color.bg], ['t-' + key, color.text]]));
export const THAILAND_COLORS = { ...base, ...categoryTokens };
export const CHINA_COLORS = { ...base, ...categoryTokens };
export const OVERSEA_COLORS = { ...base, ...categoryTokens };
export const REGION_COLORS = { thailand: THAILAND_COLORS, china: CHINA_COLORS, oversea: OVERSEA_COLORS };
export function getColorsByRegion(region = 'thailand') { return REGION_COLORS[region] || THAILAND_COLORS; }
export function normalizeCategory(value) { return artistTypeKey(value) || 'other'; }
export function getCategoryColor(category, region = 'thailand') {
  const key = normalizeCategory(category), canonical = key === 'music' ? 'singer' : key;
  const colors = getColorsByRegion(region);
  return { bg: colors['c-' + canonical] || colors['c-other'], text: colors['t-' + canonical] || colors['t-other'] };
}
export function resolveEventCategory(item, catalog = []) {
  const keys = eventArtistTypeKeys(item, catalog);
  const priority = ['bl', 'gl', 'band', 'idol', 'group', 'singer', 'actor', 'other'];
  return priority.find(key => keys.includes(key)) || (keys.includes('music') ? 'singer' : 'other');
}
export function getEventCategoryColor(item, catalog = []) { return getCategoryColor(resolveEventCategory(item, catalog), item.region); }
export function getEventDisplayStyle(item, catalog = []) { return { ...getEventCategoryColor(item, catalog), outline: usesOutline(item), rollCall: item.roll_call === true }; }
export function getOfficialChipStyle(category, region = 'thailand') {
  const { bg } = getCategoryColor(category, region); return { borderColor: bg, color: bg, isOfficial: true };
}
export function getFanChipStyle(category, region = 'thailand') { return { ...getCategoryColor(category, region), isOfficial: false }; }

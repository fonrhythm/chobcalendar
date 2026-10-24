const { eventArtistTypeKeys, artistTypeKey, artistTypeKeys }=require("./artistFilters.js");
const { usesOutline, selectionCount }=require("./artistSelection.js");

// IDOL is a singing/dancing idol group; GROUP is a musical ensemble.
const ARTIST_COLORS = {
  bl: { bg: '#6F8FBD', text: '#FFFFFF' },
  gl: { bg: '#C96D8A', text: '#FFFFFF' },
  band: { bg: '#9A4650', text: '#FFFFFF' },
  singer: { bg: '#B97A3E', text: '#FFFFFF' },
  idol: { bg: '#7A5446', text: '#FFFFFF' },
  group: { bg: '#4F6491', text: '#FFFFFF' },
  actor: { bg: '#DDBE82', text: '#4A3426' },
  other: { bg: '#B3A59B', text: '#4A3426' },
};
const MIXED_ARTIST_COLOR = { bg: '#9DB1CA', text: '#FFFFFF' };
const base = { bg: '#faf9f7', surface: '#fff', border: '#e6e2dc', 'border-soft': '#f1eee8', text: '#1a1a1a', sub: '#666', muted: '#8a8a8a' };
const categoryTokens = Object.fromEntries(Object.entries(ARTIST_COLORS).flatMap(([key, color]) => [['c-' + key, color.bg], ['t-' + key, color.text]]));
const THAILAND_COLORS = { ...base, ...categoryTokens };
const CHINA_COLORS = { ...base, ...categoryTokens };
const OVERSEA_COLORS = { ...base, ...categoryTokens };
const REGION_COLORS = { thailand: THAILAND_COLORS, china: CHINA_COLORS, oversea: OVERSEA_COLORS };
function getColorsByRegion(region = 'thailand') { return REGION_COLORS[region] || THAILAND_COLORS; }
function normalizeCategory(value) { return artistTypeKey(value) || 'other'; }
function getCategoryColor(category, region = 'thailand') {
  if (category === 'mixed') return { ...MIXED_ARTIST_COLOR };
  const key = normalizeCategory(category), canonical = key === 'music' ? 'singer' : key;
  const colors = getColorsByRegion(region);
  return { bg: colors['c-' + canonical] || colors['c-other'], text: colors['t-' + canonical] || colors['t-other'] };
}
function resolveEventCategory(item, catalog = []) {
  const priority = ['bl', 'gl', 'band', 'idol', 'group', 'singer', 'actor', 'other'];
  const primary = keys => priority.find(key => keys.includes(key)) || (keys.includes('music') ? 'singer' : 'other');
  const memberIds = artist => artist.group_member_ids?.length ? artist.group_member_ids : artist.member_ids || [];
  const selections = item.artist_selections || item.attributes?.artist_selections || [];
  const ids = selections.length ? selections : item.artist_ids || [];
  const selected = catalog.filter(artist => ids.includes(artist.id));
  const covered = new Set(selected.flatMap(memberIds));
  const genres = new Set();
  const participants = selections.length ? selected : selected.filter(artist => !covered.has(artist.id));
  for (const artist of participants) {
    // A collective's own genre wins over its members' other professions.
    // For CPs without a genre, use the linked members as the fallback.
    const own = artistTypeKeys(artist);
    const keys = own.length ? own : catalog.filter(member => memberIds(artist).includes(member.id)).flatMap(artistTypeKeys);
    if (keys.length) genres.add(primary(keys));
  }
  if (genres.size > 1) return 'mixed';
  if (genres.size === 1) return [...genres][0];
  const keys = eventArtistTypeKeys(item, catalog);
  // When only aggregate metadata exists, multiple identities for one artist
  // still use one main colour; a multi-artist mixed lineup uses the old blue.
  if (selectionCount(item) > 1 && new Set(keys.map(key => key === 'music' ? 'singer' : key)).size > 1) return 'mixed';
  return primary(keys);
}
function getEventCategoryColor(item, catalog = []) { return getCategoryColor(resolveEventCategory(item, catalog), item.region); }
function getEventDisplayStyle(item, catalog = []) { return { ...getEventCategoryColor(item, catalog), outline: usesOutline(item), rollCall: item.roll_call === true }; }
function getOfficialChipStyle(category, region = 'thailand') {
  const { bg } = getCategoryColor(category, region); return { borderColor: bg, color: bg, isOfficial: true };
}
function getFanChipStyle(category, region = 'thailand') { return { ...getCategoryColor(category, region), isOfficial: false }; }

module.exports={ARTIST_COLORS,MIXED_ARTIST_COLOR,THAILAND_COLORS,CHINA_COLORS,OVERSEA_COLORS,REGION_COLORS,getColorsByRegion,normalizeCategory,getCategoryColor,resolveEventCategory,getEventCategoryColor,getEventDisplayStyle,getOfficialChipStyle,getFanChipStyle};

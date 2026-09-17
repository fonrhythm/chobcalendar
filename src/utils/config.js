/**
 * CHOB Calendar - 配色系统
 * 支持三个地区：Thailand, China, Oversea
 * 支持官方和粉丝事件样式区分
 */

// ============ 泰国 (Thailand) ============
export const THAILAND_COLORS = {
  // 基础颜色
  bg: '#faf9f7',
  surface: '#fff',
  border: '#e6e2dc',
  'border-soft': '#f1eee8',
  text: '#1a1a1a',
  sub: '#666',
  muted: '#8a8a8a',

  // 分类颜色 - 蓝标 (Blue Label / Official)
  'c-bl': '#142b4b',
  't-bl': '#fff',

  // 分类颜色 - 金标 (Gold Label / Official)
  'c-gl': '#d7ccba',
  't-gl': '#7a5c3a',

  // 分类颜色 - 乐队 (Band)
  'c-band': '#2b4779',
  't-band': '#fff',

  // 分类颜色 - 歌手 (Singer)
  'c-singer': '#c4b59c',
  't-singer': '#fff',

  // 分类颜色 - 组合 (Group)
  'c-group': '#6e8dbb',
  't-group': '#fff',

  // 分类颜色 - 演员 (Actor)
  'c-actor': '#d0c5af',
  't-actor': '#fff',

  // 分类颜色 - 其他 (Other)
  'c-other': '#9db1ca',
  't-other': '#fff',
}

// ============ 中国 (China) ============
export const CHINA_COLORS = {
  // 基础颜色
  bg: '#faf9f7',
  surface: '#fff',
  border: '#e6e2dc',
  'border-soft': '#f1eee8',
  text: '#1a1a1a',
  sub: '#666',
  muted: '#8a8a8a',

  // 分类颜色 - 蓝标
  'c-bl': '#533A33',
  't-bl': '#fff',

  // 分类颜色 - 金标
  'c-gl': '#C96D8A',
  't-gl': '#fff',

  // 分类颜色 - 演员
  'c-actor': '#F9D4DA',
  't-actor': '#674b3f',

  // 分类颜色 - 音乐
  'c-music': '#B5ACA3',
  't-music': '#fff',

  // 分类颜色 - 其他
  'c-other': '#F5E6D1',
  't-other': '#674b3f',
}

// ============ 海外 (Oversea) ============
export const OVERSEA_COLORS = {
  // 基础颜色
  bg: '#faf9f7',
  surface: '#fff',
  border: '#e6e2dc',
  'border-soft': '#f1eee8',
  text: '#1a1a1a',
  sub: '#666',
  muted: '#8a8a8a',

  // 分类颜色 - 蓝标
  'c-bl': '#442D1C',
  't-bl': '#fff',

  // 分类颜色 - 金标
  'c-gl': '#743014',
  't-gl': '#fff',

  // 分类颜色 - 乐队
  'c-band': '#464336',
  't-band': '#fff',

  // 分类颜色 - 歌手
  'c-singer': '#674b3f',
  't-singer': '#fff',

  // 分类颜色 - 组合
  'c-group': '#907C6C',
  't-group': '#fff',

  // 分类颜色 - 演员
  'c-actor': '#C9BEAD',
  't-actor': '#3a2a1e',

  // 分类颜色 - 其他
  'c-other': '#a27d60',
  't-other': '#fff',
}

// ============ 颜色配置导出 ============
export const REGION_COLORS = {
  thailand: THAILAND_COLORS,
  china: CHINA_COLORS,
  oversea: OVERSEA_COLORS,
}

/**
 * 获取指定地区的颜色
 * @param {string} region - 地区代码 'thailand' | 'china' | 'oversea'
 * @returns {object} 颜色对象
 */
export function getColorsByRegion(region = 'thailand') {
  return REGION_COLORS[region] || THAILAND_COLORS
}

/**
 * 获取分类的背景色和文字色
 * @param {string} category - 分类 'bl' | 'gl' | 'band' | 'singer' | 'group' | 'actor' | 'other' | 'music'
 * @param {string} region - 地区
 * @returns {object} { bg, text }
 */
export function getCategoryColor(category, region = 'thailand') {
  const colors = getColorsByRegion(region)
  const bgKey = `c-${category}`
  const textKey = `t-${category}`
  return {
    bg: colors[bgKey] || colors['c-other'],
    text: colors[textKey] || colors['t-other'],
  }
}

/**
 * 获取官方事件样式（镶边）
 * @param {string} category - 分类
 * @param {string} region - 地区
 * @returns {object} { borderColor, color, isOfficial: true }
 */
export function getOfficialChipStyle(category, region = 'thailand') {
  const { bg } = getCategoryColor(category, region)
  return {
    borderColor: bg,
    color: bg,
    isOfficial: true,
  }
}

/**
 * 获取粉丝事件样式（填充）
 * @param {string} category - 分类
 * @param {string} region - 地区
 * @returns {object} { bg, text, isOfficial: false }
 */
export function getFanChipStyle(category, region = 'thailand') {
  return {
    ...getCategoryColor(category, region),
    isOfficial: false,
  }
}

/**
 * 转换数据库字段到前端分类
 * 可能的分类映射：
 * Thailand/Oversea: 'bl' | 'gl' | 'band' | 'singer' | 'group' | 'actor' | 'other'
 * China: 'bl' | 'gl' | 'actor' | 'music' | 'other'
 */
export function normalizeCategory(rawCategory, region = 'thailand') {
  if (!rawCategory) return 'other'

  const normalized = rawCategory.toLowerCase().trim()

  // 直接返回已知分类
  const validCategories = {
    thailand: ['bl', 'gl', 'band', 'singer', 'group', 'actor', 'other'],
    china: ['bl', 'gl', 'actor', 'music', 'other'],
    oversea: ['bl', 'gl', 'band', 'singer', 'group', 'actor', 'other'],
  }

  if (validCategories[region]?.includes(normalized)) {
    return normalized
  }

  return 'other'
}

import { createAvatar } from '@dicebear/core';
import { avataaars, adventurer, bottts, croodles, rings, thumbs, initials } from '@dicebear/collection';
const styles = { avataaars, adventurer, bottts, croodles, rings, thumbs, initials };
export const avatarOptions = [
 ['initials','昵称首字'],['circle','圆形'],['square','方形'],['avataaars','卡通人物'],
 ['adventurer','冒险家'],['bottts','机器人'],['croodles','涂鸦'],['rings','圆环'],['thumbs','拇指'],
];
export function avatarDataUri(style, seed, legacySeed) {
 const renderer = styles[style];
 if (!renderer || (style === 'initials' && !legacySeed)) return '';
 return createAvatar(renderer, { seed: legacySeed || seed || '用户', scale: 80, mood: ['happy'] }).toDataUriSync();
}

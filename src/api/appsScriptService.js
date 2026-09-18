import { readPublicFeed } from './publicFeed.js'
export const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL || ''
export function fetchRecords(signal) {
  return readPublicFeed(endpoint, signal)
}

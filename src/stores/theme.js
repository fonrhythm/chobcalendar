import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)
  function applyTheme() {
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  }
  function setTheme(dark) {
    isDark.value = dark
    applyTheme()
    try {
      localStorage.setItem('chob-theme', dark ? 'dark' : 'light')
    } catch {}
  }
  function initTheme() {
    try {
      const saved = localStorage.getItem('chob-theme')
      isDark.value = saved
        ? saved === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {}
    applyTheme()
  }
  return { isDark, setTheme, initTheme }
})

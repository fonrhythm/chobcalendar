/**
 * User Store - 管理用户数据、收藏和偏好
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ============ 状态 ============

  // 用户ID（可选，用于多设备同步）
  const userId = ref(null)

  // 收藏的事件ID列表
  const favorites = ref([])

  // 隐藏的事件ID列表
  const hidden = ref([])

  // 用户偏好设置
  const preferences = ref({
    showPastEvents: false,
    showOfficialOnly: false,
    enableNotifications: true,
    notificationTime: '09:00', // 提前提醒时间
  })

  // 用户标签（自定义分类）
  const customTags = ref([])

  // 观看历史
  const viewHistory = ref([])

  // ============ 计算属性 ============

  /**
   * 获取收藏数量
   */
  const favoritesCount = computed(() => {
    return favorites.value.length
  })

  /**
   * 获取隐藏事件数量
   */
  const hiddenCount = computed(() => {
    return hidden.value.length
  })

  /**
   * 判断是否已认证
   */
  const isAuthenticated = computed(() => {
    return userId.value !== null
  })

  // ============ 方法 ============

  /**
   * 切换收藏
   */
  const toggleFavorite = (eventId) => {
    const index = favorites.value.indexOf(eventId)
    if (index > -1) {
      favorites.value.splice(index, 1)
      return false // 取消收藏
    } else {
      favorites.value.push(eventId)
      saveToLocalStorage()
      return true // 已收藏
    }
  }

  /**
   * 检查是否已收藏
   */
  const isFavorited = (eventId) => {
    return favorites.value.includes(eventId)
  }

  /**
   * 批量添加收藏
   */
  const addFavorites = (eventIds) => {
    eventIds.forEach((id) => {
      if (!favorites.value.includes(id)) {
        favorites.value.push(id)
      }
    })
    saveToLocalStorage()
  }

  /**
   * 批量移除收藏
   */
  const removeFavorites = (eventIds) => {
    eventIds.forEach((id) => {
      const index = favorites.value.indexOf(id)
      if (index > -1) {
        favorites.value.splice(index, 1)
      }
    })
    saveToLocalStorage()
  }

  /**
   * 清空所有收藏
   */
  const clearFavorites = () => {
    if (confirm('确定要清空所有收藏吗？')) {
      favorites.value = []
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 切换隐藏
   */
  const toggleHidden = (eventId) => {
    const index = hidden.value.indexOf(eventId)
    if (index > -1) {
      hidden.value.splice(index, 1)
      return false // 取消隐藏
    } else {
      hidden.value.push(eventId)
      saveToLocalStorage()
      return true // 已隐藏
    }
  }

  /**
   * 检查是否已隐藏
   */
  const isHidden = (eventId) => {
    return hidden.value.includes(eventId)
  }

  /**
   * 更新偏好设置
   */
  const updatePreference = (key, value) => {
    if (key in preferences.value) {
      preferences.value[key] = value
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 获取所有偏好设置
   */
  const getPreferences = () => {
    return { ...preferences.value }
  }

  /**
   * 重置偏好设置为默认
   */
  const resetPreferences = () => {
    if (confirm('确定要重置所有偏好设置吗？')) {
      preferences.value = {
        showPastEvents: false,
        showOfficialOnly: false,
        enableNotifications: true,
        notificationTime: '09:00',
      }
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 添加自定义标签
   */
  const addTag = (tagName) => {
    if (!customTags.value.includes(tagName)) {
      customTags.value.push(tagName)
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 删除自定义标签
   */
  const removeTag = (tagName) => {
    const index = customTags.value.indexOf(tagName)
    if (index > -1) {
      customTags.value.splice(index, 1)
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 获取所有标签
   */
  const getTags = () => {
    return [...customTags.value]
  }

  /**
   * 记录观看历史
   */
  const recordView = (eventId) => {
    const now = new Date().toISOString()
    const record = { eventId, timestamp: now }

    // 检查是否已存在
    const existingIndex = viewHistory.value.findIndex((v) => v.eventId === eventId)
    if (existingIndex > -1) {
      viewHistory.value[existingIndex].timestamp = now
    } else {
      viewHistory.value.push(record)
    }

    // 只保留最近100条记录
    if (viewHistory.value.length > 100) {
      viewHistory.value = viewHistory.value.slice(-100)
    }

    saveToLocalStorage()
  }

  /**
   * 获取最近查看的事件
   */
  const getRecentViews = (count = 10) => {
    return viewHistory.value
      .slice(-count)
      .reverse()
      .map((v) => v.eventId)
  }

  /**
   * 清空浏览历史
   */
  const clearViewHistory = () => {
    if (confirm('确定要清空浏览历史吗？')) {
      viewHistory.value = []
      saveToLocalStorage()
      return true
    }
    return false
  }

  /**
   * 设置用户ID
   */
  const setUserId = (id) => {
    userId.value = id
    saveToLocalStorage()
  }

  /**
   * 登出用户
   */
  const logout = () => {
    userId.value = null
    favorites.value = []
    hidden.value = []
    customTags.value = []
    viewHistory.value = []
    clearLocalStorage()
  }

  /**
   * 保存到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      const data = {
        userId: userId.value,
        favorites: favorites.value,
        hidden: hidden.value,
        preferences: preferences.value,
        customTags: customTags.value,
        viewHistory: viewHistory.value,
      }
      localStorage.setItem('chob-calendar-user', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save user data:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  const loadFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('chob-calendar-user')
      if (data) {
        const parsed = JSON.parse(data)
        userId.value = parsed.userId || null
        favorites.value = parsed.favorites || []
        hidden.value = parsed.hidden || []
        preferences.value = parsed.preferences || preferences.value
        customTags.value = parsed.customTags || []
        viewHistory.value = parsed.viewHistory || []
        return true
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
    return false
  }

  /**
   * 清除本地存储
   */
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('chob-calendar-user')
    } catch (error) {
      console.error('Failed to clear user data:', error)
    }
  }

  /**
   * 导出用户数据
   */
  const exportUserData = () => {
    return JSON.stringify(
      {
        userId: userId.value,
        favorites: favorites.value,
        hidden: hidden.value,
        preferences: preferences.value,
        customTags: customTags.value,
        exportDate: new Date().toISOString(),
      },
      null,
      2,
    )
  }

  /**
   * 导入用户数据
   */
  const importUserData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      userId.value = data.userId || null
      favorites.value = data.favorites || []
      hidden.value = data.hidden || []
      preferences.value = data.preferences || preferences.value
      customTags.value = data.customTags || []
      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('Failed to import user data:', error)
      return false
    }
  }

  return {
    // 状态
    userId,
    favorites,
    hidden,
    preferences,
    customTags,
    viewHistory,

    // 计算属性
    favoritesCount,
    hiddenCount,
    isAuthenticated,

    // 收藏方法
    toggleFavorite,
    isFavorited,
    addFavorites,
    removeFavorites,
    clearFavorites,

    // 隐藏方法
    toggleHidden,
    isHidden,

    // 偏好设置方法
    updatePreference,
    getPreferences,
    resetPreferences,

    // 标签方法
    addTag,
    removeTag,
    getTags,

    // 浏览历史方法
    recordView,
    getRecentViews,
    clearViewHistory,

    // 用户认证方法
    setUserId,
    logout,

    // 本地存储方法
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,

    // 导入导出方法
    exportUserData,
    importUserData,
  }
})

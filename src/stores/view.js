import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dateKey, addDays, parseDate } from '../utils/dates'
export const useViewStore = defineStore('view', () => {
  const currentRegion = ref('thailand'),
    viewMode = ref('calendar'),
    selectedDate = ref(dateKey(new Date())),
    month = ref(selectedDate.value.slice(0, 7))
  const query = ref(''),
    companies = ref([]),
    categories = ref([]),
    activityType = ref('all'),
    onlyFavorites = ref(false),
    taskStart = ref(selectedDate.value)
  const weekStart = computed(() =>
    addDays(selectedDate.value, -parseDate(selectedDate.value).getDay()),
  )
  const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart.value, i)))
  const taskDays = computed(() => Array.from({ length: 7 }, (_, i) => addDays(taskStart.value, i)))
  function selectDate(v) {
    selectedDate.value = v
    month.value = v.slice(0, 7)
  }
  function shiftMonth(n) {
    const d = parseDate(month.value + '-01')
    d.setMonth(d.getMonth() + n)
    selectDate(dateKey(d))
    taskStart.value = selectedDate.value
  }
  function shiftWeek(n) {
    selectDate(addDays(selectedDate.value, n * 7))
    taskStart.value = addDays(taskStart.value, n * 7)
  }
  function setRegion(r) {
    currentRegion.value = r
    companies.value = []
    categories.value = []
    activityType.value = 'all'
  }
  function today() {
    selectDate(dateKey(new Date()))
    taskStart.value = selectedDate.value
  }
  function resetFilters() {
    query.value = ''
    companies.value = []
    categories.value = []
    activityType.value = 'all'
    onlyFavorites.value = false
  }
  return {
    currentRegion,
    viewMode,
    selectedDate,
    month,
    query,
    companies,
    categories,
    activityType,
    onlyFavorites,
    weekDays,
    taskDays,
    taskStart,
    selectDate,
    shiftMonth,
    shiftWeek,
    setRegion,
    today,
    resetFilters,
  }
})

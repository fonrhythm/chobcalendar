<script setup>
import { useLanguageStore } from '../stores/language'
import { useViewStore } from '../stores/view'
import Icon from './Icon.vue'
const lang = useLanguageStore(),
  view = useViewStore()
</script>
<template>
  <div class="empty-state">
    <Icon name="calendar" />
    <h3>{{ lang.t.noEvents }}</h3>
    <p>{{ lang.t.emptyNote }}</p>
    <button class="text-button" @click="view.resetFilters()">{{ lang.t.reset }}</button>
  </div>
</template>

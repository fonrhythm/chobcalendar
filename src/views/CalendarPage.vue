<script setup>
import CalendarView from '../components/CalendarView.vue'
defineEmits(['open', 'day'])
</script>
<template><CalendarView @open="$emit('open', $event)" @day="$emit('day', $event)" /></template>

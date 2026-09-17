<script setup>
defineProps({ name: String })
const paths = {
  search: 'm21 21-4.4-4.4 M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  down: 'm6 9 6 6 6-6',
  close: 'm6 6 12 12 M6 18 18 6',
  plus: 'M12 5v14 M5 12h14',
  mail: 'M3 5h18v14H3z M3 5l9 8 9-8',
  arrow: 'M6 18 18 6 M6 6h12v12',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 2v6 M16 2v6',
}
</script>
<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.calendar" />
  </svg>
</template>

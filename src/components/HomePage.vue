<script setup>
const unifiedNavigation = import.meta.env.DEV;
import { computed } from 'vue';
import { useLanguageStore } from '../stores/language';
import { useThemeStore } from '../stores/theme';
import Icon from './Icon.vue';
const lang = useLanguageStore(),
  theme = useThemeStore();
const copy = computed(
  () =>
    ({
      zh: {
        regions: {
          china: '来华行程',
          thailand: '泰国行程',
          oversea: '海外行程',
        },
        schedule:'艺人行程',drama:'追剧日历',
        about: '联系我',
        tutorial: '使用教程',
      },
      en: {
        regions: { china: 'China', thailand: 'Thailand', oversea: 'Overseas' },
        schedule:'Artist schedule',drama:'Drama calendar',
        about: 'About this project',
        tutorial: 'User guide',
      },
      th: {
        regions: {
          china: 'ตารางงานในจีน',
          thailand: 'ตารางงานในไทย',
          oversea: 'ตารางงานต่างประเทศ',
        },
        schedule:'ตารางงานศิลปิน',drama:'ปฏิทินซีรีส์',
        about: 'เกี่ยวกับเรา',
        tutorial: 'คู่มือการใช้งาน',
      },
    })[lang.currentLanguage],
);
defineEmits(['region', 'drama', 'about', 'tutorial', 'account']);
</script>
<template>
  <main class="home-page">
    <div class="home-preferences">
      <div class="segmented languages" aria-label="Language">
        <button
          v-for="(label, key) in { zh: '中', en: 'EN', th: 'ไทย' }"
          :key="key"
          :class="{ active: lang.currentLanguage === key }"
          :aria-pressed="lang.currentLanguage === key"
          @click="lang.setLanguage(key)"
        >
          {{ label }}
        </button>
      </div>
      <div class="segmented theme-toggle" :aria-label="lang.t.theme">
        <button
          :class="{ active: !theme.isDark }"
          :aria-pressed="!theme.isDark"
          :aria-label="lang.t.light"
          @click="theme.setTheme(false)"
        >
          <Icon name="sun" />
        </button>
        <button
          :class="{ active: theme.isDark }"
          :aria-pressed="theme.isDark"
          :aria-label="lang.t.dark"
          @click="theme.setTheme(true)"
        >
          <Icon name="moon" />
        </button>
      </div>
    </div>
    <div class="home-brand">
      <span>THAI ARTIST</span>
      <h1>Chob</h1>
      <span>CALENDAR</span>
    </div>
    <div class="home-divider"></div>
    <nav v-if="unifiedNavigation" class="home-links">
      <button @click="$emit('region','schedule')"><strong>Schedule</strong><small>{{copy.schedule}}</small><span>⟶</span></button>
      <button @click="$emit('drama')"><strong>Drama</strong><small>{{copy.drama}}</small><span>⟶</span></button>
      <button @click="$emit('about')"><strong>About</strong><small>{{copy.about}}</small><span>⟶</span></button>
    </nav><nav v-else class="home-links">
      <button
        v-for="(label, key) in copy.regions"
        :key="key"
        @click="$emit('region', key)"
      >
        <strong>{{ key.toUpperCase() }} SCHEDULE</strong
        ><small>{{ label }}</small
        ><span>⟶</span></button
      ><button @click="$emit('about')">
        <strong>ABOUT</strong><small>{{ copy.about }}</small
        ><span>⟶</span>
      </button>
    </nav>
    <div class="home-account">
      <button @click="$emit('account', 'login')">LOGIN</button><span>｜</span
      ><button @click="$emit('account', 'register')">REGISTER</button>
    </div>
    <button class="tutorial-link" @click="$emit('tutorial')">
      {{ copy.tutorial }}
    </button>
  </main>
</template>

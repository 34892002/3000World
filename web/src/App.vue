<template>
  <v-app>
    <router-view />
    <!-- 全局通知组件 -->
    <GlobalNotification />
  </v-app>
</template>

<script setup>
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import GlobalNotification from '@/components/GlobalNotification.vue'

const { locale } = useI18n();
const { current: vuetify } = useLocale();

watch(locale, (newLocale) => {
  console.log("🚀 change lang:", locale)
  vuetify.value = newLocale;
});

</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'

const { locale } = useI18n();
const { current: vuetify } = useLocale();

watch(locale, (newLocale) => {
  console.log("🚀 change lang:", locale)
  vuetify.value = newLocale;
});

</script>

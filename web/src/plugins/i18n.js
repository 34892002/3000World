import { en as vuetifyEn, zhHans as vuetifyZhHans } from "vuetify/locale";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { createI18n, useI18n } from "vue-i18n";
import { setGlobalI18n } from "../utils/api";

// 引入自定义语言文件
import en from "@/locales/en.js";
import zhHans from "@/locales/zh-Hans.js";

export const i18n = createI18n({
  legacy: false,
  locale: "zhHans",
  fallbackLocale: "en",
  messages: {
    en: {
      ...en,
      $vuetify: { ...vuetifyEn },
    },
    zhHans: {
      ...zhHans,
      $vuetify: { ...vuetifyZhHans },
    },
  },
});

// 设置全局国际化实例，给非setup使用
setGlobalI18n(i18n);

export const locale = {
    adapter: createVueI18nAdapter({ i18n, useI18n })
};
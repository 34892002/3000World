// Plugins
import { registerPlugins } from '@/plugins'
// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { en as vuetifyEn, zhHans as vuetifyZhHans } from 'vuetify/locale'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { createI18n, useI18n } from 'vue-i18n'

// 引入自定义语言文件
import en from '@/locales/en.js'
import zhHans from '@/locales/zh-Hans.js'

import { setGlobalI18n } from './utils/api.js'

// Styles
import 'unfonts.css'

const app = createApp(App)

const i18n = createI18n({
    legacy: false,
    locale: 'zhHans',
    fallbackLocale: 'en',
    messages: {
        en: {
            ...en,
            $vuetify: { ...vuetifyEn }
        },
        zhHans: {
            ...zhHans,
            $vuetify: { ...vuetifyZhHans }
        }
    },
})

const vuetify = createVuetify({
    locale: {
        adapter: createVueI18nAdapter({ i18n, useI18n }),
    },
})

app.use(i18n)
app.use(vuetify)

registerPlugins(app)

// 设置全局国际化实例
setGlobalI18n(i18n)

app.mount('#app')

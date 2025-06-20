/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import vuetify from './vuetify'
import { i18n } from "./i18n";
import pinia from '@/stores'
import router from '@/router'

export function registerPlugins (app) {
  app
    .use(i18n)
    .use(vuetify)
    .use(router)
    .use(pinia)
}

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'

import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      imports:['vue', 'vue-router']
    }),
    Components({
      resolvers: [
        IconsResolver(),
        ElementPlusResolver()
      ],
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
      scale: 1.2,
      defaultStyle: '',
      defaultClass: '',
    }),
    UnoCSS()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
})

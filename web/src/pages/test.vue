<template>
    <v-container>
      <!-- 欢迎信息 -->
      <h1>{{ t('messages.welcome') }}</h1>
      
      <!-- 语言切换 -->
      <v-btn @click="changeLocale" class="mb-4">切换语言</v-btn>
      
      <!-- API 示例 -->
      <v-card class="mb-4">
        <v-card-title>API 请求示例</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-btn @click="testGet" :loading="isLoading" color="primary" class="mr-2 mb-2">
                GET 请求测试
              </v-btn>
              <v-btn @click="testPost" :loading="isLoading" color="success" class="mr-2 mb-2">
                POST 请求测试
              </v-btn>
              <v-btn @click="testError" :loading="isLoading" color="error" class="mr-2 mb-2">
                错误处理测试
              </v-btn>
            </v-col>
          </v-row>
          
          <!-- 响应结果显示 -->
          <v-card v-if="apiResponse" class="mt-4" variant="outlined">
            <v-card-title>响应结果</v-card-title>
            <v-card-text>
              <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
      
      <!-- 日期选择器 -->
      <v-date-picker></v-date-picker>
    </v-container>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useApi } from '@/utils/api.js'
  
  const { t, locale } = useI18n()
  const { api, isLoading } = useApi()
  const apiResponse = ref(null)
  
  function changeLocale() {
    const languages = ['en', 'zhHans']
    // 在两种语音之间切换
    const _locale = languages[(languages.indexOf(locale.value) + 1) % languages.length]
    locale.value = _locale
    console.log("🚀 ~ file: index.vue:18 ~ current.value:", locale.value)
  }
  
  // API 测试函数
  const testGet = async () => {
    try {
      // 使用 JSONPlaceholder 作为测试 API
      const response = await api.get('https://jsonplaceholder.typicode.com/posts/1')
      apiResponse.value = {
        type: 'GET Success',
        data: response.data,
        status: response.status
      }
    } catch (error) {
      apiResponse.value = {
        type: 'GET Error',
        message: error.message
      }
    }
  }
  
  const testPost = async () => {
    try {
      const testData = {
        title: 'Test Post',
        body: 'This is a test post from our API wrapper',
        userId: 1
      }
      
      const response = await api.post('https://jsonplaceholder.typicode.com/posts', testData)
      apiResponse.value = {
        type: 'POST Success',
        data: response.data,
        status: response.status
      }
    } catch (error) {
      apiResponse.value = {
        type: 'POST Error',
        message: error.message
      }
    }
  }
  
  const testError = async () => {
    try {
      // 故意请求一个不存在的端点来测试错误处理
      await api.get('https://jsonplaceholder.typicode.com/nonexistent')
    } catch (error) {
      apiResponse.value = {
        type: 'Error Handling Test',
        message: error.message,
        note: '这是预期的错误，用于测试错误处理机制'
      }
    }
  }
  </script>
  
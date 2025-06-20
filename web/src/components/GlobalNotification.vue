<template>
  <v-snackbar-queue
    v-model="queueMessages"
    :location="location"
    :max-width="maxWidth"
    :min-width="minWidth"
    :z-index="zIndex"
    :color="defaultColor"
    :timeout="defaultTimeout"
    class="global-notification"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'

// Props
const props = defineProps({
  // 显示位置
  location: {
    type: String,
    default: 'top'
  },
  // 最大宽度
  maxWidth: {
    type: [String, Number],
    default: 400
  },
  // 最小宽度
  minWidth: {
    type: [String, Number],
    default: 300
  },
  // z-index层级
  zIndex: {
    type: Number,
    default: 9999
  },
  // 默认颜色
  defaultColor: {
    type: String,
    default: 'info'
  },
  // 默认超时时间
  defaultTimeout: {
    type: Number,
    default: 3000
  }
})

// 使用通知store
const notificationStore = useNotificationStore()

/**
 * 队列消息的计算属性
 * 用于v-snackbar-queue的v-model绑定
 * 根据 Vuetify 官方文档，支持字符串数组或对象数组
 */
const queueMessages = computed({
  get() {
    const messages = notificationStore.getMessages
      .filter(message => message != null)
      .map(message => {
        // 如果是字符串，直接返回（最简单的用法）
        if (typeof message === 'string') {
          return message
        }
        
        // 如果是对象，转换为 v-snackbar-queue 支持的格式
        if (typeof message === 'object') {
          return {
            text: message.text || message.message || String(message),
            color: message.color || props.defaultColor,
            timeout: message.timeout !== undefined && message.timeout !== null ? message.timeout : props.defaultTimeout
          }
        }
        
        // 其他类型转换为字符串
        return String(message)
      })
    
    return messages
  },
  set(newMessages) {
    // 当v-snackbar-queue移除消息时，同步更新store
    if (newMessages.length < notificationStore.getMessages.length) {
      notificationStore.removeFirstMessage()
    }
  }
})


</script>

<style scoped>
.global-notification {
  position: fixed;
  z-index: 9999;
}

/* 确保v-snackbar-queue正确显示 */
:deep(.v-snackbar-queue) {
  z-index: 9999 !important;
}
</style>
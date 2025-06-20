import { defineStore } from 'pinia'

/**
 * 全局通知状态管理
 * 用于管理v-snackbar-queue的消息队列
 */
export const useNotificationStore = defineStore('notification', {
  state: () => ({
    // 通知消息队列
    messages: []
  }),

  getters: {
    /**
     * 获取当前消息队列
     * @returns {Array} 消息数组
     */
    getMessages: (state) => state.messages,

    /**
     * 获取消息队列长度
     * @returns {number} 队列长度
     */
    getMessageCount: (state) => state.messages.length
  },

  actions: {
    /**
     * 添加通知消息
     * 支持字符串或对象格式，符合 Vuetify v-snackbar-queue 官方文档
     * @param {string|Object} message - 消息内容或消息对象
     * @param {string} message.text - 消息文本（当为对象时）
     * @param {string} message.color - 消息颜色 (success, error, warning, info)
     * @param {number} message.timeout - 超时时间
     */
    addMessage(message) {
      // 如果是字符串，直接添加（最简单的用法）
      if (typeof message === 'string') {
        this.messages.push(message)
        return
      }
      
      // 如果是对象，构建完整的消息对象
      if (typeof message === 'object' && message !== null) {
        const newMessage = {
          text: message.text || message.message || '',
          color: message.color || 'info',
          timeout: message.timeout,
          ...message
        }
        
        this.messages.push(newMessage)
        return
      }
      
      // 其他类型转换为字符串
      this.messages.push(String(message))
    },



    /**
     * 移除第一个消息（用于v-snackbar-queue自动移除）
     */
    removeFirstMessage() {
      if (this.messages.length > 0) {
        this.messages.shift()
      }
    },

    /**
     * 清空所有消息
     */
    clearMessages() {
      this.messages = []
    },

    /**
     * 显示成功消息
     * @param {string} text - 消息文本
     * @param {Object} options - 其他选项
     */
    showSuccess(text, options = {}) {
      this.addMessage({
        text,
        color: 'success',
        ...options
      })
    },

    /**
     * 显示错误消息
     * @param {string} text - 消息文本
     * @param {Object} options - 其他选项
     */
    showError(text, options = {}) {
      this.addMessage({
        text,
        color: 'error',
        ...options
      })
    },

    /**
     * 显示警告消息
     * @param {string} text - 消息文本
     * @param {Object} options - 其他选项
     */
    showWarning(text, options = {}) {
      this.addMessage({
        text,
        color: 'warning',
        ...options
      })
    },

    /**
     * 显示信息消息
     * @param {string} text - 消息文本
     * @param {Object} options - 其他选项
     */
    showInfo(text, options = {}) {
      this.addMessage({
        text,
        color: 'info',
        ...options
      })
    }
  }
})
import { useNotificationStore } from '@/stores/notification'

/**
 * 全局通知系统的组合式函数
 * 提供便捷的通知调用方法
 * @returns {Object} 通知相关的方法和状态
 */
export function useNotification() {
  const notificationStore = useNotificationStore()

  /**
   * 显示成功通知
   * @param {string} message - 消息内容
   * @param {Object} options - 可选配置
   * @param {number} options.timeout - 超时时间(ms)
   */
  const success = (message, options = {}) => {
    notificationStore.showSuccess(message, options)
  }

  /**
   * 显示错误通知
   * @param {string} message - 消息内容
   * @param {Object} options - 可选配置
   * @param {number} options.timeout - 超时时间(ms)
   */
  const error = (message, options = {}) => {
    notificationStore.showError(message, options)
  }

  /**
   * 显示警告通知
   * @param {string} message - 消息内容
   * @param {Object} options - 可选配置
   * @param {number} options.timeout - 超时时间(ms)
   */
  const warning = (message, options = {}) => {
    notificationStore.showWarning(message, options)
  }

  /**
   * 显示信息通知
   * @param {string} message - 消息内容
   * @param {Object} options - 可选配置
   * @param {number} options.timeout - 超时时间(ms)
   */
  const info = (message, options = {}) => {
    notificationStore.showInfo(message, options)
  }

  /**
   * 自定义通知
   * @param {Object} config - 完整的通知配置
   * @param {string} config.text - 消息文本
   * @param {string} config.color - 消息颜色类型
   * @param {number} config.timeout - 超时时间
   */
  const custom = (config) => {
    notificationStore.addMessage(config)
  }



  /**
   * 清空所有通知
   */
  const clear = () => {
    notificationStore.clearMessages()
  }

  const handleApiError = (msg) => {
    let title = 'request error: '
    const message = `${title} ${msg}`
    error(message)
  }

  return {
    // 基础方法
    success,
    error,
    warning,
    info,
    custom,
    
    // 管理方法
    clear,
    
    // 便捷方法
    handleApiError,
    
    // 状态
    messages: notificationStore.getMessages,
    messageCount: notificationStore.getMessageCount
  }
}

// 默认导出，方便直接使用
export default useNotification
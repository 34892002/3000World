import { ref, readonly } from 'vue'

import { useNotification } from '@/composables/useNotification'

// 延迟初始化通知实例，避免在Pinia未激活时调用
let notification = null

/**
 * 获取通知实例（延迟初始化）
 * @returns {Object} 通知实例
 */
function getNotification() {
  if (!notification) {
    notification = useNotification()
  }
  return notification
}

// 全局loading状态
const isLoading = ref(false)
const loadingCount = ref(0)

// API基础配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
}

// 错误码映射
const ERROR_MESSAGES = {
  400: 'api.error.badRequest',
  401: 'api.error.unauthorized',
  403: 'api.error.forbidden',
  404: 'api.error.notFound',
  500: 'api.error.serverError',
  502: 'api.error.badGateway',
  503: 'api.error.serviceUnavailable',
  504: 'api.error.gatewayTimeout'
}

// 全局国际化函数获取器
let globalI18n = null

// 设置全局国际化实例（在main.js中调用）
export function setGlobalI18n(i18n) {
  globalI18n = i18n
}

// 管理loading状态
function setLoading(loading) {
  if (loading) {
    loadingCount.value++
  } else {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }
  isLoading.value = loadingCount.value > 0
}

// 获取认证token
function getAuthToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
}

// 处理响应错误
function handleError(error, showMessage = true) {
  // 国际化函数
  const t = globalI18n?.global?.t || (key => key)

  let message = t('api.error.unknown')

  if (error.response) {
    // 服务器响应错误
    const status = error.response.status
    message = t(ERROR_MESSAGES[status] || 'api.error.unknown')

    // 401错误处理 - 清除token并跳转登录
    if (status === 401) {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
      // 可以在这里添加路由跳转到登录页
      // router.push('/login')
    }
  } else if (error.request) {
    // 网络错误
    message = t('api.error.network')
  } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
    // 超时错误
    message = t('api.error.gatewayTimeout')
  }

  if (showMessage) {
    // 这里可以集成vuetify的snackbar或其他通知组件
    console.error('API Error:', message, error)
    getNotification().handleApiError(message)
  }

  return Promise.reject({ message, originalError: error })
}

// 创建请求实例
class ApiClient {
  constructor(config = {}) {
    this.config = { ...API_CONFIG, ...config }
  }

  // 通用请求方法
  async request(url, options = {}) {
    const {
      method = 'GET',
      data,
      params,
      headers = {},
      showLoading = true,
      showError = true,
      timeout = this.config.timeout,
      ...restOptions
    } = options

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`

    // 构建查询参数
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value)
        }
      })
    }
    const queryString = searchParams.toString()
    const requestUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl

    // 构建请求头
    const requestHeaders = {
      ...this.config.headers,
      ...headers
    }

    // 添加认证token
    const token = getAuthToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }

    // 构建请求配置
    const fetchOptions = {
      method,
      headers: requestHeaders,
      ...restOptions
    }

    // 添加请求体
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      if (data instanceof FormData) {
        // FormData不需要设置Content-Type
        delete fetchOptions.headers['Content-Type']
        fetchOptions.body = data
      } else {
        fetchOptions.body = JSON.stringify(data)
      }
    }

    // 显示loading
    if (showLoading) {
      setLoading(true)
    }

    try {
      // 创建AbortController用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      fetchOptions.signal = controller.signal

      const response = await fetch(requestUrl, fetchOptions)
      clearTimeout(timeoutId)

      // 检查响应状态
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: await response.text()
        }
        throw error
      }

      // 解析响应数据
      const contentType = response.headers.get('content-type')
      let responseData

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout')
        timeoutError.request = true
        throw timeoutError
      }
      throw error
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // GET请求
  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' })
      .catch(error => handleError(error, options.showError))
  }

  // POST请求
  post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', data })
      .catch(error => handleError(error, options.showError))
  }

  // PUT请求
  put(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PUT', data })
      .catch(error => handleError(error, options.showError))
  }

  // PATCH请求
  patch(url, data, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', data })
      .catch(error => handleError(error, options.showError))
  }

  // DELETE请求
  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' })
      .catch(error => handleError(error, options.showError))
  }

  // 文件上传
  upload(url, file, options = {}) {
    const formData = new FormData()
    formData.append('file', file)

    // 添加额外的字段
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.post(url, formData, {
      ...options,
      showLoading: options.showLoading !== false
    })
  }
}

// 创建默认实例
const api = new ApiClient()

// 导出
export {
  api as default,
  ApiClient,
  isLoading,
  setLoading,
  getAuthToken,
  handleError
}

// 便捷方法
export const useApi = () => {
  return {
    api,
    isLoading: readonly(isLoading),
    get: api.get.bind(api),
    post: api.post.bind(api),
    put: api.put.bind(api),
    patch: api.patch.bind(api),
    delete: api.delete.bind(api),
    upload: api.upload.bind(api)
  }
}
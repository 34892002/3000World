# API 请求封装使用指南

这是一个为 Vue 3 + Vuetify 项目设计的 API 请求封装，提供了完整的错误处理、loading 状态管理、国际化支持等最佳实践。

## 特性

- ✅ 基于原生 `fetch` API
- ✅ 自动 loading 状态管理
- ✅ 统一错误处理和国际化
- ✅ 自动 token 认证
- ✅ 请求/响应拦截
- ✅ 文件上传支持
- ✅ TypeScript 友好
- ✅ 超时控制
- ✅ 请求取消

## 快速开始

### 1. 环境配置

复制 `.env.example` 到 `.env` 并配置你的 API 基础 URL：

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### 2. 基础使用

```javascript
import { useApi } from '@/utils/api.js'

const { api, isLoading } = useApi()

// GET 请求
const users = await api.get('/users')

// POST 请求
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// PUT 请求
const updatedUser = await api.put('/users/1', userData)

// DELETE 请求
await api.delete('/users/1')
```

### 3. 在组件中使用

```vue
<template>
  <div>
    <!-- 全局 loading 指示器 -->
    <v-progress-linear v-if="isLoading" indeterminate></v-progress-linear>
    
    <v-btn @click="loadData">加载数据</v-btn>
    
    <v-list>
      <v-list-item v-for="item in items" :key="item.id">
        {{ item.name }}
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useApi } from '@/utils/api.js'

const { api, isLoading } = useApi()
const items = ref([])

const loadData = async () => {
  try {
    const response = await api.get('/items')
    items.value = response.data
  } catch (error) {
    // 错误已经被自动处理和显示
    console.error('加载失败:', error.message)
  }
}
</script>
```

## 高级用法

### 1. 自定义请求选项

```javascript
// 禁用 loading 和错误提示
const response = await api.get('/users', {
  showLoading: false,
  showError: false
})

// 添加查询参数
const response = await api.get('/users', {
  params: {
    page: 1,
    limit: 10,
    search: 'john'
  }
})

// 自定义请求头
const response = await api.post('/users', userData, {
  headers: {
    'X-Custom-Header': 'value'
  }
})

// 设置超时时间
const response = await api.get('/users', {
  timeout: 5000 // 5秒
})
```

### 2. 文件上传

```javascript
// 单文件上传
const file = document.querySelector('input[type="file"]').files[0]
const response = await api.upload('/upload', file)

// 带额外字段的文件上传
const response = await api.upload('/upload', file, {
  fields: {
    category: 'avatar',
    userId: 123
  }
})
```

### 3. 创建自定义 API 实例

```javascript
import { ApiClient } from '@/utils/api.js'

// 创建专用的 API 实例
const authApi = new ApiClient({
  baseURL: 'https://auth.example.com/api',
  timeout: 15000,
  headers: {
    'X-Client-Type': 'web'
  }
})

const loginResponse = await authApi.post('/login', credentials)
```

### 4. 业务逻辑封装

参考 `api-example.js` 文件，创建业务相关的 API 封装：

```javascript
// composables/useUserApi.js
import { useApi } from '@/utils/api.js'
import { ref } from 'vue'

export function useUserApi() {
  const { api, isLoading } = useApi()
  const users = ref([])
  
  const getUsers = async (params = {}) => {
    const response = await api.get('/users', { params })
    users.value = response.data
    return response.data
  }
  
  const createUser = async (userData) => {
    const response = await api.post('/users', userData)
    users.value.push(response.data)
    return response.data
  }
  
  return {
    users,
    isLoading,
    getUsers,
    createUser
  }
}
```

## 错误处理

### 1. 自动错误处理

所有 API 请求的错误都会被自动处理，包括：

- 网络错误
- HTTP 状态码错误
- 超时错误
- 认证错误（401 会自动清除 token）

### 2. 自定义错误处理

```javascript
try {
  const response = await api.get('/users')
} catch (error) {
  if (error.originalError?.response?.status === 404) {
    // 处理 404 错误
    console.log('用户不存在')
  } else {
    // 其他错误
    console.error('请求失败:', error.message)
  }
}
```

### 3. 添加新的错误信息

在语言文件中添加新的错误信息：

```javascript
// locales/zh-Hans.js
export default {
  api: {
    error: {
      // 添加自定义错误信息
      customError: "自定义错误信息"
    }
  }
}
```

## 认证处理

### 1. Token 存储

API 封装会自动从以下位置获取认证 token：

- `localStorage.getItem('auth_token')`
- `sessionStorage.getItem('auth_token')`

### 2. 登录示例

```javascript
const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials)
    const { token } = response.data
    
    // 存储 token
    localStorage.setItem('auth_token', token)
    
    return response.data
  } catch (error) {
    console.error('登录失败:', error.message)
    throw error
  }
}

const logout = () => {
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_token')
  // 跳转到登录页
}
```

## 国际化支持

错误信息支持多语言，当前支持中文和英文。错误信息会根据当前语言设置自动显示。

要添加新语言支持，请在对应的语言文件中添加 `api.error` 部分。

## 最佳实践

1. **业务逻辑分离**：为不同的业务模块创建专门的 API 封装函数
2. **错误边界**：在组件级别处理特定的业务错误
3. **Loading 状态**：利用全局 `isLoading` 状态显示加载指示器
4. **缓存策略**：对于不经常变化的数据，考虑添加缓存机制
5. **请求去重**：对于相同的请求，考虑添加去重逻辑
6. **离线处理**：考虑添加网络状态检测和离线缓存

## 扩展功能

你可以根据项目需求扩展以下功能：

- 请求重试机制
- 响应数据缓存
- 请求队列管理
- 上传进度监控
- WebSocket 集成
- 数据模拟（Mock）

## 故障排除

### 常见问题

1. **CORS 错误**：确保后端 API 正确配置了 CORS
2. **401 错误**：检查 token 是否正确存储和发送
3. **网络错误**：检查 API 基础 URL 配置
4. **超时错误**：根据网络情况调整超时时间

### 调试技巧

1. 打开浏览器开发者工具的网络面板查看请求详情
2. 检查控制台的错误日志
3. 使用 `showError: false` 禁用自动错误提示进行调试
4. 检查环境变量配置是否正确
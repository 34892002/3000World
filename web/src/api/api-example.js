// API使用示例
import { useApi } from '@/utils/api'
import { ref } from 'vue'

// 在组件中使用API的示例
export function useUserApi() {
  const { api, isLoading } = useApi()
  const users = ref([])
  const user = ref(null)
  
  // 获取用户列表
  const getUsers = async (params = {}) => {
    try {
      const response = await api.get('/users', { params })
      users.value = response.data
      return response.data
    } catch (error) {
      console.error('获取用户列表失败:', error.message)
      throw error
    }
  }
  
  // 获取单个用户
  const getUser = async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      user.value = response.data
      return response.data
    } catch (error) {
      console.error('获取用户失败:', error.message)
      throw error
    }
  }
  
  // 创建用户
  const createUser = async (userData) => {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      console.error('创建用户失败:', error.message)
      throw error
    }
  }
  
  // 更新用户
  const updateUser = async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error('更新用户失败:', error.message)
      throw error
    }
  }
  
  // 删除用户
  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`)
      // 从本地列表中移除
      users.value = users.value.filter(u => u.id !== id)
    } catch (error) {
      console.error('删除用户失败:', error.message)
      throw error
    }
  }
  
  // 上传头像
  const uploadAvatar = async (userId, file) => {
    try {
      const response = await api.upload(`/users/${userId}/avatar`, file, {
        fields: { userId }
      })
      return response.data
    } catch (error) {
      console.error('上传头像失败:', error.message)
      throw error
    }
  }
  
  return {
    users,
    user,
    isLoading,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    uploadAvatar
  }
}

// 在Vue组件中的使用示例
/*
<template>
  <div>
    <v-progress-linear v-if="isLoading" indeterminate></v-progress-linear>
    
    <v-btn @click="loadUsers">加载用户</v-btn>
    
    <v-list>
      <v-list-item v-for="user in users" :key="user.id">
        <v-list-item-title>{{ user.name }}</v-list-item-title>
        <template #append>
          <v-btn @click="editUser(user.id)" size="small">编辑</v-btn>
          <v-btn @click="removeUser(user.id)" size="small" color="error">删除</v-btn>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { useUserApi } from '@/utils/api-example.js'

const {
  users,
  isLoading,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} = useUserApi()

const loadUsers = async () => {
  await getUsers({ page: 1, limit: 10 })
}

const editUser = async (id) => {
  const userData = await getUser(id)
  // 打开编辑对话框
}

const removeUser = async (id) => {
  if (confirm('确定要删除这个用户吗？')) {
    await deleteUser(id)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadUsers()
})
</script>
*/
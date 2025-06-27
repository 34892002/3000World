<template>
  <div class="database-example pa-6 ma-6 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">3000World 数据库工具</h1>

    <!-- 嵌入向量 -->
    <div class="mb-6 pa-4 border rounded-lg">
      <h2 class="text-xl font-semibold mb-4">嵌入向量</h2>
      <div class="mb-4">
        <input v-model="inputText" placeholder="输入文本" class="p-2 border rounded mr-2">
        <button @click="createEmbedding" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="!inputText.trim() || aiLoading">
          创建嵌入向量
        </button>
      </div>
      <div class="mb-4">
        <input v-model="queryText" placeholder="输入查询文本" class="p-2 border rounded mr-2">
        <button @click="queryEmbedding" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="!queryText.trim() || aiLoading">
          查询嵌入向量
        </button>
      </div>
    </div>


    <!-- 连接状态 -->
    <div class="mb-6 pa-4 rounded-lg" :class="isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      <h2 class="text-lg font-semibold mb-2">连接状态</h2>
      <p>{{ isConnected ? `已连接到世界: ${currentWorld}` : '未连接' }}</p>
      <p v-if="loading" class="text-blue-600">加载中...</p>
      <p v-if="error" class="text-red-600">错误: {{ error }}</p>
    </div>

    <!-- 世界管理 -->
    <div class="mb-6 pa-4 border rounded-lg">
      <h2 class="text-xl font-semibold mb-4">世界管理</h2>

      <div class="mb-4 d-flex align-center">
        <label class="block text-sm font-medium mb-2">可用世界:</label>
        <select v-model="selectedWorld" class="w-50 ml-6 pa-2 border rounded text-black" title="选择要连接的世界">
          <option value="">选择世界...</option>
          <option v-for="world in availableWorlds" :key="world" :value="world">
            {{ world }}
          </option>
        </select>
      </div>

      <div class="mb-4">
        <input v-model="newWorldName" placeholder="新世界名称" class="p-2 border rounded mr-2">
        <button @click="createWorld" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="!newWorldName.trim() || loading">
          创建世界
        </button>
      </div>

      <div class="flex gap-2">
        <button @click="connectWorld" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="!selectedWorld || loading">
          连接世界
        </button>

        <button @click="disconnect" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          :disabled="!isConnected || loading">
          断开连接
        </button>

        <button @click="refresh" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          :disabled="!isConnected || loading">
          刷新数据
        </button>
      </div>
    </div>

    <!-- 数据展示 -->
    <div v-if="isConnected" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 角色管理 -->
      <div class="pa-4 border rounded-lg">
        <h3 class="text-lg font-semibold mb-4">角色管理 ({{ characters.length }})</h3>

        <!-- 角色列表 -->
        <div class="mb-4 max-h-40 overflow-y-auto">
          <div v-for="character in characters" :key="character.id" class="mb-2 p-2 bg-gray-50 rounded">
            <div class="flex justify-between items-center">
              <span class="font-medium">
                {{ character.name }}
                <span v-if="character.isPlayer" class="text-xs bg-yellow-200 px-1 rounded">主角</span>
              </span>
              <button @click="deleteCharacter(character.id)" class="text-red-500 hover:text-red-700 text-sm">
                删除
              </button>
            </div>
            <p class="text-sm text-gray-600 truncate">{{ character.persona }}</p>
          </div>
        </div>

        <!-- 添加角色 -->
        <div class="space-y-2">
          <input v-model="newCharacter.name" placeholder="角色名称" class="w-full p-2 border rounded text-sm">
          <textarea v-model="newCharacter.persona" placeholder="角色设定"
            class="w-full p-2 border rounded text-sm h-20"></textarea>
          <textarea v-model="newCharacter.greeting" placeholder="问候语"
            class="w-full p-2 border rounded text-sm h-16"></textarea>
          <label class="flex items-center text-sm">
            <input v-model="newCharacter.isPlayer" type="checkbox" class="mr-2">
            设为主角
          </label>
          <button @click="addCharacter"
            class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            :disabled="!newCharacter.name.trim() || loading">
            添加角色
          </button>
        </div>
      </div>

      <!-- 群组管理 -->
      <div class="pa-4 border rounded-lg">
        <h3 class="text-lg font-semibold mb-4">群组管理 ({{ groups.length }})</h3>

        <!-- 群组列表 -->
        <div class="mb-4 max-h-40 overflow-y-auto">
          <div v-for="group in groups" :key="group.id" class="mb-2 p-2 bg-gray-50 rounded">
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ group.name }}</span>
              <button @click="deleteGroup(group.id)" class="text-red-500 hover:text-red-700 text-sm">
                删除
              </button>
            </div>
            <p class="text-sm text-gray-600">
              成员: {{ getGroupMemberNames(group.characterIds).join(', ') }}
            </p>
          </div>
        </div>

        <!-- 添加群组 -->
        <div class="space-y-2">
          <input v-model="newGroup.name" placeholder="群组名称" class="w-full p-2 border rounded text-sm">
          <div class="text-sm">
            <p class="mb-1">选择成员:</p>
            <div class="max-h-20 overflow-y-auto border rounded p-1">
              <label v-for="character in characters" :key="character.id" class="flex items-center text-xs mb-1">
                <input v-model="newGroup.characterIds" :value="character.id" type="checkbox" class="mr-1">
                {{ character.name }}
              </label>
            </div>
          </div>
          <button @click="addGroup"
            class="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            :disabled="!newGroup.name.trim() || newGroup.characterIds.length === 0 || loading">
            添加群组
          </button>
        </div>
      </div>

      <!-- 世界设定管理 -->
      <div class="pa-4 border rounded-lg">
        <h3 class="text-lg font-semibold mb-4">世界设定 ({{ worldbooks.length }})</h3>

        <!-- 世界设定列表 -->
        <div class="mb-4 max-h-40 overflow-y-auto">
          <div v-for="entry in worldbooks" :key="entry.id" class="mb-2 p-2 bg-gray-50 rounded">
            <div class="flex justify-between items-center">
              <span class="font-medium text-sm">{{ entry.keywords.split(',')[0] }}...</span>
              <button @click="deleteWorldbook(entry.id)" class="text-red-500 hover:text-red-700 text-sm">
                删除
              </button>
            </div>
            <p class="text-xs text-gray-600 truncate">{{ entry.content }}</p>
          </div>
        </div>

        <!-- 添加世界设定 -->
        <div class="space-y-2">
          <input v-model="newWorldbook.keywords" placeholder="关键词 (用逗号分隔)" class="w-full p-2 border rounded text-sm">
          <textarea v-model="newWorldbook.content" placeholder="设定内容"
            class="w-full p-2 border rounded text-sm h-20"></textarea>
          <button @click="addWorldbook"
            class="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            :disabled="!newWorldbook.keywords.trim() || !newWorldbook.content.trim() || loading">
            添加设定
          </button>
        </div>
      </div>
    </div>

    <!-- 配置管理 -->
    <div v-if="isConnected" class="mt-6 pa-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-4">API 配置</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">API Key:</label>
          <input v-model="configForm.apiKey" type="password" class="w-full p-2 border rounded text-sm"
            placeholder="输入 API Key">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">API URL:</label>
          <input v-model="configForm.apiUrl" class="w-full p-2 border rounded text-sm" placeholder="API 地址">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">模型:</label>
          <input v-model="configForm.model" class="w-full p-2 border rounded text-sm" placeholder="模型名称">
        </div>
      </div>
      <button @click="updateConfig" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        :disabled="loading">
        保存配置
      </button>
    </div>

    <!-- 数据导入导出 -->
    <div v-if="isConnected" class="mt-6 pa-4 border rounded-lg">
      <h3 class="text-lg font-semibold mb-4">数据导入导出</h3>
      <div class="flex gap-4">
        <button @click="exportData" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="loading">
          导出世界数据
        </button>

        <input ref="fileInput" type="file" accept=".json" @change="handleFileImport" class="hidden">
        <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="loading">
          导入世界数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useDatabase } from '@/composables/useDatabase'
import { useAIApi } from '@/api/model'

const { isLoading: aiLoading, createEmbeddings } = useAIApi()
// 使用数据库组合式函数
const {
  // 状态
  isConnected,
  currentWorld,
  loading,
  error,

  // 数据
  characters,
  groups,
  worldbooks,
  config,

  // VectorDB 实例
  vectorDB,
  initVectorDB,

  // 方法
  connectToWorld,
  getAvailableWorlds,
  disconnect,
  refresh,
  saveCharacter,
  deleteCharacter,
  saveGroup,
  deleteGroup,
  saveWorldbook,
  deleteWorldbook,
  saveConfig,
  exportWorld,
  importWorld,
  clearError
} = useDatabase()

const inputText = ref('')
const queryText = ref('')

// 本地状态
const availableWorlds = ref([])
const selectedWorld = ref('')
const newWorldName = ref('')

// 表单数据
const newCharacter = reactive({
  name: '',
  persona: '',
  greeting: '',
  isPlayer: false
})

const newGroup = reactive({
  name: '',
  characterIds: []
})

const newWorldbook = reactive({
  keywords: '',
  content: ''
})

const configForm = reactive({
  apiKey: '',
  apiUrl: '',
  model: ''
})

// 监听配置变化
watch(config, (newConfig) => {
  Object.assign(configForm, newConfig)
}, { immediate: true })

// 方法
const loadWorlds = async () => {
  availableWorlds.value = await getAvailableWorlds()
}

const createWorld = async () => {
  if (await connectToWorld(newWorldName.value)) {
    newWorldName.value = ''
    await loadWorlds()
  }
}

const connectWorld = async () => {
  await connectToWorld(selectedWorld.value)
}

const addCharacter = async () => {
  if (await saveCharacter({ ...newCharacter })) {
    Object.assign(newCharacter, {
      name: '',
      persona: '',
      greeting: '',
      isPlayer: false
    })
  }
}

const addGroup = async () => {
  if (await saveGroup({ ...newGroup })) {
    Object.assign(newGroup, {
      name: '',
      characterIds: []
    })
  }
}

const addWorldbook = async () => {
  if (await saveWorldbook({ ...newWorldbook })) {
    Object.assign(newWorldbook, {
      keywords: '',
      content: ''
    })
  }
}

const updateConfig = async () => {
  await saveConfig({ ...configForm })
}

const getGroupMemberNames = (characterIds) => {
  return characterIds
    .map(id => characters.value.find(char => char.id === id)?.name)
    .filter(Boolean)
}

const exportData = async () => {
  const data = await exportWorld()
  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentWorld.value}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const handleFileImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.worldName) {
      alert('无效的世界数据文件')
      return
    }

    if (await importWorld(data, data.worldName)) {
      alert('导入成功！')
      await loadWorlds()
    } else {
      alert('导入失败')
    }
  } catch (err) {
    alert(`导入失败: ${err.message}`)
  }

  // 清空文件输入
  event.target.value = ''
}

const createEmbedding = async () => {
  // 确保 VectorDB 已初始化
  if (!vectorDB.value) {
    await initVectorDB()
  }

  if (!vectorDB.value) {
    console.error('VectorDB 未初始化')
    return
  }

  const embeddings = await createEmbeddings(inputText.value)
  const key1 = await vectorDB.value.insert({
    embedding: embeddings,
    text: inputText.value,
  });
  console.log(key1)
  console.log(embeddings)
}

const queryEmbedding = async () => {
  // 确保 VectorDB 已初始化
  if (!vectorDB.value) {
    await initVectorDB()
  }

  if (!vectorDB.value) {
    console.error('VectorDB 未初始化')
    return
  }

  const embeddings = await createEmbeddings(queryText.value)
  const results = await vectorDB.value.query(embeddings, {
    limit: 3,
  })
  // 排序后的text数组
  const texts = results.map(item => item.object.text)
  console.log(texts)
}

// 生命周期
onMounted(() => {
  loadWorlds()
})
</script>

<style scoped>
select {
  background-color: white;
}

.database-example {
  font-family: 'Inter', sans-serif;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .grid-cols-1.md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.gap-6 {
  gap: 1.5rem;
}

.max-h-20 {
  max-height: 5rem;
}

.max-h-40 {
  max-height: 10rem;
}

.overflow-y-auto {
  overflow-y: auto;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
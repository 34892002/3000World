# 3000World 数据库工具

这个数据库工具从原始的 `index.html` 文件中提取了所有 IndexedDB 相关的方法，并封装成了现代化的 JavaScript 类和 Vue 组合式函数，方便在项目中使用。

## 文件结构

```
web/src/
├── utils/
│   ├── database.js          # 核心数据库类
│   └── README.md           # 本文档
├── composables/
│   └── useDatabase.js      # Vue 组合式函数
└── examples/
    └── DatabaseExample.vue # 使用示例组件
```

## 核心组件

### 1. Database 类 (`utils/database.js`)

这是核心的数据库操作类，提供了所有 IndexedDB 操作的封装。

#### 主要功能：
- **数据库初始化**：自动创建和升级数据库结构
- **多世界支持**：每个世界使用独立的数据库
- **CRUD 操作**：完整的增删改查功能
- **数据导入导出**：支持世界数据的备份和恢复
- **配置管理**：API 配置的持久化存储

#### 数据存储结构：
- `characters`：角色数据（名称、设定、问候语等）
- `groups`：群组数据（群组名称、成员列表）
- `worldbooks`：世界设定（关键词、内容）
- `config`：配置信息（API 密钥、URL、模型等）
- `chat_history`：聊天记录（会话历史）

#### 基本使用：

```javascript
import { Database } from '@/utils/database'

// 创建数据库实例
const db = new Database()

// 连接到世界
await db.connect('MyWorld')

// 保存角色
const character = {
  name: '艾莉丝',
  persona: '一个聪明的魔法师',
  greeting: '你好！我是艾莉丝。',
  isPlayer: false
}
await db.saveCharacter(character)

// 获取所有角色
const characters = await db.getAllCharacters()

// 保存配置
await db.saveConfig({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.example.com',
  model: 'gpt-3.5-turbo'
})
```

### 2. useDatabase 组合式函数 (`composables/useDatabase.js`)

这是为 Vue 3 设计的组合式函数，提供了响应式的数据库操作接口。

#### 主要特性：
- **响应式状态**：自动更新的连接状态、数据缓存
- **错误处理**：统一的错误管理
- **加载状态**：操作进度指示
- **数据缓存**：减少数据库查询次数

#### 在 Vue 组件中使用：

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else-if="isConnected">
      <h2>当前世界: {{ currentWorld }}</h2>
      
      <!-- 角色列表 -->
      <div v-for="character in characters" :key="character.id">
        {{ character.name }}
        <button @click="deleteCharacter(character.id)">删除</button>
      </div>
      
      <!-- 添加角色 -->
      <button @click="addNewCharacter">添加角色</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDatabase } from '@/composables/useDatabase'

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
  
  // 方法
  connectToWorld,
  saveCharacter,
  deleteCharacter
} = useDatabase()

// 连接到世界
const connectWorld = async () => {
  await connectToWorld('MyWorld')
}

// 添加新角色
const addNewCharacter = async () => {
  await saveCharacter({
    name: '新角色',
    persona: '角色设定',
    greeting: '问候语'
  })
}
</script>
```

## API 参考

### Database 类方法

#### 连接管理
- `connect(worldName)` - 连接到指定世界
- `disconnect()` - 断开连接
- `getAvailableWorlds()` - 获取可用世界列表

#### 角色管理
- `saveCharacter(character)` - 保存角色
- `getAllCharacters()` - 获取所有角色
- `getCharacter(id)` - 获取指定角色
- `deleteCharacter(id)` - 删除角色

#### 群组管理
- `saveGroup(group)` - 保存群组
- `getAllGroups()` - 获取所有群组
- `getGroup(id)` - 获取指定群组
- `deleteGroup(id)` - 删除群组
- `getGroupCharacters(groupId)` - 获取群组成员

#### 世界设定管理
- `saveWorldbook(entry)` - 保存世界设定
- `getAllWorldbooks()` - 获取所有世界设定
- `deleteWorldbook(id)` - 删除世界设定
- `searchWorldbooks(keywords)` - 搜索世界设定

#### 聊天记录管理
- `getChatHistory(sessionId)` - 获取聊天记录
- `saveMessage(sessionId, message)` - 保存消息
- `deleteChatHistory(sessionId)` - 删除聊天记录

#### 配置管理
- `saveConfig(config)` - 保存配置
- `getConfig()` - 获取配置

#### 数据导入导出
- `exportWorld()` - 导出世界数据
- `importWorld(data, worldName)` - 导入世界数据

### useDatabase 组合式函数

#### 响应式状态
- `isConnected` - 连接状态
- `currentWorld` - 当前世界名称
- `loading` - 加载状态
- `error` - 错误信息
- `characters` - 角色列表
- `groups` - 群组列表
- `worldbooks` - 世界设定列表
- `config` - 配置信息

#### 方法
所有 Database 类的方法都有对应的包装函数，会自动更新响应式状态。

## 数据结构

### 角色 (Character)
```javascript
{
  id: 'uuid',           // 自动生成
  name: 'string',       // 角色名称
  persona: 'string',    // 角色设定
  greeting: 'string',   // 问候语
  isPlayer: boolean,    // 是否为玩家角色
  avatar: 'string'      // 头像 URL（可选）
}
```

### 群组 (Group)
```javascript
{
  id: 'uuid',              // 自动生成
  name: 'string',          // 群组名称
  characterIds: ['uuid']   // 成员角色 ID 列表
}
```

### 世界设定 (Worldbook)
```javascript
{
  id: 'uuid',           // 自动生成
  keywords: 'string',   // 关键词（逗号分隔）
  content: 'string'     // 设定内容
}
```

### 配置 (Config)
```javascript
{
  apiKey: 'string',     // API 密钥
  apiUrl: 'string',     // API 地址
  model: 'string',      // 模型名称
  temperature: number,  // 温度参数（可选）
  maxTokens: number     // 最大令牌数（可选）
}
```

### 聊天消息 (Message)
```javascript
{
  id: 'uuid',           // 自动生成
  sessionId: 'string',  // 会话 ID
  characterId: 'uuid',  // 发送者角色 ID
  content: 'string',    // 消息内容
  timestamp: number,    // 时间戳
  type: 'string'        // 消息类型（user/assistant）
}
```

## 错误处理

数据库操作可能抛出以下类型的错误：

- `DatabaseError` - 数据库连接或操作错误
- `ValidationError` - 数据验证错误
- `NotFoundError` - 数据不存在错误

建议使用 try-catch 块来处理错误：

```javascript
try {
  await db.saveCharacter(character)
} catch (error) {
  console.error('保存角色失败:', error.message)
  // 处理错误
}
```

## 性能优化建议

1. **批量操作**：对于大量数据操作，考虑使用事务
2. **数据缓存**：使用 useDatabase 组合式函数的缓存功能
3. **索引优化**：数据库已为常用查询字段创建索引
4. **分页加载**：对于大量聊天记录，考虑分页加载

## 迁移指南

如果你正在从原始的 `index.html` 代码迁移，以下是主要的变化：

### 原始代码
```javascript
// 原始代码
const transaction = db.transaction(['characters'], 'readwrite')
const store = transaction.objectStore('characters')
store.add(character)
```

### 新的 API
```javascript
// 新的 API
const database = new Database()
await database.connect('worldName')
await database.saveCharacter(character)
```

### Vue 组件中
```javascript
// 使用组合式函数
const { saveCharacter } = useDatabase()
await saveCharacter(character)
```

## 示例项目

查看 `examples/DatabaseExample.vue` 文件，了解完整的使用示例，包括：
- 世界管理
- 角色、群组、世界设定的 CRUD 操作
- 配置管理
- 数据导入导出
- 错误处理

这个示例展示了如何在实际的 Vue 应用中使用数据库工具。
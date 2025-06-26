# VectorDB 向量数据库工具

基于 IndexedDB 的高性能向量相似度搜索库，支持大规模向量数据的存储和快速检索。

## 📋 功能特性

- ✅ **高效存储**: 使用 Float32Array 压缩存储，内存使用减少 50%
- ✅ **快速检索**: 基于余弦相似度的向量搜索
- ✅ **智能缓存**: 查询结果缓存，提升重复查询性能
- ✅ **批量操作**: 支持批量插入和处理
- ✅ **性能监控**: 内置性能指标统计
- ✅ **维度验证**: 自动检测和验证向量维度一致性
- ✅ **阈值过滤**: 支持相似度阈值过滤

## 🚀 快速开始

### 安装和导入

```javascript
import { VectorDB } from './vector.js';
```

### 基本使用

```javascript
// 创建向量数据库实例
const vectorDB = new VectorDB({
  dbName: 'myVectorDB',
  objectStore: 'embeddings',
  vectorPath: 'vector'  // 对象中向量数据的字段名
});

// 插入向量数据
const document = {
  text: '这是一个示例文档',
  vector: [0.1, 0.2, 0.3, 0.4, 0.5]  // 5维向量
};

const key = await vectorDB.insert(document);
console.log('插入成功，键值:', key);

// 查询相似向量
const queryVector = [0.15, 0.25, 0.35, 0.45, 0.55];
const results = await vectorDB.query(queryVector, {
  limit: 10,      // 返回前10个最相似的结果
  threshold: 0.5  // 相似度阈值
});

console.log('搜索结果:', results);
```

## 📖 API 文档

### 构造函数

```javascript
new VectorDB(options)
```

**参数:**
- `options.dbName` (string): 数据库名称，默认 'vectorDB'
- `options.objectStore` (string): 对象存储名称，默认 'vectors'
- `options.vectorPath` (string): 向量字段路径，必需

### 核心方法

#### insert(object)
插入单个对象到向量数据库。

```javascript
const key = await vectorDB.insert({
  content: '文档内容',
  vector: [0.1, 0.2, 0.3]  // 向量数据
});
```

**返回:** Promise<number> - 插入的键值

#### batchInsert(objects)
批量插入多个对象。

```javascript
const objects = [
  { vector: [0.1, 0.2, 0.3] },
  { vector: [0.4, 0.5, 0.6] }
];
const keys = await vectorDB.batchInsert(objects);
```

**返回:** Promise<Array<number>> - 插入的键值数组

#### query(queryVector, options)
查询最相似的向量。

```javascript
const results = await vectorDB.query([0.1, 0.2, 0.3], {
  limit: 5,       // 返回结果数量
  threshold: 0.7  // 相似度阈值
});
```

**参数:**
- `queryVector` (Array<number>): 查询向量
- `options.limit` (number): 返回结果数量，默认 10
- `options.threshold` (number): 相似度阈值，默认 0.0

**返回:** Promise<Array<Object>> - 相似度结果数组

#### update(key, object)
更新指定键值的对象。

```javascript
await vectorDB.update(key, {
  content: '更新后的内容',
  vector: [0.2, 0.3, 0.4]
});
```

#### delete(key)
删除指定键值的对象。

```javascript
await vectorDB.delete(key);
```

### 工具方法

#### getStats()
获取数据库统计信息。

```javascript
const stats = await vectorDB.getStats();
console.log(stats);
// {
//   totalRecords: 1000,
//   vectorDimension: 1536,
//   cacheSize: 50,
//   metrics: { queryCount: 100, avgQueryTime: 15.5, ... }
// }
```

#### getMetrics()
获取性能指标。

```javascript
const metrics = vectorDB.getMetrics();
console.log(metrics);
// {
//   queryCount: 100,
//   avgQueryTime: 15.5,
//   totalQueryTime: 1550,
//   insertCount: 1000
// }
```

#### clearCache()
清理查询缓存。

```javascript
vectorDB.clearCache();
```

#### resetMetrics()
重置性能指标。

```javascript
vectorDB.resetMetrics();
```

## 🔧 高级用法

### 大规模数据处理

```javascript
// 批量插入大量数据
const batchSize = 1000;
const totalData = 100000;

for (let i = 0; i < totalData; i += batchSize) {
  const batch = generateVectorBatch(i, batchSize);
  await vectorDB.batchInsert(batch);
  console.log(`已处理 ${i + batchSize} / ${totalData}`);
}
```

### 性能优化建议

```javascript
// 1. 使用合适的批处理大小
const vectorDB = new VectorDB({
  dbName: 'optimizedDB',
  objectStore: 'vectors',
  vectorPath: 'embedding'
});

// 2. 定期清理缓存
setInterval(() => {
  vectorDB.clearCache();
}, 300000); // 每5分钟清理一次

// 3. 监控性能指标
const metrics = vectorDB.getMetrics();
if (metrics.avgQueryTime > 100) {
  console.warn('查询性能下降，建议优化');
}
```

### 错误处理

```javascript
try {
  const results = await vectorDB.query(queryVector);
  console.log('查询成功:', results);
} catch (error) {
  if (error.message.includes('向量维度不匹配')) {
    console.error('向量维度错误:', error.message);
  } else {
    console.error('查询失败:', error);
  }
}
```

## 📊 性能特性

### 内存优化
- **Float32Array 压缩**: 内存使用减少 50%
- **智能缓存**: LRU 缓存策略，避免重复计算
- **批量处理**: 减少数据库事务开销

### 查询优化
- **余弦相似度**: 单次循环计算，避免重复遍历
- **阈值过滤**: 早期过滤低相似度结果
- **排序数组**: 高效的 Top-K 结果管理

### 存储优化
- **IndexedDB**: 浏览器原生高性能存储
- **预计算**: 存储向量模长和归一化向量
- **压缩存储**: Float32Array 类型化数组

## 🔍 示例场景

### 文档相似度搜索

```javascript
// 文档向量化和存储
const documents = [
  { title: 'AI技术发展', content: '人工智能...', vector: embedding1 },
  { title: '机器学习基础', content: '机器学习...', vector: embedding2 }
];

await vectorDB.batchInsert(documents);

// 搜索相似文档
const queryEmbedding = await getTextEmbedding('深度学习');
const similarDocs = await vectorDB.query(queryEmbedding, {
  limit: 5,
  threshold: 0.6
});
```

### 图像相似度搜索

```javascript
// 图像特征向量存储
const images = [
  { filename: 'cat1.jpg', features: imageVector1 },
  { filename: 'dog1.jpg', features: imageVector2 }
];

const vectorDB = new VectorDB({
  dbName: 'imageDB',
  objectStore: 'images',
  vectorPath: 'features'
});

await vectorDB.batchInsert(images);

// 搜索相似图像
const queryFeatures = await extractImageFeatures('query.jpg');
const similarImages = await vectorDB.query(queryFeatures);
```

## ⚠️ 注意事项

1. **向量维度一致性**: 所有向量必须具有相同的维度
2. **精度损失**: Float32Array 会有轻微精度损失，通常可接受
3. **浏览器限制**: IndexedDB 有存储配额限制
4. **内存管理**: 大规模数据时注意内存使用

## 🐛 常见问题

**Q: 向量维度不匹配错误？**
A: 确保所有向量具有相同的维度，首次插入的向量维度将作为标准。

**Q: 查询性能慢？**
A: 检查数据量大小，考虑使用更高的相似度阈值过滤结果。

**Q: 内存使用过高？**
A: 定期清理缓存，使用批量操作减少内存峰值。

## 📄 许可证

- 原始代码: Apache-2.0 (c) https://github.com/PaulKinlan/idb-vector
- 修改版本: MIT (c) https://github.com/34892002/3000World
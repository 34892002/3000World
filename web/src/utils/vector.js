/* Original code: Apache-2.0 (c) https://github.com/PaulKinlan/idb-vector
 * Modifications: MIT (c) https://github.com/34892002/3000World
 */

import { SortedArray } from "./sortedarray.js";

const DB_DEFAULTS = {
  dbName: "vectorDB",
  objectStore: "vectors",
};

/**
 * 优化的余弦相似度计算函数
 * 单次循环计算所有值，避免重复遍历
 * @param {number[]} a - 第一个向量
 * @param {number[]} b - 第二个向量
 * @returns {number} 余弦相似度值
 */
function cosineSimilarity(a, b) {
  // 添加维度检查
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: a=${a.length}, b=${b.length}`);
  }

  let dotProduct = 0;
  let aMagnitudeSquared = 0;
  let bMagnitudeSquared = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];

    dotProduct += aVal * bVal;
    aMagnitudeSquared += aVal * aVal;
    bMagnitudeSquared += bVal * bVal;
  }

  const magnitude = Math.sqrt(aMagnitudeSquared * bMagnitudeSquared);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * 创建IndexedDB数据库连接
 * @param {Object} options - 数据库配置选项
 * @param {string} options.dbName - 数据库名称
 * @param {string} options.objectStore - 对象存储名称
 * @param {string} options.vectorPath - 向量路径
 * @param {number} options.version - 数据库版本号
 * @param {IDBDatabase} options.existingDB - 现有的数据库连接（可选）
 * @returns {Promise<IDBDatabase>} 数据库实例
 */
async function create(options) {
  const { dbName, objectStore, vectorPath, version, existingDB } = {
    ...DB_DEFAULTS,
    ...options,
  };

  // 如果提供了现有的数据库连接，直接使用
  if (existingDB) {
    return Promise.resolve(existingDB);
  }

  return new Promise((resolve, reject) => {
    // 使用传入的版本号打开数据库
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // 检查对象存储是否已存在
      if (!db.objectStoreNames.contains(objectStore)) {
        const store = db.createObjectStore(objectStore, { autoIncrement: true });
        store.createIndex(vectorPath, vectorPath, { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

class VectorDB {
  #objectStore;
  #vectorPath;
  #db;
  #vectorDimension = null; // 向量维度缓存
  #queryCache = new Map(); // 查询结果缓存
  #cacheSize = 100; // 缓存大小限制
  #batchSize = 1000; // 批处理大小
  #metrics = {
    // 性能监控指标
    queryCount: 0,
    avgQueryTime: 0,
    totalQueryTime: 0,
    insertCount: 0,
  };

  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {string} options.dbName - 数据库名称
   * @param {string} options.objectStore - 对象存储名称
   * @param {string} options.vectorPath - 向量路径
   * @param {number} options.version - 数据库版本号
   * @param {IDBDatabase} options.existingDB - 现有的数据库连接（可选）
   */
  constructor(options) {
    const { dbName, objectStore, vectorPath, existingDB } = {
      ...DB_DEFAULTS,
      ...options,
    };

    if (!dbName && !existingDB) {
      throw new Error("dbName or existingDB is required");
    }

    if (!objectStore) {
      throw new Error("objectStore is required");
    }

    if (!vectorPath) {
      throw new Error("vectorPath is required");
    }

    this.#objectStore = objectStore;
    this.#vectorPath = vectorPath;
    this.#db = create(options);
  }

  /**
   * 向量维度验证
   * @param {number[]} vector - 要验证的向量
   */
  #validateVector(vector) {
    if (!Array.isArray(vector)) {
      throw new Error(
        `${this.#vectorPath} on 'object' is expected to be an Array`
      );
    }

    if (!this.#vectorDimension) {
      this.#vectorDimension = vector.length;
    } else if (vector.length !== this.#vectorDimension) {
      throw new Error(
        `向量维度不匹配: 期望 ${this.#vectorDimension}, 实际 ${vector.length}`
      );
    }
  }

  /**
   * 向量压缩存储，降低精度提升效率
   * @param {number[]} vector - 原始向量
   * @returns {Float32Array} 压缩后的向量
   */
  #compressVector(vector) {
    return new Float32Array(vector);
  }

  /**
   * 预计算向量模长
   * @param {number[]} vector - 输入向量
   * @returns {Object} 包含模长和归一化向量的对象
   */
  #precomputeVectorData(vector) {
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    const normalizedVector =
      magnitude > 0 ? vector.map((v) => v / magnitude) : vector;
    return { magnitude, normalizedVector };
  }

  /**
   * 生成缓存键
   * @param {number[]} vector - 查询向量
   * @param {Object} options - 查询选项
   * @returns {string} 缓存键
   */
  #generateCacheKey(vector, options) {
    // 使用更安全的哈希方法
    const vectorHash = vector
      .reduce((hash, val, i) => {
        return hash + val * (i + 1);
      }, 0)
      .toFixed(6);
    return `${vectorHash}_${JSON.stringify(options)}`;
  }

  /**
   * 更新性能指标
   * @param {number} queryTime - 查询耗时
   */
  #updateQueryMetrics(queryTime) {
    this.#metrics.queryCount++;
    this.#metrics.totalQueryTime += queryTime;
    this.#metrics.avgQueryTime =
      this.#metrics.totalQueryTime / this.#metrics.queryCount;
  }

  /**
   * 批量处理向量相似度计算
   * @param {Array} batch - 批量数据
   * @param {number[]} queryVector - 查询向量
   * @param {SortedArray} similarities - 相似度结果集
   * @param {number} threshold - 相似度阈值
   */
  #processBatch(batch, queryVector, similarities, threshold) {
    for (const item of batch) {
      const vectorValue = item.value[this.#vectorPath];
      if (vectorValue && vectorValue.length === queryVector.length) {
        const similarity = cosineSimilarity(queryVector, vectorValue);

        // 只保留超过阈值的结果
        if (similarity >= threshold) {
          similarities.insert({
            object: item.value,
            key: item.key,
            similarity,
          });
        }
      }
    }
  }

  /**
   * 插入单个对象
   * @param {Object} object - 要插入的对象
   * @returns {Promise<number>} 插入的键值
   */
  async insert(object) {
    if (this.#vectorPath in object == false) {
      throw new Error(
        `${this.#vectorPath} expected to be present 'object' being inserted`
      );
    }

    const vector = object[this.#vectorPath];
    this.#validateVector(vector);

    // 预计算向量数据并压缩存储
    const { magnitude, normalizedVector } = this.#precomputeVectorData(vector);
    const optimizedObject = {
      ...object,
      [this.#vectorPath]: this.#compressVector(vector),
      _magnitude: magnitude,
      _normalizedVector: this.#compressVector(normalizedVector),
    };

    const db = await this.#db;
    const storeName = this.#objectStore;

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.add(optimizedObject);

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        this.#metrics.insertCount++;
        // 清理缓存，因为数据已更新
        this.clearCache();
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.error);
      };
    });
  }

  /**
   * 批量插入对象
   * @param {Array} objects - 要插入的对象数组
   * @returns {Promise<Array>} 插入的键值数组
   */
  async batchInsert(objects) {
    const db = await this.#db;
    const storeName = this.#objectStore;
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const promises = objects.map((object) => {
      if (this.#vectorPath in object == false) {
        throw new Error(
          `${this.#vectorPath} expected to be present in object being inserted`
        );
      }

      const vector = object[this.#vectorPath];
      this.#validateVector(vector);

      // 预计算向量数据并压缩存储
      const { magnitude, normalizedVector } =
        this.#precomputeVectorData(vector);
      const optimizedObject = {
        ...object,
        [this.#vectorPath]: this.#compressVector(vector),
        _magnitude: magnitude,
        _normalizedVector: this.#compressVector(normalizedVector),
      };

      return new Promise((resolve, reject) => {
        const request = store.add(optimizedObject);
        request.onsuccess = () => {
          this.#metrics.insertCount++;
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
    });

    const results = await Promise.all(promises);
    this.clearCache(); // 清理缓存
    return results;
  }

  /**
   * 删除对象
   * @param {number} key - 要删除的键值
   * @returns {Promise<void>}
   */
  async delete(key) {
    if (key == null) {
      throw new Error(`Unable to delete object without a key`);
    }

    const db = await this.#db;
    const storeName = this.#objectStore;

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        this.clearCache(); // 清理缓存
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.error);
      };
    });
  }

  /**
   * 更新对象
   * @param {number} key - 要更新的键值
   * @param {Object} object - 新的对象数据
   * @returns {Promise<number>}
   */
  async update(key, object) {
    if (key == null) {
      throw new Error(`Unable to update object without a key`);
    }

    if (this.#vectorPath in object == false) {
      throw new Error(
        `${this.#vectorPath} expected to be present 'object' being updated`
      );
    }

    const vector = object[this.#vectorPath];
    this.#validateVector(vector);

    // 预计算向量数据并压缩存储
    const { magnitude, normalizedVector } = this.#precomputeVectorData(vector);
    const optimizedObject = {
      ...object,
      [this.#vectorPath]: this.#compressVector(vector),
      _magnitude: magnitude,
      _normalizedVector: this.#compressVector(normalizedVector),
    };

    const db = await this.#db;
    const storeName = this.#objectStore;

    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    const request = store.put(optimizedObject, key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        this.clearCache(); // 清理缓存
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.error);
      };
    });
  }

  /**
   * 查询最相似的向量
   * @param {number[]} queryVector - 查询向量
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 相似度结果数组
   */
  async query(queryVector, options = { limit: 10, threshold: 0.0 }) {
    this.#validateVector(queryVector);
    const startTime = performance.now();
    const { limit, threshold = 0.0 } = options;

    // 检查缓存
    const cacheKey = this.#generateCacheKey(queryVector, options);
    if (this.#queryCache.has(cacheKey)) {
      const cachedResult = this.#queryCache.get(cacheKey);
      this.#updateQueryMetrics(performance.now() - startTime);
      return cachedResult;
    }

    const queryVectorLength = queryVector.length;
    const db = await this.#db;
    const storeName = this.#objectStore;
    const vectorPath = this.#vectorPath;

    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.openCursor();

    const similarities = new SortedArray(limit, "similarity");

    const result = await new Promise((resolve, reject) => {
      const batch = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          batch.push({ key: cursor.key, value: cursor.value });

          // 批量处理
          if (batch.length >= this.#batchSize) {
            this.#processBatch(batch, queryVector, similarities, threshold);
            batch.length = 0;
          }

          cursor.continue();
        } else {
          // 处理剩余数据
          if (batch.length > 0) {
            this.#processBatch(batch, queryVector, similarities, threshold);
          }
          resolve(similarities.slice(0, limit));
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });

    // 缓存管理
    if (this.#queryCache.size >= this.#cacheSize) {
      const firstKey = this.#queryCache.keys().next().value;
      this.#queryCache.delete(firstKey);
    }
    this.#queryCache.set(cacheKey, result);

    // 更新性能指标
    this.#updateQueryMetrics(performance.now() - startTime);

    return result;
  }

  /**
   * 清理查询缓存
   */
  clearCache() {
    this.#queryCache.clear();
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标对象
   */
  getMetrics() {
    return { ...this.#metrics };
  }

  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.#metrics = {
      queryCount: 0,
      avgQueryTime: 0,
      totalQueryTime: 0,
      insertCount: 0,
    };
  }

  /**
   * 获取数据库统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    const db = await this.#db;
    const transaction = db.transaction([this.#objectStore], "readonly");
    const store = transaction.objectStore(this.#objectStore);

    return new Promise((resolve, reject) => {
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        resolve({
          totalRecords: countRequest.result,
          vectorDimension: this.#vectorDimension,
          cacheSize: this.#queryCache.size,
          metrics: this.getMetrics(),
        });
      };
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  get objectStore() {
    return this.#objectStore;
  }
}

export { VectorDB };

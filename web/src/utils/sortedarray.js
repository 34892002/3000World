/* Original code: Apache-2.0 (c) https://github.com/PaulKinlan/idb-vector
 * Modifications: MIT (c) https://github.com/34892002/3000World
 */

/**
 * 优化的有序数组类，支持高效的插入和自动排序
 * 基于二分查找实现O(log n)的查找复杂度
 */
export class SortedArray extends Array {
  #maxLength;
  #keyPath;
  #isDescending; // 新增：支持降序排列
  #compareCache = new Map(); // 新增：比较结果缓存

  /**
   * 构造函数
   * @param {number} maxLength - 数组最大长度，0表示无限制
   * @param {string} keyPath - 对象排序的键路径
   * @param {boolean} isDescending - 是否降序排列，默认true（相似度从高到低）
   */
  constructor(maxLength = 0, keyPath, isDescending = true) {
    super();
    
    // 参数验证
    if (maxLength < 0) {
      throw new Error('maxLength must be non-negative');
    }
    
    this.#maxLength = maxLength;
    this.#keyPath = keyPath;
    this.#isDescending = isDescending;
  }

  /**
   * 禁用push方法
   */
  push() {
    throw new Error("Use insert() method instead of push() for sorted arrays");
  }

  /**
   * 禁用unshift方法
   */
  unshift() {
    throw new Error("Use insert() method instead of unshift() for sorted arrays");
  }

  /**
   * 获取比较值的优化函数
   * @param {*} value - 要比较的值
   * @returns {number} 比较值
   */
  #getCompareValue(value) {
    if (typeof value !== "object" || value === null) {
      return value;
    }
    
    // 使用缓存避免重复计算
    if (this.#compareCache.has(value)) {
      return this.#compareCache.get(value);
    }
    
    const compareValue = value[this.#keyPath];
    
    // 缓存结果（限制缓存大小）
    if (this.#compareCache.size < 1000) {
      this.#compareCache.set(value, compareValue);
    }
    
    return compareValue;
  }

  /**
   * 优化的二分查找插入位置
   * @param {*} value - 要插入的值
   * @returns {number} 插入位置
   */
  #findInsertPosition(value) {
    const resolvedValue = this.#getCompareValue(value);
    let low = 0;
    let high = this.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const midValue = this.#getCompareValue(this[mid]);
      
      // 修复比较逻辑
      const shouldInsertAfter = this.#isDescending 
        ? midValue >= resolvedValue  // 降序：大值在前
        : midValue <= resolvedValue; // 升序：小值在前
      
      if (shouldInsertAfter) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    
    return low;
  }

  /**
   * 高效插入元素并保持排序
   * @param {*} value - 要插入的值
   * @returns {number} 插入位置
   */
  insert(value) {
    // 输入验证
    if (value === undefined) {
      throw new Error('Cannot insert undefined value');
    }
    
    // 如果数组为空，直接插入
    if (this.length === 0) {
      super.push(value);
      return 0;
    }
    
    // 找到插入位置
    const insertPos = this.#findInsertPosition(value);
    
    // 检查是否需要插入（避免超出maxLength时的无效插入）
    if (this.#maxLength > 0 && this.length >= this.#maxLength && insertPos >= this.#maxLength) {
      return -1; // 不需要插入
    }
    
    // 使用splice插入（虽然性能不是最优，但保持了Array的完整性）
    this.splice(insertPos, 0, value);
    
    // 如果超出最大长度，移除末尾元素
    if (this.#maxLength > 0 && this.length > this.#maxLength) {
      this.pop();
    }
    
    return insertPos;
  }

  /**
   * 批量插入优化
   * @param {Array} values - 要插入的值数组
   * @returns {Array} 插入位置数组
   */
  batchInsert(values) {
    if (!Array.isArray(values)) {
      throw new Error('batchInsert expects an array');
    }
    
    const positions = [];
    
    // 先排序要插入的值，提高插入效率
    const sortedValues = [...values].sort((a, b) => {
      const aVal = this.#getCompareValue(a);
      const bVal = this.#getCompareValue(b);
      return this.#isDescending ? bVal - aVal : aVal - bVal;
    });
    
    for (const value of sortedValues) {
      const pos = this.insert(value);
      positions.push(pos);
    }
    
    return positions;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.#compareCache.clear();
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      length: this.length,
      maxLength: this.#maxLength,
      keyPath: this.#keyPath,
      isDescending: this.#isDescending,
      cacheSize: this.#compareCache.size
    };
  }

  /**
   * 验证数组是否正确排序（调试用）
   * @returns {boolean} 是否正确排序
   */
  isValidlySorted() {
    for (let i = 1; i < this.length; i++) {
      const prev = this.#getCompareValue(this[i - 1]);
      const curr = this.#getCompareValue(this[i]);
      
      if (this.#isDescending ? prev < curr : prev > curr) {
        return false;
      }
    }
    return true;
  }
}
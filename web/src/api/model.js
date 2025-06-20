// AI接口
import { ref } from 'vue'

export function useAIApi() {
  const isLoading = ref(false)

   /**
   * 清理AI响应内容
   * @param {string} content - 原始AI响应内容
   * @returns {string} 清理后的内容
   */
   const cleanAIResponse = (content) => {
    if (!content) return ''
    
    return content
      // 清理思考标签
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      // 清理代码块标记
      .replace(/```[\s\S]*?```/g, '')
      // 替换英文Narration为中文旁白
      .replace(/\[?Narration:/gi, '旁白:')
      // 清理多余的空行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 去除首尾空白
      .trim()
  }
  
  // 获取AI响应 - 支持Google和OpenAI格式的API
  const getAIResponse = async (prompt, config) => {
    isLoading.value = true
    try {
      const { apiKey, apiUrl, model } = config
      let response
      
      // 根据API URL判断使用哪种格式
      if (apiUrl.includes('googleapis.com')) {
        // Google API格式
        const fullApiUrl = `${apiUrl}?key=${apiKey}`
        response = await fetch(fullApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          })
        })
      } else {
        // OpenAI格式API
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }]
          })
        })
      }
      
      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(`API Error: ${errorBody.error?.message || JSON.stringify(errorBody)}`)
      }
      
      const result = await response.json()
      
      // 解析响应内容
      let content = ''
      if (result.choices && result.choices[0]?.message) {
        if (result.choices[0].message?.content) {
          content = result.choices[0].message.content
        } else if (result.choices[0].message?.reasoning_content) {
          content = result.choices[0].message.reasoning_content
        }
      } else if (result.candidates && result.candidates[0]?.content?.parts) {
        // Google API响应格式
        content = result.candidates[0].content.parts[0]?.text || ''
      }
      
      return content
    } catch (error) {
      console.error('获取AI响应失败:', error.message)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    isLoading,
    cleanAIResponse,
    getAIResponse
  }
}


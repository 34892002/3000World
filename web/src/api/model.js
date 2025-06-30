// AI接口
import { ref } from "vue";
import { ChatOpenAI } from "@langchain/openai";
// import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { chatHistoryTool } from "@/models/tools/chatHistory";

export function useAIApi() {
  const isLoading = ref(false);

  /**
   * 清理AI响应内容
   * @param {string} content - 原始AI响应内容
   * @returns {string} 清理后的内容
   */
  const cleanAIResponse = (content) => {
    if (!content) return "";

    return (
      content
        // 清理思考标签
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        // 清理代码块标记
        .replace(/```[\s\S]*?```/g, "")
        // 替换英文Narration为中文旁白
        .replace(/\[?Narration:/gi, "旁白:")
        // 清理多余的空行
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        // 去除首尾空白
        .trim()
    );
  };

  /**
   * 创建LangChain聊天模型实例
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - API密钥
   * @param {string} config.apiUrl - API地址
   * @param {string} config.model - 模型名称
   * @returns {ChatOpenAI} LangChain聊天模型实例
   */
  const createChatModel = (config) => {
    const { apiKey, apiUrl, model } = config;
    // 根据API URL判断使用哪种模型
    // OpenAI兼容模型
    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: model || "gpt-3.5-turbo",
      temperature: 0.7,
      configuration: {
        baseURL: apiUrl,
      },
    });
  };

  /**
   * 解析AI响应内容
   * @param {Object} response - LangChain响应对象
   * @returns {string} 解析后的内容
   */
  const parseAIResponse = (response) => {
    // 如果响应有content字段，直接返回
    if (response.content) {
      return response.content;
    }

    // 如果响应有additional_kwargs，检查其中的reasoning_content
    if (
      response.additional_kwargs &&
      response.additional_kwargs.reasoning_content
    ) {
      return response.additional_kwargs.reasoning_content;
    }

    // 如果响应有response_metadata，检查其中的reasoning_content
    if (
      response.response_metadata &&
      response.response_metadata.reasoning_content
    ) {
      return response.response_metadata.reasoning_content;
    }

    // 尝试从原始响应中提取reasoning_content
    if (typeof response === "object" && response.reasoning_content) {
      return response.reasoning_content;
    }

    // 如果都没有，返回空字符串或者响应的字符串表示
    return response.toString ? response.toString() : "";
  };

  /**
   * 获取AI响应 - 使用LangChain
   * @param {string} prompt - 用户输入的提示
   * @param {Object} config - 配置对象
   * @returns {Promise<string>} AI响应内容
   */
  const getAIResponse = async (prompt, config) => {
    isLoading.value = true;
    try {
      // 创建llm模型实例
      const llm = createChatModel(config);
      const app = createReactAgent({ llm: llm, tools: [chatHistoryTool] });
      const response = await app.invoke({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      console.log("@LangChain Res:", response);
      // 解析响应内容，取最后一个数组
      const messages = response.messages;
      const AIMessage = messages[messages.length - 1];
      return AIMessage.content;
    } catch (error) {
      console.error("获取AI响应失败:", error.message);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const createEmbeddings = async (input, pluginConfig = null) => {
    // 如果没有传入配置，尝试从数据库获取
    let config = pluginConfig;
    if (!config) {
      try {
        // 动态导入数据库模块以避免循环依赖
        const { useDatabase } = await import('@/composables/useDatabase.js');
        const { getPluginConfig } = useDatabase();
        config = await getPluginConfig('vector');
      } catch (error) {
        console.warn('无法获取向量插件配置，使用默认配置:', error);
      }
    }

    const model = config.model;
    const apiKey = config.apiKey;
    const apiUrl = config.apiUrl;
    
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        input: input
      }),
    };

    try {
      const response = await fetch(apiUrl, options);
      const data = await response.json();
      return data.data[0].embedding;
    } catch (err) {
      console.error('创建嵌入向量失败:', err);
      throw err;
    }
  };

  return {
    isLoading,
    cleanAIResponse,
    getAIResponse,
    createChatModel,
    parseAIResponse,
    createEmbeddings,
  };
}

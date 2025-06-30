import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { useDatabase } from "@/composables/useDatabase.js";
import { useAIApi } from "@/api/model";
import database from "@/utils/database.js";

/**
 * 聊天记录查询工具的参数模式
 */
const chatHistorySchema = z.object({
  query: z
    .string()
    .describe(
      "搜索查询内容：用户想要查找的话题、关键词或问题。支持自然语言描述，如'关于工作的对话'、'昨天聊的那个项目'等。工具会进行语义搜索，找到内容相关的历史对话。"
    ),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe(
      "返回结果数量限制：最多返回多少条相关的聊天记录，默认10条。如果用户需要更多或更少的结果，可以调整此参数。"
    ),
});

/**
 * 聊天记录向量化查询工具
 * 基于向量相似度搜索历史聊天记录
 */
export const chatHistoryTool = tool(
  async ({ query, limit = 10, threshold = 0.3 }) => {
    console.log("@历史搜索工具:", { query, limit, threshold });

    try {
      // 获取数据库和AI API实例
      const { vectorDB } = useDatabase();
      const { createEmbeddings } = useAIApi();

      const config = await database.getPluginConfig('vector')
      // 检查数据库连接状态
      if (!config?.enabled) return;
      // 创建查询向量
      const queryEmbedding = await createEmbeddings(query);
      // 搜索相似内容
      const results = await vectorDB.value.query(queryEmbedding, {
        limit: limit,
        threshold: threshold,
      });

      // 格式化返回结果
      if (results.length === 0) {
        return `未找到与查询"${query}"相关的聊天记录。`;
      }

      // 转换结果格式
      const searchResults = results.map((result) => ({
        id: result.object.messageId,
        content: result.object.content,
        characterName: result.object.characterName,
        role: result.object.role,
        timestamp: result.object.timestamp,
        similarity: result.similarity,
      }));

      let resultText = `找到 ${searchResults.length} 条与"${query}"相关的聊天记录:\n\n`;

      searchResults.forEach((result, index) => {
        resultText += `${index + 1}. [${result.characterName || "未知"}] (${
          result.role || "未知"
        })\n`;
        resultText += `   内容: ${result.content}\n`;
        resultText += `   时间: ${result.timestamp || "未知"}\n`;
        resultText += `   相似度: ${(result.similarity * 100).toFixed(1)}%\n\n`;
      });

      return resultText;
    } catch (error) {
      console.error("聊天记录查询失败:", error);
      return `查询聊天记录时发生错误: ${error.message}`;
    }
  },
  {
    name: "chatHistory",
    description:
      "智能搜索历史聊天记录工具。当用户提到过去的事件、想要回忆之前的对话内容、询问历史信息、或者需要查找特定话题的聊天记录时，应该主动使用此工具。例如：用户说'我们之前聊过什么'、'你还记得我跟你说过的那件事吗'、'帮我找找关于XXX的聊天记录'等情况。此工具使用向量相似度进行语义搜索，能够找到内容相关而非仅仅关键词匹配的对话记录。参数说明：query为搜索查询（必需），limit为返回结果数量（可选，默认10），threshold为相似度阈值（可选，默认0.3，越低越宽松）。",
    schema: chatHistorySchema,
  }
);

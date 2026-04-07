import { Injectable, Logger } from "@nestjs/common";

export interface MemorySummary {
  topics: string[];
  executedFunctions: string[];
  sentiment: "positive" | "neutral" | "negative";
  lastAction: string;
  context: string;
}

export interface MessageBlock {
  userMessage: string;
  assistantResponse: string;
  timestamp: Date;
  important_info: string;
  functions_used: string[];
}

@Injectable()
export class MemoryManagerService {
  private readonly logger = new Logger(MemoryManagerService.name);
  private readonly SUMMARY_THRESHOLD = 5; // Summarize after 5 messages

  /**
   * Builds an efficient memory context from recent messages
   * Only includes last 4-6 messages to save tokens
   */
  buildEnhancedMemoryContext(messages: any[], maxMessages: number = 6): string {
    if (messages.length === 0) return "";

    const summary =
      messages.length > 10 ? this.compressConversation(messages) : "";

    const recentMessages = messages.slice(-maxMessages);

    const memoryParts: string[] = [];

    for (const msg of recentMessages) {
      if (msg.role === "user") {
        memoryParts.push(`User: ${msg.content.substring(0, 150)}`);
      } else if (msg.role === "assistant") {
        memoryParts.push(`Assistant: ${msg.content.substring(0, 150)}`);
      }

      if (msg.important_info) {
        memoryParts.push(`Memory: ${msg.important_info}`);
      }
    }

    return `
${summary}
RECENT CONTEXT:
${memoryParts.join("\n")}
`.trim();
  }

  /**
   * Creates a summary when message count exceeds threshold
   * Used for long conversations to reduce token usage
   */
  createConversationSummary(messages: any[]): MemorySummary {
    const topics = new Set<string>();
    const executedFunctions = new Set<string>();
    let sentiment: "positive" | "neutral" | "negative" = "neutral";

    for (const msg of messages) {
      // Extract topics from messages
      if (msg.role === "user") {
        const extracted = this.extractTopics(msg.content);
        extracted.forEach((t) => topics.add(t));
      }

      // Extract executed functions from important_info
      if (msg.important_info) {
        const functionsMatch = msg.important_info.match(
          /\[FUNCIONES_EJECUTADAS: ([^\]]+)\]/,
        );
        if (functionsMatch) {
          const funcs = functionsMatch[1].split(" ");
          funcs.forEach((f) => executedFunctions.add(f));
        }

        // Simple sentiment analysis
        if (msg.important_info.match(/error|problema|fallo/i)) {
          sentiment = "negative";
        }
      }
    }

    const lastMessage = messages[messages.length - 1];
    const lastAction = lastMessage
      ? `${lastMessage.role}: ${lastMessage.content.substring(0, 50)}`
      : "unknown";

    return {
      topics: Array.from(topics),
      executedFunctions: Array.from(executedFunctions),
      sentiment,
      lastAction,
      context: `Conversation covered: ${Array.from(topics).join(", ")}`,
    };
  }

  /**
   * Extracts key topics/entities from text
   */
  private extractTopics(text: string): Set<string> {
    const topics = new Set<string>();

    // Extract capitalized words (potential entities)
    const entityMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (entityMatches) {
      entityMatches.forEach((e) => topics.add(e));
    }

    // Extract keywords (3+ letter words)
    const words = text.split(/\s+/).filter((w) => w.length >= 4);
    words.slice(0, 5).forEach((w) => topics.add(w));

    return topics;
  }

  /**
   * Compresses conversation for long chats
   * Returns a compact representation of the full conversation
   */
  compressConversation(messages: any[]): string {
    if (messages.length <= 10) {
      return ""; // No compression needed
    }

    const summary = this.createConversationSummary(messages);

    return `
[CONVERSATION SUMMARY]
Topics: ${summary.topics.join(", ") || "general"}
Functions Used: ${summary.executedFunctions.join(", ") || "none"}
Sentiment: ${summary.sentiment}
Context: ${summary.context}
Last Action: ${summary.lastAction}
`.trim();
  }

  /**
   * Filters messages to only include essential context
   * Reduces token count significantly
   */
  getEssentialContext(messages: any[], maxTokenEstimate: number = 1000): any[] {
    const essential: any[] = [];
    let tokenCount = 0;

    // Always include the last message (user query)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      essential.push(lastMessage);
      tokenCount += this.estimateTokens(
        `${lastMessage.role}: ${lastMessage.content}`,
      );
    }

    // Add previous messages in reverse order until we hit token limit
    for (
      let i = messages.length - 2;
      i >= 0 && tokenCount < maxTokenEstimate;
      i--
    ) {
      const msg = messages[i];
      const msgTokens = this.estimateTokens(`${msg.role}: ${msg.content}`);

      if (tokenCount + msgTokens <= maxTokenEstimate) {
        essential.unshift(msg);
        tokenCount += msgTokens;
      }
    }

    return essential;
  }

  /**
   * Estimates token count for text (rough calculation)
   * Actual token count varies, but this gives a good approximation
   */
  private estimateTokens(text: string): number {
    // Approximate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Builds a summarized prompt for the LLM that includes memory
   */
  buildMemorizedPrompt(
    basePrompt: string,
    memoryContext: string,
    userMessage: string,
  ): string {
    if (!memoryContext) {
      return `${basePrompt}\n\nUser: ${userMessage}`;
    }

    return `${basePrompt}

${memoryContext}

Current Message: "${userMessage}"`;
  }
}

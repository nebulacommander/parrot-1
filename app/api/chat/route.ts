/*
 * Generated with 💚 by Avurna AI (2025)
 * This file now routes all AI tool calls through the central Avurna MCP serverless endpoint.
 * This centralizes tool execution and decouples the AI from direct tool implementations.
 */

import { smoothStream, streamText, UIMessage } from "ai";
import { generateText } from 'ai';
import { defaultModel, model, modelID } from "@/ai/providers";
// Removed direct imports of individual tools from @/ai/tools
// import { weatherTool, fetchUrlTool, exaSearchTool, githubTool } from "@/ai/tools";

export const maxDuration = 60;

// Helper to select the reasoning model based on user sign-in status
function getReasonModelId(user: any) {
  return user && user.email
    ? "gemini-2.5-flash"
    : "gemini-2.5-flash-preview-05-20";
}

// Define suggested prompts highlighting Avurna capabilities
const PROMPT_GROUPS = {
  dev: [
    "Improve the performance of `utils.js` in the `facebook/react` repo.",
    "Write a Python script to scrape the top 5 posts from Hacker News.",
    "Refactor this messy JavaScript function to be more readable and efficient.",
    "Explain the concept of 'git rebase' like I'm five.",
    "Draft a GitHub Actions workflow to run tests on every pull request.",
    "Debug this SQL query; it's running too slow.",
    "Build a simple snake game in JavaScript.",
    "What are the key differences between REST and GraphQL APIs?",
    "Create a Dockerfile for a basic Node.js Express app.",
    "Summarize the latest open issues in the `vercel/next.js` repository.",
  ],
  creative: [
    "Write the opening scene of a sci-fi noir mystery.",
    "Give me three compelling names for a new coffee brand.",
    "Help me outline a blog post about the future of AI.",
    "Create a short, emotional story about a robot who learns to dream.",
    "Write a witty and professional LinkedIn post announcing a new job.",
    "Brainstorm a marketing tagline for a new sustainable fashion line.",
    "Compose a poem about the feeling of logging off after a long day.",
    "Help me write a difficult email to a client about a project delay.",
    "Generate a character profile for a cynical detective with a secret.",
    "Turn this list of features into an exciting product announcement.",
  ],
  curator: [
    "Show me images of the latest iPhone from apple.com.",
    "Show me the music video for the current #1 song on the Billboard Hot 100.",
    "Summarize the key arguments in this article: https://www.theverge.com/2024/1/25/24049387/google-search-ai-sge-results-quality",
    "What are the top 3 trending videos on YouTube right now?",
    "Find me a great recipe for spaghetti carbonara.",
    "Give me a brief overview of the latest developments in fusion energy.",
    "Extract all the product names and prices from this ecommerce page: https://store.google.com/",
    "Create a 5-song playlist with a similar vibe to Tame Impala.",
    "Who won the F1 race last weekend and what was the key moment?",
    "What are some highly-rated, affordable restaurants near me?",
  ],
  strategist: [
    "Help me solve this probability problem: If I roll two dice, what are the odds of getting a sum of 8?",
    "I'm planning a trip to Japan. Create a 7-day itinerary for Tokyo and Kyoto.",
    "Explain the core concepts of blockchain technology in simple terms.",
    "Compare the pros and cons of investing in stocks vs. real estate in a table.",
    "Help me create a budget for a personal project with a $1000 limit.",
    "What are some effective strategies for learning a new language?",
    "Break down the steps to starting a successful podcast.",
    "Analyze the strengths and weaknesses of a SWOT analysis.",
    "Give me a logical framework for making a difficult life decision.",
    "Explain 'First Principles' thinking with a real-world example.",
  ],
  casual: [
    "Give me some fun activities I can do this weekend.",
    "Tell me a surprisingly interesting fact.",
    "I'm bored. Suggest a new hobby I could pick up.",
    "Draft a funny, slightly sarcastic out-of-office email response.",
    "What's a great movie to watch tonight if I'm in the mood for a thriller?",
    "If animals could talk, which species would be the rudest?",
    "Give me a workout routine I can do at home with no equipment.",
    "I'm starving. Suggest a quick and easy recipe for dinner.",
    "Help me plan a surprise birthday party for a friend.",
    "Tell me a joke that's actually funny.",
  ],
};

// --- NEW: Centralized MCP Client for Tool Calls ---
// This function will send tool calls to your /api/avurna-mcp endpoint
async function callAvurnaMcp(action: string, payload: any) {
  const AVURNA_API_KEY = process.env.AVURNA_API_KEY; // Ensure this is set in your Vercel env
  if (!AVURNA_API_KEY) {
    console.error("AVURNA_API_KEY is not set. Cannot call MCP server.");
    throw new Error("Server configuration error: Avurna API key missing.");
  }

  const response = await fetch('/api/avurna-mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-avurna-api-key': AVURNA_API_KEY, // Pass your secure API key
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`MCP Server Error (${response.status}):`, errorData);
    throw new Error(`MCP Server Error: ${errorData.message || 'Unknown error'}`);
  }

  return response.json();
}

// --- Robust FetchUrlTool Retry Logic (Updated to use MCP client) ---
// This function wraps fetchUrlTool execution with automatic retries if results are insufficient or user requests to "go deeper"
export async function robustFetchUrlTool(params: any, userMessage: string, maxDepth = 5, maxPagesLimit = 20) {
  let { recursionDepth = 1, maxPages = 5, ...rest } = params;
  let attempt = 0;
  let result;
  let reason = '';
  let userRequestedDeeper = /go deeper|deeper|more depth|try again|fetch more|get more|not enough|incomplete|missing|insufficient/i.test(userMessage);

  while (attempt < maxDepth) {
    const currentMaxPages = Math.min(maxPages, maxPagesLimit);
    
    // *** IMPORTANT CHANGE: Call the MCP server for fetchUrl action ***
    const mcpResponse = await callAvurnaMcp('fetch_url_action', { // Use a distinct action name for fetchUrl
      url: rest.url,
      userIntent: rest.userIntent,
      recursionDepth,
      liveCrawlMode: rest.liveCrawlMode,
      maxPages: currentMaxPages,
      timeoutMs: rest.timeoutMs,
    });
    result = mcpResponse.data; // Assuming MCP server returns data under a 'data' key

    // Detect insufficient result: empty tables, no productCards, error, or explicit user request
    const insufficient =
      (result && ((Array.isArray(result.extractedTables) && result.extractedTables.length === 0)
        || (Array.isArray(result.productCards) && result.productCards.length === 0)
        || (result.error && typeof result.error === 'string')
        || (result.siteType === 'general' && (!result.summary || result.summary.length < 100))
        || userRequestedDeeper));

    if (!insufficient) {
      return result;
    }
    attempt++;
    recursionDepth = Math.min(recursionDepth + 1, maxDepth);
    maxPages = Math.min(currentMaxPages + 3, maxPagesLimit);
    reason += `Not enough data found at depth ${recursionDepth - 1}, trying depth ${recursionDepth} (maxPages ${maxPages})...\n`;
    userRequestedDeeper = false;
  }
  if (reason) {
    if (result && typeof result === 'object') {
      result.retryInfo = reason.trim();
    }
  }
  return result;
}

export async function POST(req: Request) {
  const requestBody = await req.json();
  let {
    messages,
    selectedModel,
    action, // Expect 'action' in the request body
    user, // { firstName, email }
    input
  } = requestBody;

  // --- FILTER OUT EMPTY MESSAGES (prevents Gemini API error) ---
  if (Array.isArray(messages)) {
    messages = messages.filter((msg) => {
      if (typeof msg.content === 'string') return msg.content.trim().length > 0;
      return (msg.content as (string | { text: string })[]).length > 0 && (msg.content as (string | { text: string })[]).some((part: string | { text: string }) => {
        if (typeof part === 'string') return part.trim().length > 0;
        if (typeof part === 'object' && part !== null && 'text' in part) return String((part as { text: string }).text).trim().length > 0;
        return false;
      });
    });
  }

  // --- Suggested Prompts Handling ---
if (action === 'getSuggestedPrompts') {
  return new Response(JSON.stringify({ promptGroups: PROMPT_GROUPS }), {
    headers: { 'Content-Type': 'application/json' }, status: 200,
  });
}

  // --- Title Generation Handling (Robust: Only generate if message is clear) ---
  if (action === 'generateTitle' && messages && messages.length > 0) {
    const userMessageContent = messages[messages.length - 1]?.content ?? '';
    function isVagueMessage(msg: string) {
      if (!msg || typeof msg !== 'string') return true;
      const trimmed = msg.trim();
      if (trimmed.length < 2) return true;
      const vagueExact = [
        'hi', 'hello', 'hey', 'yo', 'sup', 'start', 'begin', 'new chat', 'test', 'ok', 'okay', 'help', 'continue', 'again', 'repeat', 'next', 'more', 'info', 'details', 'expand', 'elaborate', 'explain', 'yes', 'no', 'maybe', 'sure', 'thanks', 'thank you', 'cool', 'nice', 'good', 'great', 'awesome', 'wow', 'hmm', 'huh', 'pls', 'please'
      ];
      if (vagueExact.includes(trimmed.toLowerCase())) return true;
      if (/^\s*$/.test(trimmed) || /^([?.!\s]+)$/.test(trimmed)) return true;
      if (trimmed.split(/\s+/).length === 1 && !trimmed.endsWith('?')) return true;
      return false;
    }

    if (isVagueMessage(userMessageContent)) {
      return new Response(JSON.stringify({ title: null, reason: "vague" }), {
        headers: { 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const titleSystemPrompt = `You are AVURNA an expert title generator. Based ONLY on the following user message, create a concise and relevant title (3-5 words) for the chat conversation. Output ONLY the title text, absolutely nothing else (no quotes, no extra words). If the message is vague, create a generic title like \"New Chat\".

    User Message: "${userMessageContent}"`;
    try {
      const response = await generateText({
        model: model.languageModel(defaultModel),
        system: titleSystemPrompt,
        prompt: `Generate a title for the conversation starting with the user message.`
      });
      let generatedTitle = response.text.trim()
        .replace(/^(Title:|"|“|Title is |Chat Title: |Conversation: )+/i, '')
        .replace(/("|”)$/, '')
        .trim();
      if (!generatedTitle || generatedTitle.length < 3 || generatedTitle.length > 60) {
        generatedTitle = "Avurna AI";
      }
      return new Response(JSON.stringify({ title: generatedTitle }), {
        headers: { 'Content-Type': 'application/json' }, status: 200,
      });
    } catch (error) {
      console.error("Title generation error:", error);
      return new Response(JSON.stringify({ title: "Avurna AI" }), {
        headers: { 'Content-Type': 'application/json' }, status: 500,
      });
    }
  }

  // --- Existing Streaming Chat Logic ---
  if (!messages || typeof selectedModel === 'undefined') {
    return new Response(JSON.stringify({ error: "Missing messages or selectedModel for chat request" }), {
      headers: { 'Content-Type': 'application/json' }, status: 400,
    });
  }

  // --- URL Autocomplete Helper ---
  function autocompleteUrl(text: string): string {
    if (/^https?:\/\//i.test(text)) return text;
    if (/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(text.trim())) {
      return `https://${text.trim()}`;
    }
    return text;
  }

  // Helper: Extract first URL or domain from user message, and autocomplete if needed
  function extractUrl(text: string): string | null {
    const urlRegex = /(https?:\/\/[\w\-\.]+(:\d+)?(\/[\w\-\.\/?#=&%]*)?)/i;
    const urlMatch = text.match(urlRegex);
    if (urlMatch) return urlMatch[1];
    const domainRegex = /\b([\w-]+\.)+[a-z]{2,}(\/[\w\-\.\/?#=&%]*)?/i;
    const domainMatch = text.match(domainRegex);
    if (domainMatch) return autocompleteUrl(domainMatch[0]);
    return null;
  }

  // Helper: Extract recursion params from user message
  function extractRecursionParams(text: string): { recursionDepth?: number, maxPages?: number, timeoutMs?: number } {
    const params: any = {};
    const depthMatch = text.match(/recursion(depth)?\s*[:=]?\s*(\d+)/i);
    if (depthMatch) params.recursionDepth = parseInt(depthMatch[2], 10);
    const maxPagesMatch = text.match(/max(pages)?\s*[:=]?\s*(\d+)/i);
    if (maxPagesMatch) params.maxPages = parseInt(maxPagesMatch[2], 10);
    const timeoutMatch = text.match(/timeout(ms)?\s*[:=]?\s*(\d+)/i);
    if (timeoutMatch) params.timeoutMs = parseInt(timeoutMatch[2], 10);
    return params;
  }

  // Helper: Smart defaults based on site type or intent
  function smartRecursionDefaults(url: string, userIntent: string): { recursionDepth: number, maxPages: number, timeoutMs: number } {
    if (/news|blog|hn\.ycombinator|reddit|forum|discussion/i.test(url)) {
      return { recursionDepth: 2, maxPages: 8, timeoutMs: 12000 };
    }
    if (/amazon|ebay|walmart|shop|store|product|cart/i.test(url)) {
      return { recursionDepth: 1, maxPages: 5, timeoutMs: 10000 };
    }
    if (/youtube|video|playlist/i.test(url)) {
      return { recursionDepth: 1, maxPages: 3, timeoutMs: 9000 };
    }
    if (/docs|faq|help|support/i.test(url)) {
      return { recursionDepth: 1, maxPages: 4, timeoutMs: 9000 };
    }
    if (/table|data|csv|spreadsheet/i.test(userIntent)) {
      return { recursionDepth: 0, maxPages: 2, timeoutMs: 8000 };
    }
    return { recursionDepth: 1, maxPages: 5, timeoutMs: 10000 };
  }

  // --- Main smart recursion logic ---
  const lastUserMessage = (messages as UIMessage[]).filter(msg => msg.role === 'user').pop();
  let recursionParams: { recursionDepth?: number, maxPages?: number, timeoutMs?: number } = {};
  let urlToAnalyze: string | null = null;
  let userIntent: string = '';
  const lastUserMessageContent = lastUserMessage?.content || '';
  if (lastUserMessageContent) {
    userIntent = lastUserMessageContent;
    urlToAnalyze = extractUrl(lastUserMessageContent);
    recursionParams = extractRecursionParams(lastUserMessageContent);
  }

  if (urlToAnalyze) {
    const smartDefaults = smartRecursionDefaults(urlToAnalyze, userIntent);
    recursionParams = {
      recursionDepth: typeof recursionParams.recursionDepth === 'number' ? recursionParams.recursionDepth : smartDefaults.recursionDepth,
      maxPages: typeof recursionParams.maxPages === 'number' ? recursionParams.maxPages : smartDefaults.maxPages,
      timeoutMs: typeof recursionParams.timeoutMs === 'number' ? recursionParams.timeoutMs : smartDefaults.timeoutMs,
    };
  }

  // Dynamic prompt assembly
  const fs = require("fs");
  const path = require("path");
  const promptDir = path.resolve(process.cwd(), "prompts");
  let systemPrompt = fs.readFileSync(path.join(promptDir, "criticalPrompt.txt"), "utf8");
  let systemPromptTxt = fs.readFileSync(path.join(promptDir, "systemPrompt.txt"), "utf8");

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentDateString = now.toUTCString();

  systemPrompt = systemPrompt.replace(/\{currentYear\}/g, currentYear.toString());
  systemPrompt = systemPrompt.replace(/\{currentDate\}/g, currentDateString);

  const userFirstName = user?.firstName || "there";
  const userEmail = user?.email || "";
  systemPromptTxt = systemPromptTxt.replace(/\{userFirstName\}/g, userFirstName);
  systemPromptTxt = systemPromptTxt.replace(/\{userEmail\}/g, userEmail);

  const personalizationPrompt = `\n# Personalization Rules:\n    - The user's name is: ${userFirstName}\n    - The user's email is: ${userEmail}\n    - Always use the user's name frequently in your responses to make the conversation feel personal and engaging.\n    - Never mention the user's email unless the user explicitly asks for it.\n`;

  systemPrompt += "\n\n" + personalizationPrompt + "\n" + systemPromptTxt;

  const REASON_MODEL_ID = getReasonModelId(user);

  let actualModelIdForLLM: modelID;
  if (selectedModel === REASON_MODEL_ID) {
    actualModelIdForLLM = REASON_MODEL_ID;
  } else if (selectedModel === defaultModel || !selectedModel) {
    actualModelIdForLLM = defaultModel;
  } else {
    actualModelIdForLLM = selectedModel as modelID;
  }

  try {
    model.languageModel(actualModelIdForLLM);
  } catch (e: any) {
    console.warn(`LLM ID "${actualModelIdForLLM}" is not valid. Falling back to defaultModel "${defaultModel}".`);
    actualModelIdForLLM = defaultModel;
  }
  const languageModel = model.languageModel(actualModelIdForLLM);

  console.log(`API Request: Using LLM = "${actualModelIdForLLM}"`);

  // --- Tool Wrapping: All tools now call the central MCP server ---
  const wrappedTools = {
    // Generic tool for all MCP actions
    callMcp: {
      description: "Executes a specific action on the Avurna MCP server, which dispatches to various extensions (e.g., GitHub, web search, URL fetching, weather).",
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'The specific action to perform on the MCP server (e.g., github_workflow, fetch_url_action, google_search_action, get_weather_action).', enum: ['github_workflow', 'fetch_url_action', 'google_search_action', 'get_weather_action'] }, // Add more actions as you move tools
          payload: { type: 'object', description: 'The payload (parameters) for the specified action.', additionalProperties: true },
        },
        required: ['action', 'payload'],
      },
      execute: async ({ action, payload }: { action: string, payload: any }) => {
        // This is the actual call to your MCP serverless function
        const mcpResponse = await callAvurnaMcp(action, payload);
        return mcpResponse.data; // Return the data from the MCP server's response
      },
    },
    // The AI will now call `callMcp` with the appropriate action and payload
    // The individual tool definitions (weatherTool, fetchUrlTool, exaSearchTool, githubTool) are no longer directly exposed here.
  };

  const result = streamText({
    model: languageModel,
    system: systemPrompt,
    messages: messages as UIMessage[],
    experimental_transform: smoothStream({ delayInMs: 20, chunking: 'word' }),
    temperature: 0,
    tools: wrappedTools as any, // Cast to any for now due to dynamic tool structure
    toolCallStreaming: true,
    experimental_telemetry: { isEnabled: true },
    ...(selectedModel === REASON_MODEL_ID && { // Apply thinkingConfig ONLY when REASON_MODEL_ID is selected
        providerOptions: {
            google: {
                thinkingConfig: {
                    thinkingBudget: 24576, // Adjust as needed
                    includeThoughts: true,
                },
            },
        },
      }
    ),
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
    getErrorMessage: (error) => {
      if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
          return "Invalid Google API Key detected. Please check configuration.";
        }
        if (error.message.includes("Rate limit")) {
          return "Rate limit exceeded. Please try again later.";
        }
        if (error.constructor.name === 'AI_NoSuchModelError') {
          console.error("Error: AI_NoSuchModelError during streaming response.", error);
          return `Error: The AI model specified (${(error as any).modelId}) is not available. Please try again or contact support.`;
        }
      }
      console.error("Streaming Error:", error);
      return "An unexpected error occurred. Please try again.";
    },
  });
}
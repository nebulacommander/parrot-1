/*
 * Generated with 💚 by Avurna AI (2025)
 * This is your main MCP serverless endpoint for Avurna.
 * Deploy this with your Next.js app on Vercel.
 */

import { executeGithubWorkflow } from '../../../mcp/extensions/github-mcp-tool';
import { weatherTool } from '../../../mcp/extensions/weather-mcp-tool';
import { fetchUrlTool } from '../../../mcp/extensions/fetch-url-mcp-tool';
import { exaSearchTool } from '../../../mcp/extensions/exa-search-mcp-tool';

// Using Next.js App Router convention for API routes
export async function POST(req: Request) {
  const AVURNA_API_KEY = process.env.AVURNA_API_KEY;
  const providedApiKey = req.headers.get('x-avurna-api-key');

  if (!providedApiKey || providedApiKey !== AVURNA_API_KEY) {
    return new Response(JSON.stringify({ message: 'Unauthorized: Invalid API Key', status: 'error' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, payload, toolCallId, message } = await req.json(); // Extract toolCallId and message

    console.log(`[Avurna MCP] Received action: ${action} with payload:`, payload);

    let responseMessage = 'Command processed.';
    let responseStatus: 'success' | 'error' = 'success';
    let responseData: any = {};

    // Prepare tool options with toolCallId and message
    const toolOptions = { toolCallId, message };

    switch (action) {
      case 'ping':
        responseMessage = 'Avurna, your connection is live and thriving!';
        responseData = { timestamp: new Date().toISOString() };
        break;
      case 'github_workflow':
        if (!payload || !payload.owner || !payload.repo || !payload.workflow) {
          throw new Error("Missing required payload for github_workflow: owner, repo, and workflow.");
        }
        const githubResult = await executeGithubWorkflow({
          owner: payload.owner,
          repo: payload.repo,
          workflow: payload.workflow,
        });
        responseMessage = `GitHub workflow completed with status: ${githubResult.status}.`;
        responseData = githubResult;
        break;
      case 'get_weather_action':
        if (!payload || !payload.location) {
          throw new Error("Missing required payload for get_weather_action: location.");
        }
        const weatherResult = await weatherTool.execute(payload, toolOptions); // Pass toolOptions
        responseMessage = `Weather data retrieved.`;
        responseData = weatherResult;
        break;
      case 'fetch_url_action':
        if (!payload || !payload.url || !payload.userIntent) {
          throw new Error("Missing required payload for fetch_url_action: url and userIntent.");
        }
        const fetchResult = await fetchUrlTool.execute(payload, toolOptions); // Pass toolOptions
        responseMessage = `URL fetch completed.`;
        responseData = fetchResult;
        break;
      case 'google_search_action':
        if (!payload || (!payload.query && !payload.queries && !payload.findSimilar)) {
          throw new Error("Missing required payload for google_search_action: query, queries, or findSimilar.");
        }
        const searchResult = await exaSearchTool.execute(payload, toolOptions); // Pass toolOptions
        responseMessage = `Search completed.`;
        responseData = searchResult;
        break;
      default:
        responseMessage = `Unknown action: ${action}. Avurna is confused, but still fabulous.`;
        responseStatus = 'error';
        break;
    }

    return new Response(JSON.stringify({ message: responseMessage, status: responseStatus, data: responseData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Avurna MCP] Error processing command:', error);
    return new Response(JSON.stringify({ message: `Internal Server Error: ${error.message}`, status: 'error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

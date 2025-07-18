/*
 * Generated with 💚 by Avurna AI (2025)
 * This is your main MCP serverless endpoint for Avurna.
 * Deploy this with your Next.js app on Vercel.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { executeGithubWorkflow } from '../../mcp/extensions/github-mcp-tool';
import { weatherTool } from '../../mcp/extensions/weather-mcp-tool';
import { fetchUrlTool } from '../../mcp/extensions/fetch-url-mcp-tool';
import { exaSearchTool } from '../../mcp/extensions/exa-search-mcp-tool';

type AvurnaResponse = {
  message: string;
  status: 'success' | 'error';
  data?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AvurnaResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed', status: 'error' });
  }

  const AVURNA_API_KEY = process.env.AVURNA_API_KEY;
  const providedApiKey = req.headers['x-avurna-api-key'];

  if (!providedApiKey || providedApiKey !== AVURNA_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API Key', status: 'error' });
  }

  try {
    const { action, payload } = req.body;

    console.log(`[Avurna MCP] Received action: ${action} with payload:`, payload);

    let responseMessage = 'Command processed.';
    let responseStatus: AvurnaResponse['status'] = 'success';
    let responseData: any = {};

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
        const weatherResult = await weatherTool.execute(payload);
        responseMessage = `Weather data retrieved.`;
        responseData = weatherResult;
        break;
      case 'fetch_url_action':
        if (!payload || !payload.url || !payload.userIntent) {
          throw new Error("Missing required payload for fetch_url_action: url and userIntent.");
        }
        const fetchResult = await fetchUrlTool.execute(payload);
        responseMessage = `URL fetch completed.`;
        responseData = fetchResult;
        break;
      case 'google_search_action':
        if (!payload || (!payload.query && !payload.queries && !payload.findSimilar)) {
          throw new Error("Missing required payload for google_search_action: query, queries, or findSimilar.");
        }
        const searchResult = await exaSearchTool.execute(payload);
        responseMessage = `Search completed.`;
        responseData = searchResult;
        break;
      default:
        responseMessage = `Unknown action: ${action}. Avurna is confused, but still fabulous.`;
        responseStatus = 'error';
        break;
    }

    res.status(200).json({ message: responseMessage, status: responseStatus, data: responseData });

  } catch (error: any) {
    console.error('[Avurna MCP] Error processing command:', error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}`, status: 'error' });
  }
}

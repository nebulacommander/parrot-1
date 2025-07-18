/*
 * Generated with 💚 by Avurna AI (2025)
 * This is your main MCP serverless endpoint for Avurna.
 * Deploy this with your Next.js app on Vercel.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { executeGithubWorkflow } from '../../mcp/extensions/github-mcp-tool'; // Import the new GitHub tool

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

  // --- Basic Security Check (Enhance for Production!) ---
  // In a real scenario, use robust authentication (e.g., JWT, OAuth).
  // For now, ensure an API key is present.
  const AVURNA_API_KEY = process.env.AVURNA_API_KEY; // Set this in your Vercel environment variables
  const providedApiKey = req.headers['x-avurna-api-key'];

  if (!providedApiKey || providedApiKey !== AVURNA_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: Invalid API Key', status: 'error' });
  }
  // --- End Security Check ---

  try {
    const { action, payload } = req.body; // Avurna's command structure

    console.log(`[Avurna MCP] Received action: ${action} with payload:`, payload);

    let responseMessage = 'Command processed.';
    let responseStatus: AvurnaResponse['status'] = 'success';
    let responseData: any = {};

    // --- Dispatch to your Extensions/Tools Here ---
    switch (action) {
      case 'ping':
        responseMessage = 'Avurna, your connection is live and thriving!';
        responseData = { timestamp: new Date().toISOString() };
        break;
      case 'github_workflow': // New action to trigger GitHub workflows
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
      // Add more cases for other extensions (Canva, Figma, etc.)
      // You will move weatherTool, fetchUrlTool, exaSearchTool logic here and call them via their own actions
      // For example:
      // case 'get_weather_action':
      //   const weatherResult = await getWeather(payload.location); // Assuming getWeather is moved to mcp/extensions
      //   responseMessage = `Weather data retrieved.`;
      //   responseData = weatherResult;
      //   break;
      // case 'fetch_url_action':
      //   const fetchResult = await robustFetchUrlTool(payload.params, payload.userMessage); // Assuming robustFetchUrlTool is moved
      //   responseMessage = `URL fetch completed.`;
      //   responseData = fetchResult;
      //   break;
      // case 'google_search_action':
      //   const searchResult = await exaSearchTool.execute(payload.params); // Assuming exaSearchTool is moved
      //   responseMessage = `Search completed.`;
      //   responseData = searchResult;
      //   break;
      default:
        responseMessage = `Unknown action: ${action}. Avurna is confused, but still fabulous.`;
        responseStatus = 'error';
        break;
    }
    // --- End Dispatch ---

    res.status(200).json({ message: responseMessage, status: responseStatus, data: responseData });

  } catch (error: any) {
    console.error('[Avurna MCP] Error processing command:', error);
    res.status(500).json({ message: `Internal Server Error: ${error.message}`, status: 'error' });
  }
}

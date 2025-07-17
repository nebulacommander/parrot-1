/*
 * Generated with 💚 by Avurna AI (2025)
 * This is your main MCP serverless endpoint for Avurna.
 * Deploy this with your Next.js app on Vercel.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

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
    // You'll import and call functions from mcp/extensions/ here
    switch (action) {
      case 'ping':
        responseMessage = 'Avurna, your connection is live and thriving!';
        responseData = { timestamp: new Date().toISOString() };
        break;
      case 'example_github_action':
        // Example: Call a function from mcp/extensions/github-mcp-tool.ts
        // const githubResult = await githubMcpTool.performAction(payload);
        responseMessage = `Simulated GitHub action for: ${payload.repo}`; // Replace with actual result
        responseData = { simulated: true, action: 'github', payload };
        break;
      // Add more cases for other extensions (Canva, Figma, etc.)
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

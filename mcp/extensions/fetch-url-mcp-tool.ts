// Generated with 💚 by Avurna AI (2025)
// FILE: mcp/extensions/fetch-url-mcp-tool.ts
import { tool } from "ai";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// --- ENHANCED Intent Extraction Utility: Multi-LLM, More Modifiers ---
async function extractUserIntent(userMessage: string): Promise<{ object: string; modality: string; qualifiers: string[]; expanded: string[] }> {
  console.log(`[extractUserIntent] Starting for: "${userMessage}"`);
  const extraQualifiers = [
    'latest', 'official', 'unofficial', 'verified', 'unverified', 'recent', 'oldest', 'top', 'trending', 'viral',
    'long', 'short', 'full', 'clip', 'teaser', 'trailer', 'episode', 'series', 'live', 'recorded', 'HD', '4K', '8K',
    'beginner', 'advanced', 'expert', 'tutorial', 'review', 'comparison', 'demo', 'walkthrough', 'explained',
    'step by step', 'deep dive', 'overview', 'guide', 'how to', 'tips', 'tricks', 'hack', 'strategy', 'insight',
    'analysis', 'breakdown', 'summary', 'recap', 'reaction', 'opinion', 'commentary', 'discussion', 'debate',
    'interview', 'Q&A', 'AMA', 'panel', 'presentation', 'talk', 'speech', 'conference', 'webinar', 'workshop',
    'case study', 'success story', 'fail', 'mistake', 'problem', 'solution', 'fix', 'update', 'patch', 'release',
    'leak', 'rumor', 'announcement', 'news', 'event', 'launch', 'preview', 'sneak peek', 'exclusive', 'behind the scenes',
    'official site', 'channel', 'account', 'profile', 'creator', 'author', 'publisher', 'organization', 'company',
    'AI', 'machine learning', 'coding', 'web', 'frontend', 'backend', 'stack', 'workflow', 'remote', 'onsite', 'hybrid',
    'salary', 'pay', 'job', 'career', 'opportunity', 'internship', 'freelance', 'contract', 'full time', 'part time',
    '2025', '2024', '2023', 'today', 'yesterday', 'this week', 'this month', 'this year', 'last year',
  ];

  const models = [
    google('gemma-3n-e4b-it'),
    google('gemma-3-27b-it'),
  ];

  const prompt = `
    Analyze the following user request and extract the specified components.
    Return the output strictly as a JSON object with the keys: "object", "modality", "qualifiers", "expanded".
    - "object": The main subject or entity of interest (e.g., 'cat', 'Eiffel Tower', 'recipe for pasta'). BE SPECIFIC.
    - "modality": The type of media or information requested (e.g., 'image', 'video', 'article', 'summary', 'data'). If not specified, try to infer or leave empty. For "summarize this article", the modality is "summary".
    - "qualifiers": Descriptive adjectives or attributes modifying the object or modality (e.g., 'funny', 'high resolution', 'blue', 'quick', 'easy', plus: ${extraQualifiers.join(', ')}). List them as an array of strings. If none, provide an empty array [].
    - "expanded": Provide up to 3 synonyms or closely related terms for the "object" to aid in searching. List them as an array of strings. If none, provide an empty array [].

    User Request: "${userMessage}"

    JSON Output:
  `;

  let best: any = null;
  let bestScore = 0;
  let allQualifiers: string[] = [];
  let allExpanded: string[] = [];
  let allObjects: string[] = [];
  let allModalities: string[] = [];

  for (const model of models) {
    try {
      const { text } = await generateText({ model, prompt, temperature: 0.1 });
      let parsed: any;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = JSON.parse(text);
        }
      } catch (e) {
        continue;
      }
      if (parsed) {
        const score = (Array.isArray(parsed.qualifiers) ? parsed.qualifiers.length : 0) + (Array.isArray(parsed.expanded) ? parsed.expanded.length : 0);
        if (score > bestScore) {
          best = parsed;
          bestScore = score;
        }
        if (Array.isArray(parsed.qualifiers)) allQualifiers.push(...parsed.qualifiers.map((q: any) => String(q).trim()).filter(Boolean));
        if (Array.isArray(parsed.expanded)) allExpanded.push(...parsed.expanded.map((e: any) => String(e).trim()).filter(Boolean));
        if (parsed.object) allObjects.push(String(parsed.object).trim());
        if (parsed.modality) allModalities.push(String(parsed.modality).trim());
      }
    } catch (error) {
    }
  }

  if (!best) {
    return { object: userMessage, modality: '', qualifiers: [], expanded: [userMessage] };
  }

  const mergedQualifiers = Array.from(new Set([...(best.qualifiers || []), ...allQualifiers, ...extraQualifiers.filter(q => userMessage.toLowerCase().includes(q.toLowerCase()))])).filter(Boolean);
  const mergedExpanded = Array.from(new Set([...(best.expanded || []), ...allExpanded])).filter(Boolean);
  const mergedObject = best.object || allObjects[0] || userMessage;
  const mergedModality = best.modality || allModalities[0] || '';

  const finalIntent = {
    object: mergedObject,
    modality: mergedModality,
    qualifiers: mergedQualifiers,
    expanded: mergedExpanded,
  };
  console.log("[extractUserIntent] Final merged intent:", finalIntent);
  return finalIntent;
}

// --- HTML Media Extraction Utilities ---
function extractImagesFromHtml(html: string, baseUrl: string): { src: string, alt: string, width?: number, height?: number }[] {
  const imgTagRegex = /<img\s+([^>]*?)>/gi; const srcRegex = /src=["']([^"']+)["']/; const altRegex = /alt=["']([^"']*)["']/; const widthRegex = /width=["']?(\d+)/; const heightRegex = /height=["']?(\d+)/; const images: { src: string, alt: string, width?: number, height?: number }[] = []; const commonUiPatterns = /\/(logo|icon|sprite|spinner|loader|avatar|profile|badge|button|arrow|thumb|pixel|spacer)-?.*\.(\w{3,4})$/i; const commonUiKeywordsInAlt = ['logo', 'icon', 'button', 'arrow', 'avatar', 'profile', 'badge', 'banner ad', 'advertisement']; let match; while ((match = imgTagRegex.exec(html)) !== null) { const imgTagContent = match[1]; const srcMatch = srcRegex.exec(imgTagContent); if (!srcMatch || !srcMatch[1]) continue; let src = srcMatch[1]; const altMatch = altRegex.exec(imgTagContent); let alt = altMatch ? altMatch[1] : ''; try { src = new URL(src, baseUrl).toString(); const widthMatch = widthRegex.exec(imgTagContent); const heightMatch = heightRegex.exec(imgTagContent); const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined; const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined; if (commonUiPatterns.test(src) || commonUiKeywordsInAlt.some(kw => alt.toLowerCase().includes(kw))) continue; if ((width !== undefined && width < 50) && (height !== undefined && height < 50)) continue; images.push({ src, alt, width, height }); } catch { /* Invalid URL */ } } return images;
}
async function extractVideosFromHtml(html: string, baseUrl: string): Promise<{ src: string, poster?: string, alt?: string }[]> {
  const videos: { src: string, poster?: string, alt?: string }[] = []; const videoTagRegex = /<video[^>]*?(?:poster=["']([^"']*)["'])?[^>]*>([\s\S]*?)<\/video>/gi; const sourceTagRegex = /<source[^>]+src=["']([^"']+)["'][^>]*?(?:type=["']video\/([^"']+)["'])?/gi; const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*><\/iframe>/gi; let match; while ((match = videoTagRegex.exec(html)) !== null) { const poster = match[1]; const videoInnerHtml = match[2]; let sourceMatch; let videoSrc: string | null = null; while ((sourceMatch = sourceTagRegex.exec(videoInnerHtml)) !== null) { if (sourceMatch[1] && (!videoSrc || (sourceMatch[2] && sourceMatch[2].includes('mp4')))) { videoSrc = sourceMatch[1]; if (sourceMatch[2] && sourceMatch[2].includes('mp4')) break; } } if (!videoSrc) { const videoSrcAttrMatch = /src=["']([^"']+)["']/.exec(match[0]); if (videoSrcAttrMatch) videoSrc = videoSrcAttrMatch[1]; } if (videoSrc) { try { const absoluteSrc = new URL(videoSrc, baseUrl).toString(); videos.push({ src: absoluteSrc, poster, alt: poster || "video content" }); } catch { /* Invalid URL */ } } } while ((match = iframeRegex.exec(html)) !== null) { const iframeSrc = match[1]; let absoluteSrc: string; try { absoluteSrc = new URL(iframeSrc, baseUrl).toString(); } catch { continue; } if (/youtube\.(com|nocookie\.com)\/embed\//.test(absoluteSrc)) { videos.push({ src: absoluteSrc, alt: "YouTube video" }); continue; } if (/player\.vimeo\.com\/video\//.test(absoluteSrc)) { videos.push({ src: absoluteSrc, alt: "Vimeo video" }); continue; } videos.push({ src: absoluteSrc, alt: "embedded video player" }); } return videos;
}

// --- Helper Function for Basic Table Parsing ---
function parseHtmlTables(html: string): { headers: string[], rows: Record<string, string>[] }[] {
  const tables = [];
  const tableRegex = /<table[\s\S]*?>(.*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null && tables.length < 5) {
    const tableHtml = tableMatch[1];
    let headers: string[] = [];
    const rows: string[][] = [];
    const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    const firstRowHeaderRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/i;
    const cellInHeaderRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let headerMatch;
    let foundHeaders = false;

    while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
      headers.push(headerMatch[1].replace(/<[^>]+>/g, '').trim());
      foundHeaders = true;
    }

    if (!foundHeaders) {
      const firstRowMatch = firstRowHeaderRegex.exec(tableHtml);
      if (firstRowMatch) {
        let cellMatch;
        while ((cellMatch = cellInHeaderRegex.exec(firstRowMatch[1])) !== null) {
          headers.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
        }
        foundHeaders = headers.length > 0;
      }
    }

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let rowMatch;
    let rowsProcessed = 0;

    if (headers.length > 0 && !tableHtml.match(/<thead/i)) {
      rowRegex.exec(tableHtml);
    }

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null && rowsProcessed < 50) {
      const cells: string[] = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0 && (headers.length === 0 || cells.length === headers.length)) {
        rows.push(cells);
        rowsProcessed++;
      }
    }

    if (headers.length > 0 && rows.length > 0) {
      const tableData = rows.map(row => {
        const rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObj[header || `Column ${index + 1}`] = row[index] ?? '';
        });
        return rowObj;
      });
      tables.push({ headers, rows: tableData });
    } else if (headers.length === 0 && rows.length > 0) {
      const tableData = rows.map(row => {
        const rowObj: Record<string, string> = {};
        row.forEach((cell, index) => {
          rowObj[`Column ${index + 1}`] = cell ?? '';
        });
        return rowObj;
      });
      tables.push({ headers: rows[0] ? Object.keys(tableData[0]) : [], rows: tableData });
    }
  }
  return tables;
}

// --- Vision-based Image Filtering Utility ---
async function filterImagesWithVision(
  images: Array<{ src: string; alt?: string;[key: string]: any }>,
  userQuery: string,
  userIntent: { modality?: string } | null = null
): Promise<{
  filtered: typeof images;
  all: typeof images;
  filteringApplied: boolean;
  warning?: string;
}> {
  const subjectiveWords = [
    'sexy', 'beautiful', 'cute', 'hot', 'gorgeous', 'pretty', 'handsome', 'ugly', 'attractive', 'aesthetic',
    'cool', 'funny', 'weird', 'strange', 'creepy', 'disturbing', 'artistic', 'stylish', 'awesome', 'amazing',
    'inspiring', 'breathtaking', 'adorable', 'silly', 'hilarious', 'sad', 'happy', 'emotional', 'moody',
    'romantic', 'dreamy', 'vintage', 'retro', 'futuristic', 'minimalist', 'maximalist', 'abstract', 'surreal',
    'impressionist', 'expressionist', 'dramatic', 'epic', 'intense', 'provocative', 'suggestive', 'explicit',
    'nsfw', 'lewd', 'erotic', 'porn', 'nude', 'naked', 'sensual', 'fetish', 'fetishy', 'fetishistic', 'kinky',
    'sexy', 'sex', 'sexual', 'provocative', 'suggestive', 'explicit', 'nsfw', 'lewd', 'erotic', 'porn', 'nude', 'naked', 'sensual', 'fetish', 'fetishy', 'fetishistic', 'kinky'
  ];
  const q = userQuery.toLowerCase();
  if (subjectiveWords.some(w => q.includes(w))) {
    return {
      filtered: images,
      all: images,
      filteringApplied: false,
      warning: 'Vision filtering skipped for subjective queries.'
    };
  }
  const isObjective = (userIntent && userIntent.modality === 'image') || /\b(image|photo|picture|wallpaper|gallery|pic|jpeg|jpg|png|gif|unsplash|pinterest|flickr|stock)\b/i.test(userQuery);
  if (!isObjective) {
    return {
      filtered: images,
      all: images,
      filteringApplied: false
    };
  }
  const visionModel = google('gemma-3-27b-it');
  const threshold = 0.85;
  const results = [];
  for (const img of images.slice(0, 10)) {
    try {
      const prompt = `Does this image clearly show ALL of the following: ${userQuery}? Be strict. Only give high confidence if every element is present and obvious.\nImage URL: ${img.src}\nRespond as JSON: { \"description\": \"15-word description\", \"confidence\": \"0.0-1.0\" }`;
      const { text } = await generateText({ model: visionModel, prompt, temperature: 0.2 });
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const confidence = Number(parsed.confidence) || 0;
      if (confidence >= threshold) {
        results.push({ ...img, description: parsed.description || '', confidence });
      }
    } catch (e) {
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return {
    filtered: results,
    all: images,
    filteringApplied: true
  };
}

// --- Vision-based Video Filtering Utility ---
async function filterVideosWithVision(
  videos: Array<{ src: string; poster?: string; title?: string;[key: string]: any }>,
  userQuery: string,
  userIntent: { modality?: string } | null = null
): Promise<{
  filtered: typeof videos;
  all: typeof videos;
  filteringApplied: boolean;
  warning?: string;
}> {
  const subjectiveWords = [
    'sexy', 'beautiful', 'cute', 'hot', 'gorgeous', 'pretty', 'handsome', 'ugly', 'attractive', 'aesthetic',
    'cool', 'funny', 'weird', 'strange', 'creepy', 'disturbing', 'artistic', 'stylish', 'awesome', 'amazing',
    'inspiring', 'breathtaking', 'adorable', 'silly', 'hilarious', 'sad', 'happy', 'emotional', 'moody',
    'romantic', 'dreamy', 'vintage', 'retro', 'futuristic', 'minimalist', 'maximalist', 'abstract', 'surreal',
    'impressionist', 'expressionist', 'dramatic', 'epic', 'intense', 'provocative', 'suggestive', 'explicit',
    'nsfw', 'lewd', 'erotic', 'porn', 'nude', 'naked', 'sensual', 'fetish', 'fetishy', 'fetishistic', 'kinky',
    'sexy', 'sex', 'sexual', 'provocative', 'suggestive', 'explicit', 'nsfw', 'lewd', 'erotic', 'porn', 'nude', 'naked', 'sensual', 'fetish', 'fetishy', 'fetishistic', 'kinky'
  ];
  const q = userQuery.toLowerCase();
  if (subjectiveWords.some(w => q.includes(w))) {
    return {
      filtered: videos,
      all: videos,
      filteringApplied: false,
      warning: 'Vision filtering skipped for subjective queries.'
    };
  }
  const isObjective = (userIntent && userIntent.modality === 'video') || /\b(video|movie|film|clip|trailer|watch|youtube|vimeo|dailymotion)\b/i.test(userQuery);
  if (!isObjective) {
    return {
      filtered: videos,
      all: videos,
      filteringApplied: false
    };
  }
  const isChannelOrProfileUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        if (/\/(@|channel\/|user\/|c\/)[^/]+/i.test(u.pathname) && !/\/watch\?v=|\/embed\//.test(u.pathname)) return true;
      }
      if (u.hostname.includes('tiktok.com') && /\/(@|user\/)[^/]+/i.test(u.pathname) && !/\/video\//.test(u.pathname)) return true;
    } catch { }
    return false;
  };
  const visionModel = google('gemma-3-27b-it');
  const threshold = 0.85;
  const results = [];
  for (const vid of videos.slice(0, 10)) {
    if (isChannelOrProfileUrl(vid.src)) continue;
    try {
      const mediaUrl = vid.poster || vid.src;
      const prompt = `Does this video (or its thumbnail) clearly show ALL of the following: ${userQuery}? Be strict. Only give high confidence if every element is present and obvious.\nMedia URL: ${mediaUrl}\nRespond as JSON: { \"description\": \"15-word description\", \"confidence\": \"0.0-1.0\" }`;
      const { text } = await generateText({ model: visionModel, prompt, temperature: 0.2 });
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      const confidence = Number(parsed.confidence) || 0;
      if (confidence >= threshold) {
        results.push({ ...vid, description: parsed.description || '', confidence });
      }
    } catch (e) {
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return {
    filtered: results,
    all: videos,
    filteringApplied: true
  };
}

export const fetchUrlTool = tool({
  description:
    "A hybrid tool that fetches content from a URL using two methods in parallel: a direct, vision-enabled recursive crawler and Exa's high-speed content extractor. It intelligently merges the results to provide the most accurate and comprehensive media, text, or summary.",
  parameters: z.object({
    url: z.string().describe("The starting URL to fetch and analyze."),
    userIntent: z.string().describe("The user's goal or question (e.g., 'image of an iPhone', 'summarize this article about macOS')."),
    recursionDepth: z.number().optional().describe("How many levels of links to follow (0 = current page only, default 1). Max 2."),
    liveCrawlMode: z.enum(["preferred", "always", "never"]).optional().describe("Exa LiveCrawl mode: 'preferred' (default) balances freshness and reliability; 'always' forces a live check; 'never' uses cache."),
  }),
  execute: async (params) => {
    const {
      url,
      userIntent,
      recursionDepth = 1,
      liveCrawlMode = "preferred",
    } = params;

    const timeoutMs = 45000;
    const overallStartTime = Date.now();

    console.log(`[Hybrid Fetch] Starting. URL: ${url}, Intent: "${userIntent}", Depth: ${recursionDepth}, Exa Mode: ${liveCrawlMode}`);

    const initialIntent = await extractUserIntent(userIntent);
    if (!initialIntent.object && !url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
      return { error: "Could not understand the main object of your request.", url, narration: "I'm sorry, I had trouble understanding what you're looking for. Could you rephrase?", overallStats: { totalTimeMs: Date.now() - overallStartTime } };
    }

    async function fetchWithExa(targetUrl: string, crawlMode: "preferred" | "always" | "never") {
      const exaStartTime = Date.now();
      console.log(`[Exa Fetch] Starting for ${targetUrl} with mode: ${crawlMode}`);
      try {
        const response = await fetch('https://api.exa.ai/contents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXA_API_KEY || '',
          },
          body: JSON.stringify({ urls: [targetUrl], livecrawl: crawlMode }),
        });
        const jsonResponse = await response.json();
        const result = jsonResponse.results[0];
        if (!result || !result.text) throw new Error("Exa returned no content.");
        console.log(`[Exa Fetch] Success. Got ${result.text.length} chars. Took ${Date.now() - exaStartTime}ms.`);
        return { source: 'exa', success: true, textContent: result.text, elapsedMs: Date.now() - exaStartTime };
      } catch (error: any) {
        console.error(`[Exa Fetch] Failed for ${targetUrl}:`, error.message);
        return { source: 'exa', success: false, error: error.message, elapsedMs: Date.now() - exaStartTime };
      }
    }

    async function fetchAndAnalyzeRecursively() {
      const directFetchStartTime = Date.now();
      const visited = new Set<string>();
      let pagesFetchedCount = 0;
      const maxPages = 10;
      let operationTimedOut = false;
      const baseOrigin = (() => { try { return new URL(url).origin; } catch { return null; } })();
      if (!baseOrigin) return { source: 'direct', success: false, error: "Invalid base URL", elapsedMs: Date.now() - directFetchStartTime };

      async function getLinkSubject(linkText: string, linkHref: string, userGoal: string): Promise<string> {
        try { const linkModel = google('gemma-3n-e4b-it'); const prompt = `A user's goal is to "${userGoal}". On a webpage, there is a link with the text "${linkText}" that points to "${linkHref}". What is the primary subject of THIS LINK? Respond with a single noun or short phrase.`; const { text } = await generateText({ model: linkModel, prompt, temperature: 0.1, maxTokens: 20 }); return text.trim().toLowerCase(); } catch (e) { console.warn(`[getLinkSubject] LLM call failed`); return "unknown"; }
      }
      async function extractAndScoreLinks(htmlContent: string, currentUrl: string, CIntent: any): Promise<{ href: string, text: string, score: number }[]> {
        const aTagRegex = /<a[^>]+href=["']([^"'#?]+)["'][^>]*>(.*?)<\/a>/gi; const potentialLinks: { href: string; text: string }[] = []; let match; while ((match = aTagRegex.exec(htmlContent)) !== null) { const href = match[1]; const textContent = match[2].replace(/<[^>]+>/g, ' ').trim(); if (!href || href.startsWith('#') || textContent.length < 3) continue; try { const absoluteHref = new URL(href, currentUrl).toString(); if (new URL(absoluteHref).origin === baseOrigin && !visited.has(absoluteHref)) potentialLinks.push({ href: absoluteHref, text: textContent }); } catch { } } const scoredLinks: { href: string; text: string; score: number }[] = []; const linkAnalysisPromises = potentialLinks.slice(0, 10).map(async link => { if (Date.now() - overallStartTime > timeoutMs - 5000) return; const subject = await getLinkSubject(link.text, link.href, CIntent.object); let score = 0; const intentKeywords = [CIntent.object, ...CIntent.expanded].filter(Boolean).map(k => k.toLowerCase()); if (intentKeywords.some(kw => subject.includes(kw))) score += 10; else if (intentKeywords.some(kw => link.text.toLowerCase().includes(kw))) score += 2; if (score > 3) scoredLinks.push({ ...link, score }); }); await Promise.all(linkAnalysisPromises); scoredLinks.sort((a, b) => b.score - a.score); return scoredLinks.slice(0, 5);
      }
      function extractMainContent(html: string): string { return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
      async function describeImageWithVision(src: string, CIntent: any): Promise<{ description: string; confidence: number; isRelevant: boolean; }> {
        try { const visionModel = google('gemma-3-27b-it'); const prompt = `Analyze image at ${src}. User wants: "${CIntent.object}". JSON: { "description": "15-word description.", "confidence": "0.0-1.0 confidence it matches user intent." }`; const { text } = await generateText({ model: visionModel, prompt, temperature: 0.2 }); const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'); return { description: parsed.description || "No description.", confidence: Number(parsed.confidence) || 0, isRelevant: (Number(parsed.confidence) || 0) > 0.6 }; } catch (e) { return { description: "Vision error", confidence: 0, isRelevant: false }; }
      }
      async function describeVideoWithVision(src: string, CIntent: any): Promise<{ description: string; confidence: number; isRelevant: boolean; }> {
        try { const visionModel = google('gemma-3-27b-it'); const prompt = `Analyze video at ${src}. User wants: "${CIntent.object}". JSON: { "description": "20-word summary.", "confidence": "0.0-1.0 confidence it matches." }`; const { text } = await generateText({ model: visionModel, prompt, temperature: 0.2 }); const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'); return { description: parsed.description || "No summary.", confidence: Number(parsed.confidence) || 0, isRelevant: (Number(parsed.confidence) || 0) > 0.6 }; } catch (e) { return { description: "Vision error", confidence: 0, isRelevant: false }; }
      }
      async function filterImagesWithVision(imagesFromHtml: { src: string, alt: string }[], CIntent: any) {
        const results = []; for (const img of imagesFromHtml.slice(0, 10)) { if (Date.now() - overallStartTime > timeoutMs) { operationTimedOut = true; break; } const visionAnalysis = await describeImageWithVision(img.src, CIntent); if (visionAnalysis.isRelevant) results.push({ ...img, ...visionAnalysis }); } results.sort((a, b) => b.confidence - a.confidence); return results;
      }
      async function filterVideosWithVision(videosFromHtml: { src: string, poster?: string, alt?: string }[], CIntent: any) {
        const results = []; for (const vid of videosFromHtml.slice(0, 5)) { if (Date.now() - overallStartTime > timeoutMs) { operationTimedOut = true; break; } const visionAnalysis = await describeVideoWithVision(vid.src, CIntent); if (visionAnalysis.isRelevant) results.push({ ...vid, ...visionAnalysis }); } results.sort((a, b) => b.confidence - a.confidence); return results;
      }

      async function doFetchAndAnalyze({ currentUrl, currentDepth, CIntent }: { currentUrl: string, currentDepth: number, CIntent: any }): Promise<any> {
        if (operationTimedOut || Date.now() - overallStartTime > timeoutMs || pagesFetchedCount >= maxPages || visited.has(currentUrl)) {
          return { error: 'Aborted fetch due to limits.', url: currentUrl, steps: ["Aborted fetch"], images: [], videos: [], textContent: "" };
        }
        visited.add(currentUrl); pagesFetchedCount++;
        const localSteps: string[] = [`Direct Fetch L${recursionDepth - currentDepth}: ${currentUrl}`];

        let res: Response;
        try {
          res = await fetch(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AvurnaBot/1.0)' }, signal: AbortSignal.timeout(15000) });
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        } catch (fetchError: any) {
          return { error: `Fetch error: ${fetchError.message}`, url: currentUrl, steps: localSteps, images: [], videos: [], textContent: "" };
        }

        const contentType = res.headers.get('content-type') || '';

        if (contentType.startsWith('image/')) {
          localSteps.push('Detected direct image link. Sending for analysis.');
          const visionResult = await describeImageWithVision(currentUrl, CIntent);
          const imageResult = { src: currentUrl, alt: visionResult.description, ...visionResult };
          return { url: currentUrl, images: [imageResult], videos: [], textContent: "", steps: localSteps };
        } else if (contentType.includes('application/pdf')) {
          return { type: 'document', url: currentUrl, description: 'Link is a PDF. Content analysis not supported.', steps: localSteps, images: [], videos: [], textContent: "" };
        } else if (!contentType.includes('text/html')) {
          const text = await res.text();
          return { type: 'file', url: currentUrl, description: `File (${contentType})`, steps: localSteps, images: [], videos: [], textContent: text.slice(0, 500) };
        }

        const htmlContent = await res.text();
        localSteps.push('Processing HTML content for media and text.');

        let pageResults: { images: any[], videos: any[], textContent?: string } = { images: [], videos: [] };
        const inferredModality = CIntent.modality || (userIntent.toLowerCase().includes('video') ? 'video' : (userIntent.toLowerCase().includes('image') ? 'image' : 'summary'));

        const imagesOnPage = extractImagesFromHtml(htmlContent, currentUrl);
        const videosOnPage = await extractVideosFromHtml(htmlContent, currentUrl);
        pageResults.images = await filterImagesWithVision(imagesOnPage, CIntent);
        pageResults.videos = await filterVideosWithVision(videosOnPage, CIntent);

        const textContent = extractMainContent(htmlContent);
        pageResults.textContent = textContent.length > 200 ? textContent : "";

        let isGoodEnoughFound = (inferredModality === 'image' && pageResults.images.length > 0) || (inferredModality === 'video' && pageResults.videos.length > 0) || (inferredModality === 'summary' && textContent.length > 1000);
        let pageRecursiveResults: any[] = [];
        if (currentDepth > 0 && !isGoodEnoughFound && !operationTimedOut) {
          const pageNavLinks = await extractAndScoreLinks(htmlContent, currentUrl, CIntent);
          if (pageNavLinks.length > 0) {
            localSteps.push(`Semantically exploring top link: ${pageNavLinks[0].href}`);
            const subResult = await doFetchAndAnalyze({ currentUrl: pageNavLinks[0].href, currentDepth: currentDepth - 1, CIntent });
            if (subResult && !subResult.error) pageRecursiveResults.push(subResult);
          }
        }

        const allImages = [...pageResults.images, ...pageRecursiveResults.flatMap(r => r.images || [])];
        const allVideos = [...pageResults.videos, ...pageRecursiveResults.flatMap(r => r.videos || [])];
        const allText = pageResults.textContent || pageRecursiveResults.map(r => r.textContent).find(t => t) || "";
        allImages.sort((a, b) => b.confidence - a.confidence);
        allVideos.sort((a, b) => b.confidence - a.confidence);

        return { url: currentUrl, images: allImages, videos: allVideos, textContent: allText, steps: localSteps };
      }

      const result = await doFetchAndAnalyze({ currentUrl: url, currentDepth: recursionDepth, CIntent: initialIntent });
      return { source: 'direct', success: !result.error, ...result, elapsedMs: Date.now() - directFetchStartTime };
    }

    const [exaResult, directResult] = await Promise.allSettled([
      fetchWithExa(url, liveCrawlMode),
      fetchAndAnalyzeRecursively()
    ]);

    const mergedResult: any = { url, images: [], videos: [], textContent: "", narration: "", steps: [], fetchMethods: {}, overallStats: {} };

    const exaData = exaResult.status === 'fulfilled' && exaResult.value.success ? exaResult.value : null;
    const directData = directResult.status === 'fulfilled' && directResult.value.success ? directResult.value : null;

    mergedResult.fetchMethods.exa = { success: !!exaData, elapsedMs: exaResult.status === 'fulfilled' ? exaResult.value.elapsedMs : 0, error: exaData ? null : (exaResult.status === 'fulfilled' ? exaResult.value.error : exaResult.reason?.message || 'Exa fetch failed') };
    mergedResult.fetchMethods.direct = { success: !!directData, elapsedMs: directData ? directData.elapsedMs : 0, error: directData ? directData.error : (directResult.status === 'fulfilled' ? directResult.value.error : directResult.reason?.message || 'Direct fetch failed') };


    if (!exaData && !directData) {
      return { error: `Both fetch methods failed. Exa: ${mergedResult.fetchMethods.exa.error}. Direct: ${mergedResult.fetchMethods.direct.error}`, narration: "I'm sorry, I was unable to retrieve content from that URL. The site may be down or blocking access.", url, fetchMethods: mergedResult.fetchMethods, overallStats: { totalTimeMs: Date.now() - overallStartTime } };
    }

    mergedResult.images = directData?.images || [];
    mergedResult.videos = directData?.videos || [];
    mergedResult.textContent = exaData?.textContent || directData?.textContent || "";
    mergedResult.steps = directData?.steps || ['Exa fetch completed, direct fetch failed or provided no steps.'];

    if (initialIntent.modality === 'summary' && mergedResult.textContent) {
      try {
        const summaryModel = google('gemma-3-27b-it');
        const { text } = await generateText({ model: summaryModel, prompt: `Provide a concise summary of this text: "${mergedResult.textContent.substring(0, 25000)}"` });
        mergedResult.narration = text;
      } catch (e: any) { mergedResult.narration = `Extracted article text, but summarization failed: ${e.message}`; }
    } else {
      const objectStr = initialIntent.object || "the requested content";
      const hasMedia = mergedResult.images.length > 0 || mergedResult.videos.length > 0;
      if (hasMedia) {
        mergedResult.narration = `I found ${mergedResult.images.length} relevant image(s) and ${mergedResult.videos.length} relevant video(s) for "${objectStr}".`;
      } else if (mergedResult.textContent) {
        mergedResult.narration = `I successfully extracted the page content for "${objectStr}". While no specific media was found, I have the full text available for summarization.`;
      } else {
        mergedResult.narration = `I attempted to fetch content for "${objectStr}" but couldn't retrieve specific media or extensive text.`;
      }
    }

    mergedResult.overallStats = { totalTimeMs: Date.now() - overallStartTime, timedOut: Date.now() - overallStartTime >= timeoutMs };
    return mergedResult;
  },
});

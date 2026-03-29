// Generated with 💚 by Avurna AI (2025)
// FILE: mcp/extensions/exa-search-mcp-tool.ts
import Exa from "exa-js";
import { tool } from "ai";
import { z } from "zod";
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const exa = new Exa(process.env.EXA_API_KEY || '');

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

// --- Helper: Infer domains to include based on user intent (image, video, etc.) ---
function inferDomainsFromIntent(query: string): string[] {
  const q = query.toLowerCase();
  if (/\b(image|photo|picture|wallpaper|gallery|pic|jpeg|jpg|png|gif|unsplash|pinterest|flickr|stock)\b/.test(q)) {
    return [
      'unsplash.com',
      'pinterest.com',
      'flickr.com',
      'gettyimages.com',
      'pexels.com',
      'stock.adobe.com',
      'shutterstock.com',
      '500px.com',
      'istockphoto.com',
      'deviantart.com',
      'wallhaven.cc',
      'pixabay.com',
      'freepik.com',
      'dreamstime.com',
      'canva.com',
      'unsplash.com',
    ];
  }
  if (/\b(video|movie|film|clip|trailer|watch|youtube|vimeo|dailymotion)\b/.test(q)) {
    return [
      'youtube.com',
      'vimeo.com',
      'dailymotion.com',
      'tiktok.com',
      'metacafe.com',
      'veoh.com',
      'bilibili.com',
      'twitch.tv',
    ];
  }
  return [];
}

export const exaSearchTool = tool({
  description: "Performs a web search using Exa. It can handle a single query for specific media (images, videos) or multiple queries in parallel for general research. Use 'queries' for multiple topics, and 'query' for a single, specific request.",
  parameters: z.object({
    query: z.string().optional().describe("A single search query, best for specific media requests like 'images of cats' or 'video of a recipe'."),
    queries: z.array(z.string()).optional().describe("An array of search queries to run in parallel, best for general research on multiple topics."),
    findSimilar: z.string().optional().describe("Optional URL to find similar content for instead of performing a regular search."),
    excludeSourceDomain: z.boolean().optional().describe("When using findSimilar, whether to exclude results from the same domain (default: false)."),
    numResults: z.number().optional().describe("Number of results to return (default: 10)."),
  }).refine(data => (!!data.query && !data.queries) || (!data.query && !!data.queries) || !!data.findSimilar, {
    message: "You must provide either a single 'query', an array of 'queries', or a 'findSimilar' URL.",
  }),

  execute: async ({ 
    query, 
    queries, 
    findSimilar, 
    excludeSourceDomain = false, 
    numResults = 10  
  }) => {
    const start = Date.now();
    
    if (findSimilar) {
      console.log(`[Exa Search] Mode: Find Similar. URL: ${findSimilar}`);
      try {
        const response = await exa.findSimilarAndContents(findSimilar, { numResults, excludeSourceDomain, text: true, summary: true });
        const similarLinks = response.results.map(result => ({ title: result.title, url: result.url, score: result.score, favicon: result.favicon, snippet: result.text ? result.text.substring(0, 200) + "..." : "", summary: result.summary, siteName: result.title || (() => { try { return new URL(result.url).hostname.replace(/^www\./, ''); } catch { return result.url; }})(), publishedDate: result.publishedDate, author: result.author, }));
        const imagesForCarousel = response.results.filter(r => typeof r.image === 'string' && !!r.image).map(r => ({ src: String(r.image), alt: (r.title || r.url), source: { url: r.url, title: r.title }, }));
        return { query: `similar to ${findSimilar}`, sourceUrl: findSimilar, narration: `Found ${similarLinks.length} similar links.`, sources: similarLinks, searchResults: response.results, images: imagesForCarousel, isSimilarSearch: true, elapsedMs: Date.now() - start, };
      } catch (error: any) {
        return { query: `similar to ${findSimilar}`, sourceUrl: findSimilar, error: `Failed to find similar links: ${error.message}`, isSimilarSearch: true };
      }
    }

    const searchTerms = queries || (query ? [query] : []);
    if (searchTerms.length === 0) {
      return { error: "No search query was provided." };
    }
    
    const primaryQuery = searchTerms[0];
    const isImageRequest = /\b(image|photo|picture|wallpaper|gallery|pic|jpeg|jpg|png|gif)\b/i.test(primaryQuery);
    const isVideoRequest = /\b(video|movie|film|clip|trailer|watch|youtube|vimeo)\b/i.test(primaryQuery);

    if (query && (isImageRequest || isVideoRequest)) {
      console.log(`[Exa Search] Mode: Single Media. Query: "${query}"`);
      try {
        const searchResponse = await exa.search(query, { numResults: 10, includeDomains: inferDomainsFromIntent(query) });
        let imagesForCarousel: any[] = [];
        let videosForCarousel: any[] = [];
        let visionFilteringInfo: any = null;

        if (isImageRequest) {
          const rawImages = searchResponse.results.filter(r => typeof r.image === 'string' && !!r.image).map(r => ({ src: String(r.image), alt: (r.title || r.url), source: { url: r.url, title: r.title } }));
          const intent = await extractUserIntent(query);
          visionFilteringInfo = await filterImagesWithVision(rawImages, query, intent);
          imagesForCarousel = visionFilteringInfo.filtered;
        }
        
        if (isVideoRequest) {
          videosForCarousel = searchResponse.results.filter(r => r.url && /youtube|vimeo|dailymotion|tiktok/.test(r.url)).map((result: any) => ({ type: 'video', src: result.url, title: result.title, poster: result.image, source: { url: result.url, title: result.title } }));
        }

        const sourcesFromSearch = searchResponse.results.map(r => ({ url: r.url, sourceUrl: r.url, title: r.title || r.url, snippet: r.text || '', image: r.image, favicon: r.favicon, siteName: r.title || (r.url ? (() => { try { return new URL(r.url).hostname.replace(/^www\./, ''); } catch { return r.url; } })() : ''), publishedDate: r.publishedDate, author: r.author, score: r.score }));
        
        return {
          query,
          narration: isImageRequest ? `I found ${imagesForCarousel.length} images for you.` : `I found ${videosForCarousel.length} videos for you.`,
          images: imagesForCarousel,
          videos: videosForCarousel,
          sources: sourcesFromSearch,
          searchResults: searchResponse.results,
          webSearchQueries: [query],
          elapsedMs: Date.now() - start,
          visionFiltering: visionFilteringInfo,
        };
      } catch (error: any) {
        return { query, error: `Failed to execute media search: ${error.message}` };
      }
    }

    console.log(`[Exa Search] Mode: Parallel General. Queries:`, searchTerms);
    try {
      interface ExaCitation {
        url: string;
        title?: string;
        text?: string;
        image?: string;
        publishedDate?: string;
        author?: string;
        favicon?: string;
      }

      interface ExaAnswerResponse {
        answer?: string;
        citations?: ExaCitation[];
      }

      const searchPromises: Promise<ExaAnswerResponse>[] = searchTerms.map(async (term: string) => {
        const response = await exa.answer(term, {});
        let answer: string | undefined;
        if (typeof response.answer === 'string') {
          answer = response.answer;
        } else if (response.answer && typeof response.answer === 'object') {
          answer = JSON.stringify(response.answer);
        } else {
          answer = undefined;
        }
        return { ...response, answer } as ExaAnswerResponse;
      });
      const responses = await Promise.all(searchPromises);

      let combinedAnswer = "";
      const allCitations: any[] = [];
      
      responses.forEach((response, index) => {
        if (response.answer) {
          combinedAnswer += `\n\n## Results for: "${searchTerms[index]}"\n\n${response.answer}`;
        }
        if (response.citations) {
          allCitations.push(...response.citations);
        }
      });

      const sourcesForCards = allCitations.map(c => ({ url: c.url as string, sourceUrl: c.url as string, title: c.title || c.url as string, snippet: c.text || '', siteName: c.title || (c.url ? (() => { try { return new URL(c.url as string).hostname.replace(/^www\./, ''); } catch { return c.url as string; } })() : ''), image: c.image, publishedDate: c.publishedDate, author: c.author, favicon: c.favicon }));

      return {
        query: searchTerms.join(', '),
        answer: combinedAnswer.trim(),
        sources: sourcesForCards,
        searchResults: allCitations,
        webSearchQueries: searchTerms,
        elapsedMs: Date.now() - start,
      };
    } catch (error: any) {
      return { query: searchTerms.join(', '), error: `Failed to execute parallel search: ${error.message}` };
    }
  },
});

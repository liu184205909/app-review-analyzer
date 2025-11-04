// OpenRouter AI Service
import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
});

export interface Review {
  rating: number;
  title?: string;
  content: string;
  author?: string;
  date: Date;
  appVersion?: string;
}

export interface AnalysisResult {
  criticalIssues: Array<{
    title: string;
    frequency: number;
    severity: 'high' | 'medium' | 'low';
    examples: string[];
    affectedVersion?: string;
  }>;
  experienceIssues: Array<{
    title: string;
    frequency: number;
    examples: string[];
  }>;
  featureRequests: Array<{
    title: string;
    frequency: number;
    examples: string[];
  }>;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  insights: string;
  priorityActions: string[];
}

export interface ComparisonResult {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  comparisonMatrix: {
    [key: string]: { [appName: string]: number };
  };
  actionableInsights: string[];
}

export async function analyzeSingleApp(
  reviews: Review[],
  model: string = process.env.DEFAULT_MODEL_PRO || 'anthropic/claude-3.5-sonnet'
): Promise<AnalysisResult> {
  
  const prompt = buildSingleAppPrompt(reviews);
  
  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional product analyst and UX expert specializing in app review analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);
    
    return result as AnalysisResult;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw new Error('Failed to analyze reviews');
  }
}

export async function compareApps(
  appsReviews: { appName: string; reviews: Review[] }[],
  model: string = process.env.DEFAULT_MODEL_PRO || 'anthropic/claude-3.5-sonnet'
): Promise<ComparisonResult> {
  
  const prompt = buildComparisonPrompt(appsReviews);
  
  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a competitive analysis expert who helps product teams understand their position in the market by analyzing user feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);
    
    return result as ComparisonResult;
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw new Error('Failed to compare apps');
  }
}

function buildSingleAppPrompt(reviews: Review[]): string {
  // Filter 1-3 star reviews for deep dive
  const negativeReviews = reviews.filter(r => r.rating <= 3);
  
  const reviewsText = negativeReviews.slice(0, 100).map(r => 
    `Rating: ${r.rating}⭐\nDate: ${r.date.toLocaleDateString()}\nContent: ${r.content}\n${r.appVersion ? `Version: ${r.appVersion}` : ''}`
  ).join('\n---\n');

  return `Analyze the following negative reviews (1-3⭐) from an app. Extract actionable insights.

Total reviews analyzed: ${negativeReviews.length}

Reviews:
${reviewsText}

Please provide analysis in the following JSON format:
{
  "criticalIssues": [
    {
      "title": "Issue title",
      "frequency": number (how many times mentioned),
      "severity": "high" | "medium" | "low",
      "examples": ["quote from review 1", "quote from review 2"],
      "affectedVersion": "version number if mentioned"
    }
  ],
  "experienceIssues": [similar structure],
  "featureRequests": [similar structure],
  "sentiment": {
    "positive": 0-100,
    "negative": 0-100,
    "neutral": 0-100
  },
  "insights": "A paragraph summarizing key findings",
  "priorityActions": ["Action 1", "Action 2", "Action 3"]
}

Focus on:
1. Critical bugs (crashes, data loss)
2. UX problems
3. Most requested features
4. Version-specific issues`;
}

function buildComparisonPrompt(appsReviews: { appName: string; reviews: Review[] }[]): string {
  const targetApp = appsReviews[0];
  const competitors = appsReviews.slice(1);
  
  let prompt = `Perform a competitive analysis using SWOT framework based on user reviews.

YOUR APP: ${targetApp.appName}
Reviews sample:
${targetApp.reviews.slice(0, 50).map(r => `${r.rating}⭐: ${r.content}`).join('\n')}

COMPETITORS:
`;

  competitors.forEach(comp => {
    prompt += `\n${comp.appName}:\n`;
    prompt += comp.reviews.slice(0, 50).map(r => `${r.rating}⭐: ${r.content}`).join('\n');
  });

  prompt += `

Provide analysis in JSON format:
{
  "executiveSummary": "One sentence summary",
  "strengths": ["What your app does well compared to competitors"],
  "weaknesses": ["Where your app falls short"],
  "opportunities": ["Competitor weaknesses you can exploit"],
  "threats": ["Competitor strengths that threaten you"],
  "comparisonMatrix": {
    "Features": {"${targetApp.appName}": 7, "${competitors[0]?.appName}": 9},
    "Stability": {},
    "UI/UX": {},
    "Performance": {},
    "Support": {}
  },
  "actionableInsights": [
    "Immediate action items based on analysis"
  ]
}

Be specific and quote actual user feedback where relevant.`;

  return prompt;
}


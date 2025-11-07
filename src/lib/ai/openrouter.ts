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
      max_tokens: 8000, // Increased to support more examples
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
  // Analyze ALL reviews for comprehensive insights
  const allReviews = reviews;
  const criticalReviews = allReviews.filter(r => r.rating <= 2); // Critical issues (1-2 stars)
  const experienceReviews = allReviews.filter(r => r.rating === 3); // Experience issues (3 stars)
  const positiveReviews = allReviews.filter(r => r.rating >= 4); // Feature requests (4-5 stars)

  const reviewsText = allReviews.slice(0, 300).map(r =>
    `Rating: ${r.rating}⭐\nDate: ${r.date.toLocaleDateString()}\nContent: ${r.content}\n${r.appVersion ? `Version: ${r.appVersion}` : ''}`
  ).join('\n---\n');

  return `Analyze the following app reviews comprehensively. Extract actionable insights across ALL rating categories.

REVIEW BREAKDOWN:
- Critical Issues (1-2⭐): ${criticalReviews.length} reviews
- Experience Issues (3⭐): ${experienceReviews.length} reviews
- Positive Reviews (4-5⭐): ${positiveReviews.length} reviews
- Total Reviews: ${allReviews.length}

Reviews to analyze (sample of ${Math.min(300, allReviews.length)} reviews):
${reviewsText}

IMPORTANT: For each issue type, provide 15-30 specific examples to match industry standards. Competitors show dozens of examples per category.

Please provide analysis in the following JSON format:
{
  "criticalIssues": [
    {
      "title": "Issue title",
      "frequency": number (how many times mentioned),
      "severity": "high" | "medium" | "low",
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20"],
      "affectedVersion": "version number if mentioned"
    }
  ],
  "experienceIssues": [
    {
      "title": "Issue title",
      "frequency": number,
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20"]
    }
  ],
  "featureRequests": [
    {
      "title": "Feature request title",
      "frequency": number,
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20"]
    }
  ],
  "sentiment": {
    "positive": 0-100,
    "negative": 0-100,
    "neutral": 0-100
  },
  "insights": "A comprehensive paragraph summarizing key findings from all rating categories",
  "priorityActions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"]
}

ANALYSIS FOCUS:
1. Critical Issues (1-2⭐): Focus on crashes, data loss, security, payment issues, broken core functionality
2. Experience Issues (3⭐): Focus on UX/UI problems, performance, navigation, usability issues
3. Feature Requests (4-5⭐): Focus on new feature requests, enhancements, missing functionality from positive reviews

CRITICAL REQUIREMENT: Each category must include 15-20 detailed examples to provide comprehensive insights similar to competitors like AppFollow and Sensor Tower.`;
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


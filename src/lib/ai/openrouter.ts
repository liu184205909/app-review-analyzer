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
      max_tokens: 12000, // Further increased for industry-grade detailed analysis
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

  return `COMPREHENSIVE APP REVIEW ANALYSIS - INDUSTRY-GRADE INSIGHTS

REVIEW BREAKDOWN:
- Critical Issues (1-2⭐): ${criticalReviews.length} reviews
- Experience Issues (3⭐): ${experienceReviews.length} reviews
- Feature Requests (4-5⭐): ${positiveReviews.length} reviews
- Total Reviews: ${allReviews.length}

Reviews to analyze (sample of ${Math.min(300, allReviews.length)} reviews):
${reviewsText}

COMPETITIVE ANALYSIS REQUIREMENTS:
- Identify 25-35 SPECIFIC issue categories (like AppFollow, Sensor Tower)
- Each category must have 15-30 exact user quotes
- Focus on granular, actionable insights
- Group similar issues into specific categories
- Include frequency and severity analysis

SPECIFIC ISSUE CATEGORIES TO IDENTIFY:

CRITICAL ISSUES (1-2⭐):
1. App Crashes & Freezes
2. Login/Authentication Problems
3. Payment/Billing Issues
4. Data Loss/Sync Problems
5. Server/Connection Errors
6. Battery Drain Issues
7. Memory/CPU Performance
8. Security/Privacy Concerns
9. Installation/Update Problems
10. Compatibility Issues (iOS/Android version)
11. Account Management Issues
12. Broken Core Features
13. Corrupted Data/Database Issues
14. Timeout/Slow Response Issues
15. Error Messages & Bugs

EXPERIENCE ISSUES (3⭐):
16. User Interface (UI) Confusion
17. Navigation/Menus Problems
18. Search/Filter Issues
19. Loading Speed/Performance
20. Font/Text Readability
21. Button/Control Problems
22. Gesture/Touch Issues
23. Onboarding/Tutorial Problems
24. Settings/Configuration Issues
25. Notifications/Alerts Problems
26. Offline Mode Issues
27. Export/Import Problems

FEATURE REQUESTS (4-5⭐):
28. New Feature Requests
29. Integration/API Requests
30. Customization/Personalization
31. Social/Sharing Features
32. Analytics/Reporting Features
33. Accessibility Features
34. Automation/Workflow Features
35. Premium/Paid Feature Requests

Please provide analysis in the following JSON format:
{
  "criticalIssues": [
    {
      "title": "Specific issue category name",
      "frequency": number (how many times mentioned),
      "severity": "high" | "medium" | "low",
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20", "exact quote from review 21", "exact quote from review 22", "exact quote from review 23", "exact quote from review 24", "exact quote from review 25", "exact quote from review 26", "exact quote from review 27", "exact quote from review 28", "exact quote from review 29", "exact quote from review 30"],
      "affectedVersion": "version number if mentioned"
    }
  ],
  "experienceIssues": [
    {
      "title": "Specific UX/UI issue category",
      "frequency": number,
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20", "exact quote from review 21", "exact quote from review 22", "exact quote from review 23", "exact quote from review 24", "exact quote from review 25"]
    }
  ],
  "featureRequests": [
    {
      "title": "Specific feature request category",
      "frequency": number,
      "examples": ["exact quote from review 1", "exact quote from review 2", "exact quote from review 3", "exact quote from review 4", "exact quote from review 5", "exact quote from review 6", "exact quote from review 7", "exact quote from review 8", "exact quote from review 9", "exact quote from review 10", "exact quote from review 11", "exact quote from review 12", "exact quote from review 13", "exact quote from review 14", "exact quote from review 15", "exact quote from review 16", "exact quote from review 17", "exact quote from review 18", "exact quote from review 19", "exact quote from review 20", "exact quote from review 21", "exact quote from review 22", "exact quote from review 23", "exact quote from review 24", "exact quote from review 25"]
    }
  ],
  "sentiment": {
    "positive": 0-100,
    "negative": 0-100,
    "neutral": 0-100
  },
  "insights": "Comprehensive paragraph summarizing key findings across all categories with specific metrics and trends",
  "priorityActions": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4", "Specific action 5", "Specific action 6", "Specific action 7"]
}

ANALYSIS REQUIREMENTS:
- Create specific, granular categories (not generic groupings)
- Each category must have at least 10-15 real user quotes
- Include exact frequency counts
- Use professional, industry-standard terminology
- Match the detail level of AppFollow, Sensor Tower, App Annie
- Focus on actionable insights developers can use immediately

CRITICAL: Do not group all issues into 3-5 broad categories. Create 20-30 specific issue types, each with multiple examples.`;
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


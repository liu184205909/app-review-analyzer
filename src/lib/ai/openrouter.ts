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

  const reviewsText = allReviews.slice(0, 500).map(r =>
    `Rating: ${r.rating}⭐\nContent: ${r.content}`
  ).join('\n---\n');

  return `COMPREHENSIVE APP REVIEW ANALYSIS - INDUSTRY STANDARD

REVIEWS TO ANALYZE:
- Critical Issues (1-2⭐): ${criticalReviews.length} reviews
- Experience Issues (3⭐): ${experienceReviews.length} reviews
- Feature Requests (4-5⭐): ${positiveReviews.length} reviews
- Total: ${allReviews.length} reviews

${reviewsText}

ANALYZE AND CATEGORIZE ISSUES - EXPANDED CATEGORIES:

You MUST identify issues in ALL THREE categories below. Each category should have 12-15 specific examples with 8-12 user quotes each:

CRITICAL ISSUES (1-2⭐ reviews) - Find 12-15 critical issues from these expanded categories:
1. **CRASH & STABILITY**: App crashes/freezes/force closes/ANR errors
2. **AUTHENTICATION**: Login failures/sign-in problems/account access issues
3. **PAYMENT & BILLING**: Payment processing errors/subscription problems/billing failures
4. **DATA MANAGEMENT**: Data loss/sync failures/backup issues/missing data
5. **CONNECTIVITY**: Server timeouts/network errors/offline failures
6. **PERFORMANCE**: Battery drain/excessive memory usage/overheating
7. **INSTALLATION**: App installation/update failures/play store errors
8. **COMPATIBILITY**: Device compatibility/OS version issues/hardware problems
9. **ACCOUNT MANAGEMENT**: Profile creation/deletion/account verification problems
10. **SECURITY & PRIVACY**: Data breaches/privacy concerns/permission issues
11. **ERROR HANDLING**: Uncaught exceptions/error messages/glitches
12. **API & INTEGRATION**: Third-party service failures/API errors/webhook issues
13. **DATABASE**: Storage issues/corruption/migration failures
14. **CONTENT**: Missing content/corrupted files/media playback problems
15. **PLATFORM SPECIFIC**: Push notifications/background services/location services

EXPERIENCE ISSUES (3⭐ reviews) - Find 12-15 UX problems from these expanded categories:
1. **USER INTERFACE**: Layout problems/visual design inconsistency/cluttered screens
2. **NAVIGATION**: Menu confusion/poor information architecture/getting lost
3. **SEARCH & DISCOVERY**: Filter problems/search results not relevant/poor sorting
4. **RESPONSIVENESS**: Slow loading times/laggy interactions/performance issues
5. **INTERACTION DESIGN**: Button placement/gesture control/touch targets
6. **READABILITY**: Font sizes/contrast issues/color blindness/accessibility
7. **NOTIFICATIONS**: Too many/few notifications/poor timing/interruptions
8. **SETTINGS & CONFIGURATION**: Complex setup/confusing options/too many toggles
9. **OFFLINE EXPERIENCE**: Limited offline functionality/sync issues/airplane mode
10. **ONBOARDING**: Poor first experience/confusing tutorials/steep learning curve
11. **CONTENT ORGANIZATION**: Poor categorization/hard to find features/information hierarchy
12. **USER FEEDBACK**: No clear feedback on actions/loading states/confirmations
13. **MOBILE SPECIFIC**: Small screen issues/poor mobile optimization/device rotation
14. **LOCALIZATION**: Translation problems/cultural adaptation/time zone handling
15. **ACCESSIBILITY**: Screen reader issues/keyboard navigation/cognitive overload

FEATURE REQUESTS (4-5⭐ reviews) - Find 12-15 desired features from these expanded categories:
1. **CORE FUNCTIONALITY**: New primary features/enhanced existing capabilities
2. **INTEGRATIONS**: Third-party app connections/API support/webhooks
3. **CUSTOMIZATION**: Themes/personalization/layouts/custom workflows
4. **SOCIAL FEATURES**: Sharing/collaboration/community/social networking
5. **ANALYTICS & REPORTING**: Dashboards/data visualization/metrics tracking
6. **PRODUCTIVITY**: Automation/batch operations/time-saving features
7. **CONTENT CREATION**: Editing tools/creation capabilities/media management
8. **DATA MANAGEMENT**: Import/export/backup/sync/organization features
9. **ACCESSIBILITY**: Voice control/screen reader/high contrast/simplified UI
10. **MOBILE ENHANCEMENTS**: Mobile-specific features/tablet optimization
11. **COLLABORATION**: Real-time editing/team features/sharing capabilities
12. **SECURITY & PRIVACY**: Two-factor authentication/encryption/privacy controls
13. **PERFORMANCE**: Speed improvements/efficiency features/battery optimization
14. **PLATFORM INTEGRATION**: OS features integration/system services/native components
15. **AI & MACHINE LEARNING**: Smart suggestions/predictive features/automation

REQUIRED JSON FORMAT:
{
  "criticalIssues": [
    {"title": "specific issue", "frequency": number, "severity": "high|medium|low", "examples": ["quote 1", "quote 2", "quote 3", "quote 4", "quote 5", "quote 6", "quote 7", "quote 8", "quote 9", "quote 10", "quote 11", "quote 12"]}
  ],
  "experienceIssues": [
    {"title": "specific issue", "frequency": number, "examples": ["quote 1", "quote 2", "quote 3", "quote 4", "quote 5", "quote 6", "quote 7", "quote 8", "quote 9", "quote 10", "quote 11", "quote 12"]}
  ],
  "featureRequests": [
    {"title": "specific feature", "frequency": number, "examples": ["quote 1", "quote 2", "quote 3", "quote 4", "quote 5", "quote 6", "quote 7", "quote 8", "quote 9", "quote 10", "quote 11", "quote 12"]}
  ],
  "sentiment": {"positive": number, "negative": number, "neutral": number},
  "insights": "comprehensive summary",
  "priorityActions": ["action 1", "action 2", "action 3", "action 4"]
}

ANALYSIS GUIDELINES:
- Find 8-12 specific examples for each category (randomly vary the count between 8-12)
- For each example, include 8-12 actual user quotes (randomly vary count)
- Frequency should represent how many times this issue appears in reviews
- For severity in critical issues: use "high" for >10 mentions, "medium" for 5-10, "low" for 3-5
- Include ALL THREE categories even if some have fewer examples
- Focus on issues mentioned at least 3 times or more
- Use exact quotes from reviews when possible
- Vary the example count randomly (don't use exactly the same number every time)

IMPORTANT: Return ONLY the JSON object. No explanations or text outside JSON.`;
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


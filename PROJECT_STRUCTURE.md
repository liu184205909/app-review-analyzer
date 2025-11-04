# Project Structure

Complete overview of the App Review Analyzer MVP codebase.

## Directory Structure

```
app-review-analyzer/
├── prisma/
│   └── schema.prisma          # Database schema (PostgreSQL + Prisma)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts   # API: Single app analysis
│   │   ├── analysis/
│   │   │   └── [taskId]/
│   │   │       └── page.tsx   # Results page (dynamic route)
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   └── lib/
│       ├── ai/
│       │   └── openrouter.ts  # AI service (OpenRouter integration)
│       ├── scrapers/
│       │   ├── app-store.ts   # iOS App Store scraper
│       │   └── google-play.ts # Android Google Play scraper
│       ├── prisma.ts          # Prisma client singleton
│       └── utils.ts           # Utility functions
├── .gitignore                 # Git ignore rules
├── env.example                # Environment variables template
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.mjs         # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── QUICKSTART.md              # 5-minute setup guide
├── SETUP_GUIDE.md             # Detailed setup instructions
├── README.md                  # Project documentation
└── PROJECT_STRUCTURE.md       # This file
```

## Core Files Explained

### Database (`prisma/schema.prisma`)

Defines the data model:
- **App**: Stores app metadata (iOS/Android)
- **Review**: Stores individual reviews
- **AnalysisTask**: Tracks analysis jobs
- **TaskApp**: Links tasks to apps (for comparisons)
- **AIModel**: Configurable AI models (future)

**Key Features:**
- Dual platform support (enum Platform)
- Unique constraints per platform
- JSON fields for flexible data storage

### API Routes (`src/app/api/`)

#### `analyze/route.ts`
- **POST**: Start new analysis
- **GET**: Get analysis status/result
- Handles both iOS and Android apps
- Processes reviews in background
- Uses OpenRouter for AI analysis

**Flow:**
1. Extract app ID from URL
2. Create analysis task
3. Fetch app info + reviews
4. Store in database
5. Send to AI for analysis
6. Save results

### Pages (`src/app/`)

#### `page.tsx` (Home)
- Main landing page
- Platform selection (iOS/Android)
- Analysis mode (Single/Comparison)
- App URL input
- Competitor URL inputs (comparison mode)
- "Focus on negative reviews" option

#### `analysis/[taskId]/page.tsx` (Results)
- Dynamic route for analysis results
- Real-time progress polling
- Displays:
  - Sentiment distribution
  - Critical issues
  - Experience problems
  - Feature requests
  - Key insights
  - Recommended actions

### Services (`src/lib/`)

#### `ai/openrouter.ts`
OpenRouter AI integration:
- `analyzeSingleApp()`: Analyze one app's reviews
- `compareApps()`: Compare multiple apps (SWOT)
- Prompt engineering for quality insights
- JSON-structured responses

**Models Supported:**
- Claude 3.5 Sonnet (best quality)
- GPT-4o (fast)
- DeepSeek V3 (cost-effective)
- GLM-4 (Chinese reviews)

#### `scrapers/app-store.ts`
iOS App Store scraper:
- Uses official RSS Feed API
- `fetchAppStoreReviews()`: Get reviews
- `fetchAppStoreApp()`: Get app metadata
- `extractAppStoreId()`: Parse URLs
- Multi-page support (up to 500 reviews)

**URL Formats Supported:**
```
https://apps.apple.com/us/app/name/id123456789
https://apps.apple.com/app/id123456789
123456789 (direct ID)
```

#### `scrapers/google-play.ts`
Android Google Play scraper:
- Uses `google-play-scraper` npm package
- `fetchGooglePlayReviews()`: Get reviews
- `fetchGooglePlayApp()`: Get app metadata
- `extractGooglePlayId()`: Parse URLs
- Up to 500 reviews per call

**URL Formats Supported:**
```
https://play.google.com/store/apps/details?id=com.example.app
com.example.app (direct package name)
```

#### `prisma.ts`
Prisma client singleton:
- Prevents multiple instances in development
- Adds query logging in dev mode
- Production-ready

#### `utils.ts`
Helper functions:
- `cn()`: Merge Tailwind classes
- `formatNumber()`: Format numbers
- `truncate()`: Truncate text
- `percentage()`: Calculate percentages
- `timeAgo()`: Relative time formatting

## Configuration Files

### `package.json`
Key dependencies:
- **next**: Framework (v14+)
- **@prisma/client**: Database ORM
- **openai**: OpenRouter client (OpenAI SDK compatible)
- **google-play-scraper**: Android review scraper
- **franc-min**: Language detection
- **recharts**: Charts (future)
- **lucide-react**: Icons

### `tailwind.config.ts`
- Custom color palette
- Extended theme
- Content paths

### `next.config.js`
- Image optimization domains
- Server actions configuration
- React strict mode

### `tsconfig.json`
- Path aliases (`@/*` → `src/*`)
- Strict type checking
- Next.js plugin

## Data Flow

### Analysis Flow (Single App)

```
1. User submits URL
   ↓
2. POST /api/analyze
   ↓
3. Extract app ID
   ↓
4. Create task (status: pending)
   ↓
5. Background processing:
   - Fetch app info
   - Fetch reviews (500 max)
   - Save to database
   - Filter reviews (1-3⭐ if requested)
   - Send to OpenRouter AI
   - Parse AI response
   ↓
6. Save result (status: completed)
   ↓
7. User views results at /analysis/[taskId]
```

### AI Analysis Flow

```
Reviews (JSON)
   ↓
Build Prompt with Context
   ↓
OpenRouter API
   ↓
Claude 3.5 Sonnet / GPT-4 / DeepSeek
   ↓
Structured JSON Response:
   - Critical issues
   - Experience issues
   - Feature requests
   - Sentiment
   - Insights
   - Priority actions
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENROUTER_API_KEY`: OpenRouter API key

Optional:
- `REDIS_URL`: For caching (future)
- `DEFAULT_MODEL_FREE`: Free tier AI model
- `DEFAULT_MODEL_PRO`: Paid tier AI model

## Deployment Checklist

- [ ] Set up production database (Supabase/Vercel Postgres)
- [ ] Add environment variables to hosting platform
- [ ] Run `prisma generate` before build
- [ ] Configure domains for `next/image`
- [ ] Set up monitoring (optional)
- [ ] Enable analytics (optional)

## Development Workflow

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push

# Start dev server
npm run dev

# View database
npx prisma studio

# Build for production
npm run build

# Start production server
npm start
```

## Testing

### Manual Testing

1. **Test iOS App:**
   - URL: `https://apps.apple.com/us/app/instagram/id389801252`
   - Expected: ~500 reviews, AI analysis in 2-3 minutes

2. **Test Android App:**
   - URL: `https://play.google.com/store/apps/details?id=com.instagram.android`
   - Expected: ~500 reviews, AI analysis in 2-3 minutes

3. **Test Negative Reviews Filter:**
   - Check box "Focus on negative reviews"
   - Expected: Only 1-3⭐ reviews analyzed

4. **Test Error Handling:**
   - Invalid URL → Error message
   - Non-existent app → Error message
   - Invalid platform → Error message

## Future Enhancements

### Phase 2 (Planned)
- [ ] User authentication (NextAuth.js)
- [ ] Competitor comparison API endpoint
- [ ] Analysis history page
- [ ] Export reports (PDF/CSV)
- [ ] Email notifications

### Phase 3 (Future)
- [ ] Multi-language UI (next-intl)
- [ ] Real-time analysis progress (WebSocket)
- [ ] Admin dashboard for AI model config
- [ ] API access for enterprise users
- [ ] Team collaboration features

## Performance Optimization

Current optimizations:
- Database indexing on frequently queried fields
- Prisma connection pooling
- Static page generation where possible

Future optimizations:
- Redis caching for analysis results
- Background job queue (Bull/BullMQ)
- Rate limiting middleware
- CDN for static assets

## Security Considerations

Current:
- Environment variables for secrets
- SQL injection prevention (Prisma)
- Input validation

Future:
- Rate limiting per IP
- User authentication
- CORS configuration
- API key management

## Monitoring & Logging

Development:
- Console logging
- Prisma query logging

Production (recommended):
- Error tracking (Sentry)
- Analytics (Vercel Analytics)
- Performance monitoring (Vercel Speed Insights)
- Database monitoring (Prisma Pulse)

---

## Quick Reference

**Start Development:**
```bash
npm run dev
```

**Access Points:**
- Home: http://localhost:3000
- API: http://localhost:3000/api/analyze
- Database: `npx prisma studio`

**Key Directories:**
- Pages: `src/app/`
- API: `src/app/api/`
- Services: `src/lib/`
- Database: `prisma/`

**Documentation:**
- Quick Start: [QUICKSTART.md](./QUICKSTART.md)
- Setup Guide: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- Main README: [README.md](./README.md)

---

Last Updated: 2025-11-03
Version: MVP 1.0


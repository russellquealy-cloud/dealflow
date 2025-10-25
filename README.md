# Off Axis Deals - Real Estate Investment Platform

A comprehensive platform for real estate investors and wholesalers to discover, analyze, and connect on investment opportunities.

## 🚀 Features

- **Property Listings**: Browse and search investment properties with advanced filtering
- **Interactive Maps**: Google Maps integration with clustering and spatial search
- **AI Property Analysis**: Automated ARV, repair estimates, and MAO calculations
- **Buyer Matching**: Connect with qualified investors and wholesalers
- **Subscription Management**: Tiered plans with Stripe integration
- **Notifications**: Email and push notifications for important updates
- **Mobile App**: React Native/Expo wrapper for iOS and Android

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Maps**: Google Maps API with clustering
- **Payments**: Stripe for subscriptions
- **AI**: OpenAI/Anthropic for property analysis
- **Notifications**: Resend/Postmark for email
- **Mobile**: React Native/Expo
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Maps API key
- Stripe account (for payments)
- Email service account (Resend/Postmark)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-org/dealflow.git
cd dealflow
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your values
# See env.example for all required variables
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:setup

# This will:
# - Create all required tables
# - Set up RLS policies
# - Seed sample data
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests

# Database
npm run db:reset         # Reset database
npm run db:seed          # Seed database
npm run db:setup         # Reset and seed database

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Project Structure

```
dealflow/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   ├── supabase/          # Supabase configuration
│   └── [pages]/           # App router pages
├── docs/                  # Documentation
├── scripts/               # Database scripts
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── mobile/                # React Native app
└── types/                 # TypeScript types
```

## 🗄️ Database Schema

### Core Tables

- **listings**: Property listings with location data
- **profiles**: User profiles (investors/wholesalers)
- **subscriptions**: User subscription data
- **buyers**: Buyer database for matching
- **contact_logs**: Track contact actions
- **ai_analysis_logs**: AI analysis results

### Key Features

- **Row Level Security (RLS)**: Secure data access
- **Spatial Queries**: Location-based search
- **Real-time Updates**: Live data synchronization
- **Backup & Recovery**: Automated backups

## 🔐 Authentication & Authorization

### User Types

- **Investors**: Browse properties, contact sellers
- **Wholesalers**: Create listings, find buyers
- **Admins**: Manage platform, moderate content

### Subscription Tiers

- **Free**: View listings, basic features
- **Pro**: Create listings, AI analysis, unlimited contacts
- **Enterprise**: Team features, API access, priority support

## 🤖 AI Features

### Property Analysis

- **ARV Calculation**: After Repair Value estimation
- **Repair Estimates**: Cost breakdown by category
- **MAO Calculation**: Maximum Allowable Offer
- **Comparable Sales**: Recent market data
- **Confidence Scoring**: Analysis reliability

### Implementation

```typescript
// Example AI analysis
const analysis = await analyzeProperty(userId, listingId, {
  address: '123 Main St',
  beds: 3,
  baths: 2,
  sqft: 1500,
  propertyType: 'single_family'
});

console.log(analysis.arv.median); // $325,000
console.log(analysis.mao.recommended); // $275,000
```

## 📱 Mobile App

### React Native/Expo Setup

```bash
cd mobile
npm install
npx expo start
```

### Features

- **Cross-platform**: iOS and Android
- **Push Notifications**: Real-time updates
- **Offline Support**: Cached data
- **Deep Linking**: Direct property links

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Add all required variables in Vercel dashboard
   - Set up Stripe webhooks
   - Configure email service

3. **Database Setup**
   ```bash
   # Run migrations in production
   npm run db:setup
   ```

### Mobile App Deployment

1. **iOS App Store**
   ```bash
   cd mobile
   eas build --platform ios
   eas submit --platform ios
   ```

2. **Google Play Store**
   ```bash
   cd mobile
   eas build --platform android
   eas submit --platform android
   ```

## 📊 Monitoring

### Key Metrics

- **Performance**: Page load times, API response times
- **Business**: User registrations, subscription conversions
- **Technical**: Error rates, uptime, database performance

### Monitoring Tools

- **Vercel Analytics**: Performance monitoring
- **Supabase Dashboard**: Database monitoring
- **Stripe Dashboard**: Payment monitoring
- **Custom Alerts**: Error tracking and notifications

## 🔧 Configuration

### Environment Variables

See `env.example` for all required variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# AI Service
OPENAI_API_KEY=your-openai-key
# OR
ANTHROPIC_API_KEY=your-anthropic-key

# Email
RESEND_API_KEY=your-resend-key
# OR
POSTMARK_API_TOKEN=your-postmark-token
```

### Feature Flags

```bash
# Enable/disable features
AI_ANALYZER_ENABLED=true
PUSH_WEB_ENABLED=true
PUSH_MOBILE_ENABLED=true
SUBSCRIPTIONS_ENABLED=true
BUYER_MATCHING_ENABLED=true
```

## 📚 Documentation

- [Launch Readiness](./docs/launch-readiness.md)
- [Task Board](./docs/tasks.md)
- [Release Checklist](./docs/release-checklist.md)
- [Rollback Plan](./docs/rollback-plan.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: customerservice@offaxisdeals.com

---

**Off Axis Deals** - Connecting real estate investors with opportunities.

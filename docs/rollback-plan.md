# Deal Flow Rollback Plan

## Overview

This document outlines the procedures for rolling back the Deal Flow application in case of critical issues during or after deployment.

## Rollback Scenarios

### 1. Critical Application Errors
**Symptoms**: Application crashes, 500 errors, white screen
**Impact**: High - Users cannot access the application
**Response Time**: Immediate (0-5 minutes)

### 2. Database Issues
**Symptoms**: Database connection failures, data corruption, RLS policy issues
**Impact**: Critical - Data integrity at risk
**Response Time**: Immediate (0-5 minutes)

### 3. Payment Processing Failures
**Symptoms**: Stripe webhook failures, subscription issues, payment errors
**Impact**: Critical - Revenue at risk
**Response Time**: Immediate (0-5 minutes)

### 4. Performance Degradation
**Symptoms**: Slow page loads, API timeouts, high error rates
**Impact**: Medium - User experience degraded
**Response Time**: 15-30 minutes

### 5. Security Vulnerabilities
**Symptoms**: Unauthorized access, data breaches, security alerts
**Impact**: Critical - Security at risk
**Response Time**: Immediate (0-5 minutes)

## Rollback Procedures

### Phase 1: Immediate Response (0-5 minutes)

#### 1.1 Alert Team
```bash
# Send immediate alert to team
curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"text":"🚨 CRITICAL: Deal Flow rollback initiated. Check monitoring dashboard."}'
```

#### 1.2 Assess Situation
- [ ] Check error monitoring dashboard
- [ ] Identify scope of issue (all users vs. subset)
- [ ] Determine if hotfix is possible
- [ ] Check database connectivity
- [ ] Verify external service status

#### 1.3 Quick Fix Attempt
```bash
# Try to deploy hotfix if possible
git checkout main
git pull origin main
# Apply hotfix
git commit -m "hotfix: [description]"
git push origin main
```

### Phase 2: Rollback Decision (5-15 minutes)

#### 2.1 Decision Criteria
Rollback if ANY of the following:
- Error rate > 5%
- Payment processing completely down
- Database unreachable
- Security vulnerability confirmed
- User data corruption detected
- Performance degraded > 50%

#### 2.2 Initiate Rollback
```bash
# 1. Revert to previous stable version
git checkout [previous-stable-commit]
git push origin main --force

# 2. If database rollback needed
# Restore from backup (see Database Rollback section)

# 3. Clear CDN cache
# Vercel: Automatic
# Cloudflare: Manual purge if needed
```

### Phase 3: Database Rollback (if needed)

#### 3.1 Supabase Database Rollback
```sql
-- 1. Check current state
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- 2. If needed, restore from backup
-- This requires Supabase support or manual intervention
-- Contact: support@supabase.com
```

#### 3.2 Data Integrity Check
```sql
-- Check critical tables
SELECT COUNT(*) FROM listings;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM subscriptions;
SELECT COUNT(*) FROM contact_logs;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Phase 4: Post-Rollback Verification (15-30 minutes)

#### 4.1 System Health Check
```bash
# Check application status
curl -f https://offaxisdeals.com/api/health || echo "Health check failed"

# Check database connectivity
curl -f https://offaxisdeals.com/api/test-db-connection || echo "DB check failed"

# Check external services
curl -f https://offaxisdeals.com/api/stripe/health || echo "Stripe check failed"
```

#### 4.2 User-Facing Verification
- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Listings display correctly
- [ ] Map functionality works
- [ ] Search and filters work
- [ ] Subscription flow works (test mode)

#### 4.3 Payment System Verification
```bash
# Test Stripe webhook endpoint
curl -X POST https://offaxisdeals.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"object": {"id": "test"}}}'
```

### Phase 5: Communication and Monitoring (30+ minutes)

#### 5.1 Internal Communication
```bash
# Update team on rollback status
curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"text":"✅ Rollback completed. System stable. Monitoring ongoing."}'
```

#### 5.2 User Communication (if needed)
```html
<!-- Status page update -->
<div class="alert alert-warning">
  <h3>System Maintenance</h3>
  <p>We're currently experiencing technical issues and have rolled back to a stable version. 
  All core functionality is working. We apologize for any inconvenience.</p>
  <p>Last updated: [timestamp]</p>
</div>
```

#### 5.3 Monitoring Setup
- [ ] Set up enhanced monitoring
- [ ] Configure alerts for critical metrics
- [ ] Monitor error rates closely
- [ ] Watch payment processing
- [ ] Monitor user activity

## Rollback Automation

### Automated Rollback Triggers
```yaml
# GitHub Actions workflow for auto-rollback
name: Auto Rollback
on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]

jobs:
  rollback:
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    runs-on: ubuntu-latest
    steps:
      - name: Check error rates
        run: |
          ERROR_RATE=$(curl -s https://api.monitoring.com/error-rate)
          if [ $ERROR_RATE -gt 5 ]; then
            echo "rollback=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Execute rollback
        if: steps.check.outputs.rollback == 'true'
        run: |
          git checkout [previous-stable-commit]
          git push origin main --force
```

### Monitoring Alerts
```javascript
// Example monitoring alert configuration
const alerts = {
  errorRate: {
    threshold: 5,
    duration: '5m',
    action: 'rollback'
  },
  responseTime: {
    threshold: 2000,
    duration: '10m',
    action: 'investigate'
  },
  paymentFailures: {
    threshold: 1,
    duration: '1m',
    action: 'rollback'
  }
};
```

## Recovery Procedures

### 1. Fix and Redeploy
```bash
# 1. Identify and fix the issue
git checkout main
# Make necessary fixes
git commit -m "fix: [description]"
git push origin main

# 2. Monitor deployment
# Watch for successful deployment
# Verify all tests pass
# Check error rates
```

### 2. Gradual Rollout
```bash
# 1. Deploy to staging first
git checkout staging
git merge main
git push origin staging

# 2. Test thoroughly on staging
# 3. Deploy to production with feature flags
# 4. Gradually enable features
```

### 3. Database Recovery
```sql
-- If data corruption occurred
-- 1. Restore from backup
-- 2. Replay transactions if possible
-- 3. Verify data integrity
-- 4. Update application if needed
```

## Prevention Measures

### 1. Pre-Deployment Checks
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Database migration tested
- [ ] External service integration tested

### 2. Deployment Strategy
- [ ] Blue-green deployment
- [ ] Canary releases
- [ ] Feature flags
- [ ] Database migration strategy
- [ ] Rollback testing

### 3. Monitoring and Alerting
- [ ] Real-time error monitoring
- [ ] Performance monitoring
- [ ] Business metrics monitoring
- [ ] External service monitoring
- [ ] Automated rollback triggers

## Contact Information

### Emergency Contacts
- **Lead Developer**: [Name] - [Phone] - [Email]
- **DevOps Engineer**: [Name] - [Phone] - [Email]
- **Database Admin**: [Name] - [Phone] - [Email]
- **Product Manager**: [Name] - [Phone] - [Email]

### External Service Contacts
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com
- **Stripe Support**: support@stripe.com
- **Email Provider**: [Contact Info]

### Escalation Path
1. **Level 1**: Development Team (0-15 minutes)
2. **Level 2**: DevOps + Database Admin (15-30 minutes)
3. **Level 3**: CTO + External Support (30+ minutes)

## Post-Rollback Analysis

### 1. Root Cause Analysis
- [ ] Identify what caused the issue
- [ ] Document the timeline
- [ ] Analyze monitoring data
- [ ] Review deployment logs
- [ ] Interview team members

### 2. Process Improvements
- [ ] Update deployment procedures
- [ ] Improve monitoring
- [ ] Enhance testing
- [ ] Update rollback procedures
- [ ] Train team on new procedures

### 3. Documentation Updates
- [ ] Update this rollback plan
- [ ] Update deployment procedures
- [ ] Update monitoring procedures
- [ ] Update team contact information
- [ ] Update external service contacts

---

*Last Updated: [Date]*
*Next Review: [Date]*
*Version: 1.0*

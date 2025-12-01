#!/usr/bin/env python3
"""
Update off_axis_deals_master_tasks.csv:
1. Add test instructions to all tasks missing them
2. Append new tasks for future development from comprehensive roadmap
"""

import csv
import sys
from datetime import datetime
from pathlib import Path

# Get the project root
project_root = Path(__file__).parent.parent
csv_path = project_root / "docs" / "off_axis_deals_master_tasks.csv"
output_path = csv_path

def escape_csv_value(value):
    """Escape a CSV value if it contains commas, quotes, or newlines"""
    if not value:
        return ""
    if any(c in value for c in [',', '"', '\n']):
        return '"' + value.replace('"', '""') + '"'
    return value

def add_test_instructions(row):
    """Add appropriate test instructions to a row if missing"""
    task_id = row[0]
    description = row[3]
    status = row[5]
    test_instructions = row[9]
    
    # If test instructions already exist, return as-is
    if test_instructions and test_instructions.strip():
        return row
    
    # Generate test instructions based on task description and status
    if "multi-image upload" in description.lower():
        test_instructions = """1) Login as wholesaler.
2) Navigate to Post a Deal page.
3) Upload multiple images (3-5 photos).
4) Verify all images upload successfully and appear in preview.
5) Submit listing and verify all images are saved.
6) View listing detail page and verify all images display in carousel."""
    
    elif "Alerts Admin" in description:
        test_instructions = """1) Login as admin user.
2) Navigate to /admin/alerts page.
3) Verify alerts list loads without errors.
4) Test real-time subscription updates by creating/modifying alerts from another session.
5) Verify error handling when alerts service is unavailable."""
    
    elif "Watchlist Admin" in description:
        test_instructions = """1) Login as admin user.
2) Navigate to /admin/watchlists page.
3) Verify watchlist data loads correctly.
4) Test filtering and sorting functionality.
5) Verify error handling for deleted/unavailable listings."""
    
    elif "Analytics Dashboard" in description and "Admin" in description:
        test_instructions = """1) Login as admin user.
2) Navigate to /admin/analytics.
3) Verify dashboard loads with all metrics displaying correctly.
4) Test date range filters and verify charts update.
5) Verify data accuracy and no NaN/undefined values.
6) Test export functionality if available."""
    
    elif "Stripe webhooks" in description.lower():
        test_instructions = """1) Use Stripe CLI to forward webhooks to local environment.
2) Trigger test events: subscription.created, subscription.updated, subscription.deleted, payment_succeeded.
3) Verify webhook handlers process events correctly.
4) Verify idempotency - duplicate events are handled gracefully.
5) Check database to ensure subscription status updates correctly.
6) Test in production with real Stripe events."""
    
    elif "map rendering" in description.lower():
        test_instructions = """1) Navigate to listings page.
2) Verify map renders without flicker or errors.
3) Test marker clustering with multiple listings.
4) Verify polygon drawing works and persists correctly.
5) Check browser console for AdvancedMarkerElement deprecation warnings.
6) Test on mobile and desktop browsers."""
    
    elif "CRM Export" in description:
        test_instructions = """1) Login as admin.
2) Navigate to CRM Export page.
3) Verify export functionality is implemented (not 'Coming Soon').
4) Test CSV export with various filters.
5) Verify exported data matches database records."""
    
    elif "Repair Estimator" in description:
        test_instructions = """1) Navigate to repair estimator tool (if route exists).
2) Input property details and verify estimator logic runs.
3) Verify results display correctly.
4) Test with different property types and conditions."""
    
    elif "AI Usage Reporting" in description:
        test_instructions = """1) Login as admin.
2) Navigate to AI usage reporting page.
3) Verify usage metrics display correctly for all users.
4) Test filtering by user, date range, feature type.
5) Verify quota tracking matches actual usage."""
    
    elif "production env vars" in description.lower():
        test_instructions = """1) Review all environment variables required for production.
2) Verify all required vars are set in Vercel production environment.
3) Check that sensitive keys (API keys, secrets) are properly secured.
4) Test application startup with all env vars configured.
5) Verify no missing or undefined env var errors in production logs."""
    
    elif "image carousel" in description.lower():
        test_instructions = """1) Navigate to a listing with multiple images.
2) Verify carousel displays all images correctly.
3) Test navigation (next/previous arrows, dots).
4) Verify smooth transitions and animations.
5) Test on mobile and desktop."""
    
    elif "pagination" in description.lower() or "infinite scroll" in description.lower():
        test_instructions = """1) Navigate to listings page with many results.
2) Verify pagination or infinite scroll works correctly.
3) Test page navigation (if pagination) or scroll loading (if infinite scroll).
4) Verify URL parameters update correctly.
5) Test with filters applied."""
    
    elif "PDF output" in description.lower():
        test_instructions = """1) Generate an AI analysis report.
2) Verify PDF download button/link is available.
3) Click download and verify PDF generates correctly.
4) Verify PDF contains all expected content.
5) Test PDF opens correctly in various PDF viewers."""
    
    elif "national trend scraping" in description.lower():
        test_instructions = """1) Verify scraping jobs are scheduled and running.
2) Check database for scraped trend data.
3) Verify data appears in analytics dashboard.
4) Test data freshness and update frequency."""
    
    elif "RecData" in description:
        test_instructions = """1) Verify RecData integration is configured.
2) Test sold comps data retrieval.
3) Verify data displays in listing detail pages.
4) Check data accuracy and completeness."""
    
    elif "lead notes" in description.lower():
        test_instructions = """1) Navigate to CRM/leads section.
2) Select a lead.
3) Verify notes field/section is available.
4) Add, edit, and delete notes.
5) Verify notes persist and display correctly."""
    
    elif "homepage design" in description.lower():
        test_instructions = """1) Navigate to homepage.
2) Verify new design matches Redfin/Zillow quality standards.
3) Test responsive design on mobile, tablet, desktop.
4) Verify value proposition is clear and compelling.
5) Test all CTAs and navigation elements."""
    
    elif "testimonials" in description.lower() or "trust badges" in description.lower():
        test_instructions = """1) Navigate to homepage.
2) Verify testimonials section displays correctly.
3) Verify trust badges/logos are visible.
4) Test on mobile and desktop.
5) Verify testimonials rotate or display appropriately."""
    
    elif "loading skeletons" in description.lower():
        test_instructions = """1) Navigate to listings page.
2) Trigger slow network (throttle in dev tools).
3) Verify skeleton loaders display during data fetch.
4) Verify skeletons match final content layout.
5) Test on multiple pages that load data."""
    
    elif "wholesaler/investor flows" in description.lower():
        test_instructions = """1) Test new user signup flow for wholesaler.
2) Test new user signup flow for investor.
3) Verify onboarding steps guide users appropriately.
4) Test flow completion and profile setup."""
    
    elif "landing page lead capture" in description.lower():
        test_instructions = """1) Visit landing page as anonymous user.
2) Verify lead capture form is prominent and clear.
3) Submit test lead information.
4) Verify lead is saved to database.
5) Test email notification is sent (if applicable)."""
    
    elif "DB indexing" in description:
        test_instructions = """1) Review database schema and identify slow queries.
2) Create indexes on frequently queried columns.
3) Test query performance before and after indexing.
4) Verify no negative impact on write performance.
5) Monitor query execution times in production."""
    
    elif "rate limits" in description.lower():
        test_instructions = """1) Identify public API endpoints.
2) Implement rate limiting middleware.
3) Test rate limit enforcement by making excessive requests.
4) Verify appropriate error responses (429 Too Many Requests).
5) Test rate limit reset and recovery."""
    
    elif "sign-in loops" in description.lower():
        test_instructions = """1) Test sign-in flow across all pages.
2) Verify no redirect loops occur.
3) Test session persistence after login.
4) Verify cookies are set correctly.
5) Test on different browsers and devices."""
    
    elif "mobile responsiveness" in description.lower():
        test_instructions = """1) Test all pages on mobile devices (iPhone, Android).
2) Verify layouts adapt correctly to small screens.
3) Test touch interactions and gestures.
4) Verify navigation works on mobile.
5) Test on tablet sizes as well."""
    
    elif "session persistence" in description.lower():
        test_instructions = """1) Login and verify session is established.
2) Refresh page and verify user remains logged in.
3) Close browser and reopen - verify session persists.
4) Test session expiration and renewal.
5) Test on mobile web and native app."""
    
    elif "Owner-only edit/delete" in description:
        test_instructions = """1) Login as listing owner.
2) Verify edit/delete buttons are visible on own listings.
3) Login as different user.
4) Verify edit/delete buttons are NOT visible on other users' listings.
5) Attempt direct API access to edit/delete other user's listing - verify 403 error."""
    
    elif "watchlist errors" in description.lower():
        test_instructions = """1) Add listings to watchlist.
2) Delete a listing that's in watchlist.
3) Verify watchlist handles deleted listings gracefully.
4) Test error messages are user-friendly.
5) Verify watchlist still functions correctly."""
    
    elif "CSV/API Export" in description:
        test_instructions = """1) Navigate to export page/endpoint.
2) Select data filters.
3) Initiate CSV export.
4) Verify CSV downloads correctly.
5) Verify CSV contains expected data and format.
6) Test API export endpoint returns JSON correctly."""
    
    elif "Export Reports" in description:
        test_instructions = """1) Login as admin.
2) Navigate to reports export page.
3) Select report type and date range.
4) Generate and download report.
5) Verify report contains correct data."""
    
    elif "AI Analyzer errors" in description.lower():
        test_instructions = """1) Test AI analyzer with valid inputs.
2) Test with invalid/edge case inputs.
3) Verify error messages are clear and helpful.
4) Test quota limits and verify appropriate messaging.
5) Test when AI service is unavailable."""
    
    elif "error logging" in description.lower():
        test_instructions = """1) Trigger various errors (network, validation, server).
2) Verify errors are logged to Sentry/LogRocket.
3) Verify error details include useful context.
4) Test error alerting (if configured).
5) Verify production logs are accessible."""
    
    elif "mobile-first search" in description.lower():
        test_instructions = """1) Test search on mobile device.
2) Verify search bar is easily accessible.
3) Test autocomplete and suggestions.
4) Verify filters work well on mobile.
5) Test search results display correctly."""
    
    elif "line-item output" in description.lower():
        test_instructions = """1) Generate repair estimate.
2) Verify line items display in UI.
3) Verify itemized breakdown is clear.
4) Test export of line items.
5) Verify calculations are correct."""
    
    elif "message notifications" in description.lower():
        test_instructions = """1) Send a message to a user.
2) Verify recipient receives notification.
3) Test notification delivery methods (in-app, email).
4) Verify notification preferences are respected.
5) Test notification dismissal and marking as read."""
    
    else:
        # Default test instructions
        test_instructions = f"""1) Navigate to relevant page/route: {row[2]}.
2) Verify feature/functionality works as described: {description[:100]}.
3) Test with various inputs and edge cases.
4) Verify error handling is appropriate.
5) Test on mobile and desktop if applicable."""
    
    row[9] = test_instructions
    return row

def main():
    # Read existing CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
    
    if not rows:
        print("Error: CSV file is empty or couldn't be read")
        sys.exit(1)
    
    header = rows[0]
    data_rows = rows[1:]
    
    # Update existing rows with test instructions
    updated_rows = [header]
    next_id = len(data_rows) + 1
    
    for row in data_rows:
        # Ensure row has correct number of columns
        while len(row) < len(header):
            row.append("")
        updated_row = add_test_instructions(row)
        updated_rows.append(updated_row)
        # Track highest task ID
        if row[0].startswith("TASK-"):
            try:
                task_num = int(row[0].replace("TASK-", ""))
                if task_num >= next_id:
                    next_id = task_num + 1
            except:
                pass
    
    # Append new tasks from roadmap
    today = datetime.now().strftime("%m/%d/%Y")
    
    new_tasks = [
        # SECTION 1 - Redfin/Zillow-level UI & UX
        # UI/UX Foundations
        ["TASK-065", "UI/UX - Foundations", "/design-system", "Define Redfin/Zillow-style design system for Off Axis (spacing, font sizes, weights, colors, shadows, card radius)", "High", "Planned", "", "Both", today, "1) Review Redfin and Zillow design systems. 2) Create design system documentation with spacing, typography, color, shadow, and radius tokens. 3) Apply design system to existing components. 4) Verify consistency across all pages.", "Design system should feel polished and trustworthy like Redfin/Zillow while maintaining Off Axis brand colors."],
        ["TASK-066", "UI/UX - Foundations", "/global-styles", "Standardize global typography scale and spacing tokens across web app", "High", "Planned", "", "Both", today, "1) Define typography scale (headings, body, captions). 2) Define spacing scale (4px, 8px, 12px, 16px, etc.). 3) Update all components to use standardized tokens. 4) Verify visual consistency.", "Typography and spacing should be consistent throughout the application."],
        ["TASK-067", "UI/UX - Foundations", "/components", "Implement reusable card components with rounded corners and subtle shadows for listings, saved searches, tools, and modals", "High", "Planned", "", "Both", today, "1) Create base Card component with consistent styling. 2) Apply to listing cards, saved search cards, tool cards, modals. 3) Verify shadow and border radius are consistent. 4) Test on different backgrounds.", "Cards should feel premium and polished like Redfin/Zillow."],
        ["TASK-068", "UI/UX - Foundations", "/audit", "Audit current pages for inconsistent spacing/fonts/shadows and create a cleanup plan", "Medium", "Planned", "", "Both", today, "1) Review all pages and document inconsistencies. 2) Create prioritized cleanup plan. 3) Apply fixes systematically. 4) Verify improvements.", "Foundation for consistent UI/UX improvements."],
        # Top Bar & Search
        ["TASK-069", "UI/UX - Top Bar", "/listings", "Design top bar layout modeled after Redfin/Zillow: search box, filters button, Save Search button", "High", "Planned", "", "Both", today, "1) Design top bar layout with search, filters, save search. 2) Implement responsive layout. 3) Verify search functionality works correctly. 4) Test filters and save search buttons.", "Top bar should be intuitive and prominent like Redfin/Zillow."],
        ["TASK-070", "UI/UX - Top Bar", "/listings", "Implement responsive top bar on desktop and mobile with correct behavior", "High", "Planned", "", "Both", today, "1) Test top bar on desktop - verify layout and functionality. 2) Test on mobile - verify responsive behavior. 3) Verify search box is easily accessible on mobile. 4) Test filters and save search on mobile.", "Top bar must work seamlessly on all devices."],
        ["TASK-071", "UI/UX - Top Bar", "/listings /api/saved-searches", "Wire Save Search button to existing or planned saved search backend", "Medium", "Planned", "", "Both", today, "1) Verify saved search backend API exists. 2) Connect Save Search button to API. 3) Test saving search criteria. 4) Verify saved searches load correctly.", "Save Search should persist user's search criteria."],
        ["TASK-072", "UI/UX - Top Bar", "/listings", "Ensure fast type-ahead search behavior (no jank, minimal latency)", "High", "Planned", "", "Both", today, "1) Test search with rapid typing. 2) Verify no lag or jank. 3) Test debouncing is appropriate. 4) Verify autocomplete suggestions load quickly.", "Search should feel instant and responsive."],
        # Map Experience
        ["TASK-073", "UI/UX - Map", "/listings", "Implement full-bleed map layout on desktop and mobile (map filling most of the screen)", "High", "Planned", "", "Both", today, "1) Design full-bleed map layout. 2) Implement on desktop. 3) Implement on mobile. 4) Verify map takes up appropriate screen space. 5) Test with list view toggle.", "Map should be prominent like Redfin/Zillow."],
        ["TASK-074", "UI/UX - Map", "/listings", "Implement map marker clustering and responsive markers", "High", "Planned", "", "Both", today, "1) Implement marker clustering when many listings are visible. 2) Test clustering at different zoom levels. 3) Verify marker sizes adapt to screen size. 4) Test marker interaction (click, hover).", "Clustering improves performance and UX with many listings."],
        ["TASK-075", "UI/UX - Map", "/listings", "Add Search this area auto-trigger when the map viewport changes", "Medium", "Planned", "", "Both", today, "1) Detect map viewport changes. 2) Auto-trigger search for listings in viewport. 3) Verify debouncing prevents excessive API calls. 4) Test on desktop and mobile.", "Auto-search improves discovery experience."],
        ["TASK-076", "UI/UX - Map", "/listings", "Ensure search/filter state stays in sync with map viewport and list", "High", "Planned", "", "Both", today, "1) Search for a location - verify map and list sync. 2) Pan map - verify list updates. 3) Apply filters - verify map markers update. 4) Verify state persists across page refreshes.", "Map and list should always be in sync."],
        ["TASK-077", "UI/UX - Map", "/listings", "Optimize map performance (debouncing, reduced re-renders, lazy loading)", "High", "Planned", "", "Both", today, "1) Profile map performance. 2) Implement debouncing for viewport changes. 3) Reduce unnecessary re-renders. 4) Implement lazy loading for markers. 5) Verify performance improvements.", "Map should be smooth and responsive."],
        # Bottom Navigation (Mobile)
        ["TASK-078", "UI/UX - Mobile Navigation", "/mobile-layout", "Design bottom navigation bar inspired by Redfin/Zillow with 4-5 tabs (e.g., Find Homes, Feed, Favorites, My Deals/Saved, Profile)", "High", "Planned", "", "Mobile", today, "1) Design bottom navigation with appropriate tabs. 2) Verify icons are clear and intuitive. 3) Test navigation flow between tabs. 4) Verify active state is clear.", "Bottom nav should follow mobile app patterns."],
        ["TASK-079", "UI/UX - Mobile Navigation", "/mobile-layout", "Implement bottom navigation for mobile web (and later native mobile app)", "High", "Planned", "", "Mobile", today, "1) Implement bottom navigation component. 2) Add to mobile layout. 3) Test navigation between sections. 4) Verify it doesn't interfere with content. 5) Test on various mobile devices.", "Bottom nav improves mobile UX significantly."],
        ["TASK-080", "UI/UX - Mobile Navigation", "/mobile-layout", "Ensure each tab routes to the correct section and preserves filters/state where appropriate", "Medium", "Planned", "", "Mobile", today, "1) Test navigation to each tab. 2) Verify routes are correct. 3) Test that filters/state persist when navigating. 4) Verify back button behavior.", "State preservation improves UX."],
        # Listing Cards & Detail
        ["TASK-081", "UI/UX - Listing Cards", "/listings /components/ListingCard", "Design property card layout (price, beds/baths, address, badges, quick actions)", "High", "Planned", "", "Both", today, "1) Design card layout matching Redfin/Zillow quality. 2) Include price, beds/baths, address prominently. 3) Add badges for featured, new, etc. 4) Add quick actions (favorite, share). 5) Verify information hierarchy is clear.", "Cards should be scannable and actionable."],
        ["TASK-082", "UI/UX - Listing Cards", "/listings", "Implement property card component for list view and map-linked results", "High", "Planned", "", "Both", today, "1) Create property card component. 2) Use in list view. 3) Link cards to map markers. 4) Verify clicking card highlights marker. 5) Verify clicking marker highlights card.", "Cards should integrate seamlessly with map."],
        ["TASK-083", "UI/UX - Listing Detail", "/listing/[id]", "Update listing detail page layout with clear sections (photos, key stats, AI tools, contact options)", "High", "Planned", "", "Both", today, "1) Design detail page layout. 2) Organize into clear sections. 3) Verify photos are prominent. 4) Verify key stats are easy to scan. 5) Verify AI tools and contact options are accessible.", "Detail page should be well-organized like Redfin/Zillow."],
        ["TASK-084", "UI/UX - Listing Detail", "/listing/[id]", "Ensure consistent use of card components on listing detail sub-sections (comps, repair estimate, notes, etc.)", "Medium", "Planned", "", "Both", today, "1) Identify all sub-sections on detail page. 2) Apply card components consistently. 3) Verify visual consistency. 4) Test on mobile and desktop.", "Consistency improves visual polish."],
        # Interactions & Animations
        ["TASK-085", "UI/UX - Animations", "/listings /components", "Add subtle loading animations (skeletons/fade-ins) for map and list results", "Medium", "Planned", "", "Both", today, "1) Create skeleton loader components. 2) Apply to map loading. 3) Apply to list loading. 4) Verify animations are smooth. 5) Test on slow connections.", "Loading states improve perceived performance."],
        ["TASK-086", "UI/UX - Interactions", "/listings", "Implement marker selection animation (highlight selected property on map and in list)", "Medium", "Planned", "", "Both", today, "1) Click listing card - verify marker highlights. 2) Click marker - verify card highlights. 3) Verify animation is smooth. 4) Verify highlight is clear and visible.", "Selection feedback improves UX."],
        ["TASK-087", "UI/UX - Interactions", "/listings /components/WatchlistButton", "Implement polished favorite heart animation and state syncing", "Medium", "Planned", "", "Both", today, "1) Click favorite button. 2) Verify heart animation is smooth. 3) Verify state syncs across devices. 4) Verify favorite persists after refresh. 5) Test favorite/unfavorite flow.", "Favorite animation should feel delightful."],
        ["TASK-088", "UI/UX - Animations", "/app", "Implement smooth transitions when switching between tabs (e.g., fade/slide)", "Low", "Planned", "", "Both", today, "1) Navigate between tabs. 2) Verify transitions are smooth. 3) Verify no jarring jumps. 4) Test on mobile and desktop.", "Smooth transitions improve polish."],
        # Quality & Polish
        ["TASK-089", "UI/UX - Quality", "/docs", "Create a UX review checklist explicitly comparing Off Axis vs. Redfin/Zillow", "High", "Planned", "", "Both", today, "1) Document Redfin/Zillow UX patterns. 2) Create comparison checklist. 3) Review Off Axis against checklist. 4) Document gaps and improvements needed.", "Checklist ensures we match quality standards."],
        ["TASK-090", "UI/UX - Quality", "/app", "Run a UX pass on all critical flows (search, filter, map, view listing, save, contact)", "High", "Planned", "", "Both", today, "1) Test search flow end-to-end. 2) Test filter flow. 3) Test map interaction flow. 4) Test listing detail flow. 5) Test save/contact flows. 6) Document issues.", "Critical flows must be polished."],
        ["TASK-091", "UI/UX - Quality", "/app", "Fix identified UI/UX issues from this pass and track them individually as sub-tasks", "High", "Planned", "", "Both", today, "1) Prioritize identified issues. 2) Fix high-priority issues. 3) Track fixes in task system. 4) Verify improvements. 5) Continue iterating.", "Continuous improvement based on UX review."],
        
        # SECTION 2 - Value & Pricing Strategy
        # Tier Definition & Copy
        ["TASK-092", "Product & Pricing", "/pricing /docs", "Document detailed feature matrix for Free, Basic, and Pro tiers (including limits and caps)", "High", "Planned", "", "Both", today, "1) List all features for each tier. 2) Document limits and caps. 3) Create visual feature matrix. 4) Verify matrix is clear and accurate.", "Feature matrix is foundation for pricing strategy."],
        ["TASK-093", "Product & Pricing", "/pricing /marketing", "Write clear marketing copy for each tier explaining value for wholesalers and investors", "High", "Planned", "", "Both", today, "1) Write value proposition for Free tier. 2) Write value proposition for Basic tier. 3) Write value proposition for Pro tier. 4) Ensure copy speaks to wholesaler and investor needs. 5) Test copy clarity with users.", "Copy should clearly communicate value."],
        ["TASK-094", "Product & Pricing", "/pricing", "Update pricing page UI to reflect tiers and benefits", "High", "Planned", "", "Both", today, "1) Design pricing page layout. 2) Display tier comparison clearly. 3) Highlight key benefits per tier. 4) Add clear CTAs. 5) Test on mobile and desktop.", "Pricing page should drive conversions."],
        # Free Tier
        ["TASK-095", "Product & Pricing - Free Tier", "/app /api", "Implement Free tier limits: searches, map interactions, AI comps per day, saved properties, notifications", "High", "Planned", "", "Both", today, "1) Implement search limit tracking. 2) Implement map interaction limits. 3) Implement AI comp daily limits. 4) Implement saved property limits. 5) Implement notification limits. 6) Test limits are enforced.", "Free tier limits drive upgrades."],
        ["TASK-096", "Product & Pricing - Free Tier", "/app", "Add in-product messaging when a Free user hits limits (upsell to Basic/Pro)", "High", "Planned", "", "Both", today, "1) Detect when user hits limit. 2) Show appropriate upsell message. 3) Link to pricing page. 4) Verify message is clear and not annoying. 5) Test messaging placement.", "Upsell messaging should be timely and clear."],
        ["TASK-097", "Product & Pricing - Free Tier", "/app", "Ensure Free tier still delivers real value (not a demo only experience)", "High", "Planned", "", "Both", today, "1) Review Free tier feature set. 2) Verify users can accomplish meaningful tasks. 3) Test Free tier user journey. 4) Ensure value is clear. 5) Gather user feedback.", "Free tier must deliver real value to drive adoption."],
        # Basic Tier
        ["TASK-098", "Product & Pricing - Basic Tier", "/listings /filters", "Enable advanced map filters for Basic and above (price, property type, strategy tags, etc.)", "Medium", "Planned", "", "Both", today, "1) Identify advanced filters. 2) Gate filters to Basic+ tiers. 3) Verify filters work correctly. 4) Test upgrade prompt for Free users.", "Advanced filters add value to Basic tier."],
        ["TASK-099", "Product & Pricing - Basic Tier", "/watchlists", "Increase saved property limits for Basic users", "Medium", "Planned", "", "Both", today, "1) Define Basic tier saved property limit. 2) Implement limit check. 3) Verify limit is higher than Free. 4) Test limit enforcement.", "Higher limits add value to Basic tier."],
        ["TASK-100", "Product & Pricing - Basic Tier", "/ai/comps", "Allow 5-10 AI comps per day (configurable limit) for Basic users", "Medium", "Planned", "", "Both", today, "1) Set Basic tier AI comp limit (5-10/day). 2) Implement daily limit tracking. 3) Verify limit resets daily. 4) Test limit enforcement and messaging.", "AI comps are valuable feature for Basic tier."],
        ["TASK-101", "Product & Pricing - Basic Tier", "/repair-estimator", "Enable repair estimator feature for Basic and above", "Medium", "Planned", "", "Both", today, "1) Verify repair estimator is gated. 2) Enable for Basic+ users. 3) Show upgrade prompt for Free users. 4) Test feature access.", "Repair estimator adds significant value."],
        ["TASK-102", "Product & Pricing - Basic Tier", "/tools", "Add basic wholesaler disposition tools (simple deal sheet, basic buyer export) for Basic users", "Medium", "Planned", "", "Both", today, "1) Design basic deal sheet template. 2) Implement deal sheet generation. 3) Implement basic buyer export. 4) Test tools work correctly. 5) Verify Basic tier access.", "Disposition tools help wholesalers close deals."],
        # Pro Tier
        ["TASK-103", "Product & Pricing - Pro Tier", "/ai/tools", "Enable unlimited AI comps, ARV, and repair estimates for Pro users (with safety caps if needed)", "High", "Planned", "", "Both", today, "1) Remove limits for Pro users. 2) Implement safety caps if needed. 3) Verify unlimited access works. 4) Test edge cases. 5) Monitor usage patterns.", "Unlimited AI tools are key Pro differentiator."],
        ["TASK-104", "Product & Pricing - Pro Tier", "/listings /watchlists", "Enable unlimited searches and saved properties for Pro", "High", "Planned", "", "Both", today, "1) Remove search limits for Pro. 2) Remove saved property limits for Pro. 3) Verify unlimited access. 4) Test with high usage.", "Unlimited access is key Pro value."],
        ["TASK-105", "Product & Pricing - Pro Tier", "/data-sources", "Integrate off-market data sources for Pro tier (within legal limits)", "High", "Planned", "", "Both", today, "1) Identify legal off-market data sources. 2) Integrate data APIs. 3) Gate to Pro tier. 4) Display off-market listings. 5) Verify legal compliance.", "Off-market data is high-value Pro feature."],
        ["TASK-106", "Product & Pricing - Pro Tier", "/contact-info", "Implement contact info lookup for Pro, constrained to what's legally allowed (no illegal data)", "High", "Planned", "", "Both", today, "1) Research legal contact info sources. 2) Implement lookup feature. 3) Ensure legal compliance. 4) Gate to Pro tier. 5) Test lookup accuracy.", "Contact info must be legally compliant."],
        ["TASK-107", "Product & Pricing - Pro Tier", "/export", "Add bulk export capabilities (CSV/API) gated to Pro", "Medium", "Planned", "", "Both", today, "1) Implement bulk CSV export. 2) Implement API access for bulk data. 3) Gate to Pro tier. 4) Test export functionality. 5) Verify data accuracy.", "Bulk export is valuable for Pro users."],
        ["TASK-108", "Product & Pricing - Pro Tier", "/analytics/heatmap", "Enable heatmaps and investor analytics for Pro (e.g., buy box heat, activity maps)", "Medium", "Planned", "", "Both", today, "1) Verify heatmap feature exists. 2) Gate to Pro tier. 3) Test Pro access. 4) Show upgrade prompt for lower tiers.", "Advanced analytics are Pro differentiator."],
        ["TASK-109", "Product & Pricing - Pro Tier", "/alerts", "Enable saved search alerts and advanced notifications for Pro", "Medium", "Planned", "", "Both", today, "1) Implement saved search alerts. 2) Implement advanced notification preferences. 3) Gate to Pro tier. 4) Test alert delivery. 5) Test notification preferences.", "Alerts drive engagement and retention."],
        ["TASK-110", "Product & Pricing - Pro Tier", "/directory", "Gate access to national investor/buyer database to Pro tier", "Medium", "Planned", "", "Both", today, "1) Verify directory exists. 2) Gate access to Pro. 3) Test Pro access. 4) Show upgrade prompt. 5) Verify directory is valuable.", "Directory access is high-value Pro feature."],
        ["TASK-111", "Product & Pricing - Pro Tier", "/buildlink", "Integrate Build Link contractor marketplace access/features for Pro", "Low", "Planned", "", "Both", today, "1) Research Build Link integration. 2) Implement integration. 3) Gate to Pro tier. 4) Test access and features. 5) Verify value delivery.", "Contractor marketplace adds Pro value."],
        # Monetization and Stripe
        ["TASK-112", "Product & Pricing - Stripe", "/billing /stripe", "Ensure Stripe plans and metering align with tier feature matrix", "High", "Planned", "", "Both", today, "1) Review Stripe plan configuration. 2) Verify plans match tier matrix. 3) Verify metering is set up correctly. 4) Test subscription creation. 5) Test plan upgrades/downgrades.", "Stripe config must match feature matrix."],
        ["TASK-113", "Product & Pricing - Stripe", "/app", "Add in-product upgrade prompts at key moments (e.g., hitting comp limit, exporting, using repair estimator)", "High", "Planned", "", "Both", today, "1) Identify key upgrade moments. 2) Design upgrade prompts. 3) Implement prompts. 4) Test prompt timing. 5) Verify conversion tracking.", "Strategic upgrade prompts drive revenue."],
        ["TASK-114", "Product & Pricing - Stripe", "/billing", "Implement downgrade/cancellation UX and ensure data access rules are correct", "Medium", "Planned", "", "Both", today, "1) Design downgrade flow. 2) Design cancellation flow. 3) Implement data access rules. 4) Test downgrade/cancellation. 5) Verify data access after downgrade.", "Downgrade/cancellation must be clear and fair."],
        
        # SECTION 3 - First Thought Platform
        # Wholesaler Flows
        ["TASK-115", "Platform - Wholesaler Flows", "/post", "Design optimized Post a Deal workflow for wholesalers (step-by-step form)", "High", "Planned", "", "Both", today, "1) Design multi-step form flow. 2) Break down into logical steps. 3) Implement step navigation. 4) Test form completion flow. 5) Verify data saves correctly.", "Optimized flow reduces friction for wholesalers."],
        ["TASK-116", "Platform - Wholesaler Flows", "/listing/[id]", "Implement simple contact buttons (call/text/email) on listing detail for wholesalers", "High", "Planned", "", "Both", today, "1) Add contact buttons to listing detail. 2) Implement call functionality. 3) Implement text/SMS functionality. 4) Implement email functionality. 5) Test on mobile and desktop.", "Easy contact drives deal flow."],
        ["TASK-117", "Platform - Wholesaler Flows", "/post", "Add visibility options (public, investor-only, specific buyer lists) respecting legal boundaries", "Medium", "Planned", "", "Both", today, "1) Research legal boundaries for visibility options. 2) Design visibility options UI. 3) Implement visibility controls. 4) Verify legal compliance. 5) Test visibility settings.", "Visibility options give wholesalers control."],
        ["TASK-118", "Platform - Wholesaler Flows", "/tools/deal-sheet", "Implement auto-generated deal sheets from listing + AI (ARV, MAO, repair summary, yield)", "Medium", "Planned", "", "Both", today, "1) Design deal sheet template. 2) Pull listing data. 3) Pull AI analysis data. 4) Generate deal sheet. 5) Test generation and accuracy.", "Auto-generated deal sheets save time."],
        ["TASK-119", "Platform - Wholesaler Flows", "/tools", "Plan and scope an AI contract analyzer as an optional future addon (flag legal disclaimers)", "Low", "Planned", "", "Both", today, "1) Research contract analysis requirements. 2) Scope AI contract analyzer feature. 3) Create technical plan. 4) Estimate effort. 5) Document in roadmap.", "Contract analyzer could be valuable addon."],
        # Investor Flows
        ["TASK-120", "Platform - Investor Flows", "/listings", "Highlight verified/quality listings (tags, badges)", "Medium", "Planned", "", "Both", today, "1) Define verification criteria. 2) Implement verification system. 3) Add tags/badges to listings. 4) Display prominently. 5) Test verification flow.", "Verified listings build trust."],
        ["TASK-121", "Platform - Investor Flows", "/listings", "Add filters and badges for verified seller or vetted deal where applicable", "Medium", "Planned", "", "Both", today, "1) Design seller verification system. 2) Implement seller badges. 3) Add deal vetting process. 4) Add filters for verified sellers. 5) Test verification and filtering.", "Verified sellers build trust with investors."],
        ["TASK-122", "Platform - Investor Flows", "/listing/[id]", "Add AI-powered deal analysis widgets (cash-on-cash, cap rate, ROI scenarios)", "High", "Planned", "", "Both", today, "1) Design analysis widgets. 2) Implement cash-on-cash calculator. 3) Implement cap rate calculator. 4) Implement ROI scenarios. 5) Test calculations and display.", "Analysis widgets help investors evaluate deals."],
        ["TASK-123", "Platform - Investor Flows", "/analytics/heatmap", "Implement overlays/heatmaps for investor metrics (hot zip codes, rent vs. price, volume)", "Medium", "Planned", "", "Both", today, "1) Identify investor metrics to display. 2) Design heatmap overlays. 3) Implement metric calculations. 4) Display on map. 5) Test heatmap visualization.", "Investor heatmaps provide market insights."],
        ["TASK-124", "Platform - Investor Flows", "/investor-profile", "Implement investor buy box profiles to match deals to investors", "Medium", "Planned", "", "Both", today, "1) Design buy box profile system. 2) Allow investors to define criteria. 3) Implement matching algorithm. 4) Notify investors of matches. 5) Test matching accuracy.", "Buy box matching improves deal flow."],
        # Community & Retention
        ["TASK-125", "Platform - Community", "/social", "Plan integration with Facebook groups / social presence for Off Axis Deals users", "Low", "Planned", "", "Both", today, "1) Research Facebook group integration options. 2) Design integration approach. 3) Create implementation plan. 4) Estimate effort. 5) Document in roadmap.", "Social integration builds community."],
        ["TASK-126", "Platform - Community", "/messages", "Design and plan in-app chat/messaging for buyers and sellers (Phase 2)", "Medium", "Planned", "", "Both", today, "1) Review existing messaging system. 2) Design improvements. 3) Plan Phase 2 enhancements. 4) Create technical spec. 5) Estimate effort.", "Messaging is critical for deal flow."],
        ["TASK-127", "Platform - Community", "/newsletter", "Implement newsletter signup / email list capture inside the app", "Low", "Planned", "", "Both", today, "1) Design newsletter signup UI. 2) Integrate email service. 3) Implement signup flow. 4) Test email delivery. 5) Verify list management.", "Newsletter builds marketing list."],
        ["TASK-128", "Platform - Community", "/featured", "Create automated Deal of the Day or Featured Deals campaign logic", "Low", "Planned", "", "Both", today, "1) Design featured deals system. 2) Implement selection algorithm. 3) Create display components. 4) Test automation. 5) Verify featured deals rotate.", "Featured deals drive engagement."],
        ["TASK-129", "Platform - Community", "/announcements", "Set up cadence for monthly market breakdowns and in-app announcements", "Low", "Planned", "", "Both", today, "1) Design announcement system. 2) Create content calendar. 3) Implement announcement delivery. 4) Test announcement display. 5) Verify cadence automation.", "Announcements keep users engaged."],
        # Metrics & Growth
        ["TASK-130", "Platform - Growth", "/analytics", "Define core metrics for Top of mind (DAU/MAU, deals posted, buyers active, time-to-first-deal)", "High", "Planned", "", "Both", today, "1) Define DAU/MAU tracking. 2) Define deal posting metrics. 3) Define buyer activity metrics. 4) Define time-to-first-deal. 5) Implement tracking.", "Metrics drive growth strategy."],
        ["TASK-131", "Platform - Growth", "/analytics", "Add analytics events to track these behaviors", "High", "Planned", "", "Both", today, "1) Implement event tracking system. 2) Add events for core metrics. 3) Test event firing. 4) Verify data collection. 5) Set up dashboards.", "Event tracking enables data-driven decisions."],
        ["TASK-132", "Platform - Growth", "/referrals", "Design growth experiments (referral codes, invite flows, affiliate options)", "Medium", "Planned", "", "Both", today, "1) Design referral system. 2) Design invite flows. 3) Research affiliate options. 4) Create implementation plan. 5) Estimate effort.", "Growth experiments drive user acquisition."],
        
        # SECTION 4 - Legal & Global Expansion
        # Core Legal Positioning
        ["TASK-133", "Legal & Compliance", "/legal", "Document Off Axis Deals' role as a marketplace (not an agent or broker)", "High", "Planned", "", "Both", today, "1) Review business model documentation. 2) Document marketplace role clearly. 3) Create legal positioning document. 4) Review with legal counsel. 5) Update terms of service.", "Clear legal positioning protects business."],
        ["TASK-134", "Legal & Compliance", "/legal", "Draft and implement global terms of service and privacy policy aligned to this role", "High", "Planned", "", "Both", today, "1) Draft terms of service. 2) Draft privacy policy. 3) Review with legal counsel. 4) Implement in app. 5) Ensure user acceptance.", "Legal docs must be comprehensive and compliant."],
        ["TASK-135", "Legal & Compliance", "/ai/tools", "Add explicit disclaimers around AI tools (comps, ARV, repair estimates are estimates, not appraisals or legal advice)", "High", "Planned", "", "Both", today, "1) Identify all AI tools. 2) Draft appropriate disclaimers. 3) Display disclaimers prominently. 4) Ensure user acknowledgment. 5) Test disclaimer visibility.", "Disclaimers protect from legal liability."],
        # U.S. Compliance
        ["TASK-136", "Legal & Compliance - US", "/legal", "Review U.S. wholesaling regulations at a high level (state-by-state sensitivity notes)", "High", "Planned", "", "US", today, "1) Research U.S. wholesaling regulations. 2) Document state-by-state differences. 3) Identify high-sensitivity states. 4) Create compliance guide. 5) Review with legal counsel.", "U.S. compliance is critical."],
        ["TASK-137", "Legal & Compliance - US", "/platform", "Ensure platform avoids acting as an agent (no negotiation on user's behalf, no handling of earnest money)", "High", "Planned", "", "US", today, "1) Review platform functionality. 2) Ensure no agent-like behavior. 3) Remove any earnest money handling. 4) Verify compliance. 5) Document safeguards.", "Platform must remain marketplace only."],
        ["TASK-138", "Legal & Compliance - US", "/listings", "Add in-product disclosures about assignment fees and user responsibilities", "Medium", "Planned", "", "US", today, "1) Draft assignment fee disclosure. 2) Draft user responsibility disclosure. 3) Display in appropriate locations. 4) Ensure user acknowledgment. 5) Test disclosure visibility.", "Disclosures protect users and platform."],
        # Australia Expansion
        ["TASK-139", "Legal & Compliance - Australia", "/legal/au", "Research Australian wholesaling/deal sourcing regulations (including assignment fee disclosure and Privacy Act 1988 constraints)", "High", "Planned", "", "Australia", today, "1) Research Australian regulations. 2) Document Privacy Act requirements. 3) Document assignment fee rules. 4) Create compliance guide. 5) Review with Australian legal counsel.", "Australia expansion requires compliance research."],
        ["TASK-140", "Legal & Compliance - Australia", "/legal/au", "Identify restricted states/territories and any special rules (e.g., anti-underquoting)", "High", "Planned", "", "Australia", today, "1) Research Australian states/territories. 2) Identify restrictions. 3) Document special rules. 4) Create compliance checklist. 5) Plan feature restrictions.", "State-by-state compliance is critical."],
        ["TASK-141", "Legal & Compliance - Australia", "/au", "Define AU-specific disclaimers and content for an /au version of the site", "Medium", "Planned", "", "Australia", today, "1) Draft AU-specific disclaimers. 2) Create AU-specific content. 3) Implement /au version. 4) Test content display. 5) Verify compliance.", "AU version must be compliant."],
        ["TASK-142", "Legal & Compliance - Australia", "/au", "Ensure AU features keep Off Axis as a marketplace (no escrow, no brokering, no valuations claimed as certified)", "High", "Planned", "", "Australia", today, "1) Review AU feature set. 2) Ensure marketplace-only functionality. 3) Remove any brokering features. 4) Verify no certified valuations. 5) Test compliance.", "AU must remain marketplace only."],
        # UK Expansion
        ["TASK-143", "Legal & Compliance - UK", "/legal/uk", "Research UK deal sourcing regulations (Property Ombudsman, Estate Agents Act 1979, National Trading Standards)", "High", "Planned", "", "UK", today, "1) Research UK regulations. 2) Document Property Ombudsman requirements. 3) Document Estate Agents Act requirements. 4) Create compliance guide. 5) Review with UK legal counsel.", "UK expansion requires compliance research."],
        ["TASK-144", "Legal & Compliance - UK", "/legal/uk", "Determine requirements for AML registration, client money protection, and disclosure", "High", "Planned", "", "UK", today, "1) Research AML requirements. 2) Research client money protection. 3) Document disclosure requirements. 4) Create compliance plan. 5) Estimate registration costs.", "UK has strict regulatory requirements."],
        ["TASK-145", "Legal & Compliance - UK", "/uk", "Define UK-specific flows and disclaimers for /uk", "Medium", "Planned", "", "UK", today, "1) Draft UK-specific disclaimers. 2) Create UK-specific flows. 3) Implement /uk version. 4) Test flows and disclaimers. 5) Verify compliance.", "UK version must be compliant."],
        ["TASK-146", "Legal & Compliance - UK", "/uk", "Ensure UK presence is limited to marketplace functionality (no brokering, no holding client money)", "High", "Planned", "", "UK", today, "1) Review UK feature set. 2) Ensure marketplace-only functionality. 3) Remove any brokering features. 4) Verify no client money handling. 5) Test compliance.", "UK must remain marketplace only."],
        # What to Avoid/Allow
        ["TASK-147", "Legal & Compliance", "/docs", "Add internal rules: no negotiating deals, no handling deposits/escrow, no representing parties as an agent", "High", "Planned", "", "Both", today, "1) Document internal rules. 2) Create compliance checklist. 3) Train team on rules. 4) Implement safeguards in code. 5) Review regularly.", "Internal rules prevent compliance violations."],
        ["TASK-148", "Legal & Compliance", "/marketing", "Ensure marketing copy does not claim official valuations or legal/financial advice", "High", "Planned", "", "Both", today, "1) Review all marketing copy. 2) Remove valuation claims. 3) Remove advice claims. 4) Add appropriate disclaimers. 5) Test copy compliance.", "Marketing copy must be compliant."],
        ["TASK-149", "Legal & Compliance", "/docs", "Document allowed features: user-created listings, lead selling, analytics/comps, in-app messaging, educational content, calculators, and deal sheets", "High", "Planned", "", "Both", today, "1) List all allowed features. 2) Document why each is allowed. 3) Create feature compliance guide. 4) Review with legal counsel. 5) Update platform accordingly.", "Clear documentation of allowed features."],
        ["TASK-150", "Legal & Compliance", "/platform", "Make sure product design for AU/UK only uses allowed features", "High", "Planned", "", "Australia UK", today, "1) Review AU/UK feature set. 2) Verify only allowed features. 3) Remove any non-compliant features. 4) Test feature availability. 5) Document compliance.", "AU/UK must use only compliant features."],
        
        # SECTION 5 - High-Level Roadmap
        # Phase 1: Perfect U.S. web MVP
        ["TASK-151", "Roadmap - Phase 1", "/app", "Phase 1: Perfect U.S. web MVP (fix UX, ensure stability, polish critical flows)", "High", "Planned", "", "US", today, "1) Complete all Phase 1 tasks. 2) Fix critical UX issues. 3) Ensure platform stability. 4) Polish all critical flows. 5) Conduct comprehensive testing. 6) Gather user feedback.", "Phase 1 establishes foundation for growth."],
        ["TASK-152", "Roadmap - Phase 1", "/app", "Phase 1 Sub-task: Fix all critical bugs and stability issues", "High", "Planned", "", "US", today, "1) Identify critical bugs. 2) Prioritize fixes. 3) Fix all critical bugs. 4) Test fixes. 5) Verify stability improvements.", "Stability is foundation for everything else."],
        ["TASK-153", "Roadmap - Phase 1", "/app", "Phase 1 Sub-task: Implement Redfin/Zillow-level UI/UX polish", "High", "Planned", "", "US", today, "1) Complete UI/UX foundation tasks. 2) Apply design system. 3) Polish all pages. 4) Test on all devices. 5) Gather user feedback.", "UI/UX polish drives trust and adoption."],
        ["TASK-154", "Roadmap - Phase 1", "/app", "Phase 1 Sub-task: Ensure all critical flows work flawlessly", "High", "Planned", "", "US", today, "1) Test search flow. 2) Test listing creation flow. 3) Test contact/messaging flow. 4) Test payment/subscription flow. 5) Fix any issues.", "Critical flows must work perfectly."],
        # Phase 2: Mobile Apps
        ["TASK-155", "Roadmap - Phase 2", "/mobile", "Phase 2: Build production-ready iOS/Android apps (reusing Supabase and core logic)", "High", "Planned", "", "Both", today, "1) Choose mobile framework (React Native, Flutter, etc.). 2) Set up mobile project. 3) Reuse Supabase backend. 4) Build core features. 5) Test on iOS and Android. 6) Release to app stores.", "Mobile apps drive user engagement."],
        ["TASK-156", "Roadmap - Phase 2", "/mobile", "Phase 2 Sub-task: Set up mobile development environment and project structure", "High", "Planned", "", "Both", today, "1) Choose mobile framework. 2) Set up development environment. 3) Create project structure. 4) Integrate Supabase. 5) Set up build pipeline.", "Mobile project setup is foundation."],
        ["TASK-157", "Roadmap - Phase 2", "/mobile", "Phase 2 Sub-task: Build core mobile features (listings, search, map, messaging)", "High", "Planned", "", "Both", today, "1) Build listings view. 2) Build search. 3) Build map. 4) Build messaging. 5) Test all features. 6) Optimize performance.", "Core features enable mobile usage."],
        ["TASK-158", "Roadmap - Phase 2", "/mobile", "Phase 2 Sub-task: Implement push notifications and native features", "Medium", "Planned", "", "Both", today, "1) Set up push notifications. 2) Implement native features (camera, location). 3) Test notifications. 4) Test native features. 5) Optimize battery usage.", "Native features improve mobile UX."],
        # Phase 3: Advanced AI
        ["TASK-159", "Roadmap - Phase 3", "/ai", "Phase 3: Add advanced AI features that wholesalers care about (comps, ARV, repair estimator, buy-box matching)", "High", "Planned", "", "Both", today, "1) Enhance AI comps accuracy. 2) Improve ARV calculations. 3) Expand repair estimator. 4) Implement buy-box matching. 5) Test all AI features. 6) Gather user feedback.", "AI features differentiate platform."],
        ["TASK-160", "Roadmap - Phase 3", "/ai/comps", "Phase 3 Sub-task: Enhance AI comps with more data sources and accuracy improvements", "High", "Planned", "", "Both", today, "1) Identify additional data sources. 2) Integrate new sources. 3) Improve matching algorithm. 4) Test accuracy improvements. 5) Verify performance.", "Better comps drive user value."],
        ["TASK-161", "Roadmap - Phase 3", "/ai/arv", "Phase 3 Sub-task: Improve ARV calculations with machine learning models", "High", "Planned", "", "Both", today, "1) Research ML models for ARV. 2) Train/implement models. 3) Test accuracy. 4) Compare to market data. 5) Iterate on improvements.", "Accurate ARV is critical for wholesalers."],
        ["TASK-162", "Roadmap - Phase 3", "/ai/repair-estimator", "Phase 3 Sub-task: Expand repair estimator with more categories and line-item detail", "Medium", "Planned", "", "Both", today, "1) Add more repair categories. 2) Implement line-item breakdown. 3) Improve cost estimates. 4) Test accuracy. 5) Gather contractor feedback.", "Detailed repair estimates add value."],
        # Phase 4: Directory
        ["TASK-163", "Roadmap - Phase 4", "/directory", "Phase 4: Build and grow the directory (cash buyers, investors, contractors, title companies, hard money lenders)", "High", "Planned", "", "Both", today, "1) Design directory structure. 2) Build directory UI. 3) Onboard initial providers. 4) Implement search/filtering. 5) Add provider profiles. 6) Grow directory organically.", "Directory adds network effects."],
        ["TASK-164", "Roadmap - Phase 4", "/directory", "Phase 4 Sub-task: Build directory UI and provider profile pages", "High", "Planned", "", "Both", today, "1) Design directory UI. 2) Build provider profile pages. 3) Implement search/filtering. 4) Add provider verification. 5) Test directory functionality.", "Directory UI enables discovery."],
        ["TASK-165", "Roadmap - Phase 4", "/directory", "Phase 4 Sub-task: Onboard initial providers (cash buyers, contractors, title companies, lenders)", "High", "Planned", "", "Both", today, "1) Identify target providers. 2) Create onboarding process. 3) Reach out to providers. 4) Onboard initial set. 5) Gather feedback.", "Initial providers seed directory."],
        ["TASK-166", "Roadmap - Phase 4", "/directory", "Phase 4 Sub-task: Implement provider search, filtering, and matching", "Medium", "Planned", "", "Both", today, "1) Implement search functionality. 2) Add filtering options. 3) Implement matching algorithm. 4) Test search accuracy. 5) Optimize performance.", "Search enables directory utility."],
        # Phase 5: International Expansion
        ["TASK-167", "Roadmap - Phase 5", "/international", "Phase 5: Launch regional modules /uk, /au, /ca with compliant feature sets and disclaimers", "High", "Planned", "", "UK Australia Canada", today, "1) Complete legal/compliance research. 2) Build regional modules. 3) Implement compliant features. 4) Add regional disclaimers. 5) Test compliance. 6) Launch in each region.", "International expansion drives growth."],
        ["TASK-168", "Roadmap - Phase 5", "/uk", "Phase 5 Sub-task: Launch UK module with compliant features", "High", "Planned", "", "UK", today, "1) Complete UK compliance research. 2) Build UK module. 3) Implement UK-compliant features. 4) Add UK disclaimers. 5) Test compliance. 6) Launch UK.", "UK launch requires full compliance."],
        ["TASK-169", "Roadmap - Phase 5", "/au", "Phase 5 Sub-task: Launch Australia module with compliant features", "High", "Planned", "", "Australia", today, "1) Complete AU compliance research. 2) Build AU module. 3) Implement AU-compliant features. 4) Add AU disclaimers. 5) Test compliance. 6) Launch Australia.", "Australia launch requires full compliance."],
        ["TASK-170", "Roadmap - Phase 5", "/ca", "Phase 5 Sub-task: Research and plan Canada module", "Medium", "Planned", "", "Canada", today, "1) Research Canadian regulations. 2) Document compliance requirements. 3) Create implementation plan. 4) Estimate effort. 5) Plan Canada launch.", "Canada expansion requires research."],
        # Phase 6: Growth Loops
        ["TASK-171", "Roadmap - Phase 6", "/growth", "Phase 6: Iterate on growth loops (referrals, content marketing, partnerships, affiliates)", "High", "Planned", "", "Both", today, "1) Implement referral system. 2) Launch content marketing. 3) Build partnerships. 4) Create affiliate program. 5) Test growth loops. 6) Optimize based on data.", "Growth loops drive sustainable growth."],
        ["TASK-172", "Roadmap - Phase 6", "/referrals", "Phase 6 Sub-task: Implement and optimize referral system", "High", "Planned", "", "Both", today, "1) Build referral system. 2) Create referral tracking. 3) Design referral rewards. 4) Test referral flow. 5) Optimize based on data.", "Referrals drive organic growth."],
        ["TASK-173", "Roadmap - Phase 6", "/content", "Phase 6 Sub-task: Launch content marketing strategy (blog, SEO, educational content)", "Medium", "Planned", "", "Both", today, "1) Create content strategy. 2) Build blog system. 3) Create initial content. 4) Optimize for SEO. 5) Measure content performance.", "Content marketing drives organic traffic."],
        ["TASK-174", "Roadmap - Phase 6", "/partnerships", "Phase 6 Sub-task: Build strategic partnerships (wholesaling education, real estate groups, etc.)", "Medium", "Planned", "", "Both", today, "1) Identify partnership opportunities. 2) Reach out to potential partners. 3) Negotiate partnerships. 4) Implement partnership features. 5) Measure partnership impact.", "Partnerships accelerate growth."],
        ["TASK-175", "Roadmap - Phase 6", "/affiliates", "Phase 6 Sub-task: Create and manage affiliate program", "Low", "Planned", "", "Both", today, "1) Design affiliate program. 2) Build affiliate tracking. 3) Create affiliate dashboard. 4) Recruit affiliates. 5) Manage and optimize program.", "Affiliate program scales growth."],
    ]
    
    # Add new tasks to CSV
    for task in new_tasks:
        updated_rows.append(task)
    
    # Write directly to CSV file using Windows-friendly approach
    import shutil
    import os
    
    temp_path = output_path.with_suffix('.csv.tmp')
    
    try:
        # Write to temp file first
        with open(temp_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(updated_rows)
        
        # Delete original if it exists
        if output_path.exists():
            try:
                output_path.unlink()
            except PermissionError as pe:
                print(f"⚠️  Could not delete {csv_path} (file may be open in Excel/editor)")
                print(f"   Error: {pe}")
                print(f"   Updated file written to: {temp_path}")
                print(f"   Please close {csv_path.name} and manually rename {temp_path.name} to {output_path.name}")
                sys.exit(1)
            except Exception as e:
                print(f"⚠️  Error deleting old file: {e}")
                print(f"   Updated file written to: {temp_path}")
                sys.exit(1)
        
        # Move temp file to final location
        try:
            shutil.move(str(temp_path), str(output_path))
            print(f"✅ Successfully updated {csv_path.name}")
            print(f"   - Updated {len(data_rows)} existing rows with test instructions")
            print(f"   - Added {len(new_tasks)} new tasks for future development")
            print(f"   - Total tasks: {len(updated_rows) - 1}")
        except Exception as e:
            print(f"⚠️  Could not move temp file to final location: {e}")
            print(f"   Updated file is at: {temp_path}")
            print(f"   Please manually rename it to: {output_path.name}")
        
    except Exception as e:
        print(f"❌ Error writing CSV: {e}")
        import traceback
        traceback.print_exc()
        if temp_path.exists():
            try:
                temp_path.unlink()
            except:
                pass
        raise

if __name__ == "__main__":
    main()


# CSV Update Plan

## Summary

The master tasks CSV needs to be updated with:
1. Test instructions for all tasks missing them
2. New tasks for future development (Sections 1-5 from roadmap prompt)

## Current Status

- ✅ TASK-001: Updated with comprehensive test instructions including 401 fix for listing creation
- ⏳ Remaining tasks: Need test instructions added
- ⏳ New tasks: Need to be appended (111 new tasks from roadmap)

## Update Process

### Option 1: Run Python Script (Recommended)

When the CSV file is closed, run:
```bash
python scripts/update_master_tasks.py
```

This script will:
- Add test instructions to all tasks missing them
- Append 111 new tasks for future development
- Preserve all existing data

### Option 2: Manual Updates

If you prefer to update manually, the script at `scripts/update_master_tasks.py` contains:
- Logic for generating appropriate test instructions based on task description
- All 111 new tasks ready to append

## New Tasks Added

The script will add tasks from:

1. **Section 1 - Redfin/Zillow-level UI & UX** (TASK-065 to TASK-091)
   - UI/UX Foundations
   - Top Bar & Search
   - Map Experience
   - Bottom Navigation (Mobile)
   - Listing Cards & Detail
   - Interactions & Animations
   - Quality & Polish

2. **Section 2 - Value & Pricing Strategy** (TASK-092 to TASK-114)
   - Tier Definition & Copy
   - Free Tier Features
   - Basic Tier Features
   - Pro Tier Features
   - Monetization and Stripe

3. **Section 3 - First Thought Platform** (TASK-115 to TASK-132)
   - Wholesaler Flows
   - Investor Flows
   - Community & Retention
   - Metrics & Growth

4. **Section 4 - Legal & Global Expansion** (TASK-133 to TASK-150)
   - Core Legal Positioning
   - U.S. Compliance
   - Australia Expansion
   - UK Expansion
   - What to Avoid/Allow

5. **Section 5 - High-Level Roadmap** (TASK-151 to TASK-175)
   - Phase 1: Perfect U.S. web MVP
   - Phase 2: Mobile Apps
   - Phase 3: Advanced AI
   - Phase 4: Directory
   - Phase 5: International Expansion
   - Phase 6: Growth Loops

## Next Steps

1. Close the CSV file in your IDE
2. Run the update script
3. Review the updated CSV
4. Mark tasks as "Passed" only when you've explicitly tested and verified them

## Important Notes

- **Status Field**: Only mark tasks as "Passed" when you've explicitly tested and confirmed they work
- **Test Instructions**: All tasks now have or will have comprehensive test instructions
- **New Tasks**: All new tasks are set to "Planned" status and can be moved to "Not Started" when ready to work on them


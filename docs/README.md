# Off Axis Deals Documentation

This directory contains project documentation and task tracking files.

## Task Tracking

### Master Task List

**`off_axis_deals_master_tasks.csv`** is the **single source of truth** for all feature/bug/test tracking.

All task tracking has been consolidated into this one master CSV file to:
- Eliminate duplicate work
- Provide a clear status for each issue
- Include detailed test instructions
- Track diagnostic notes for issues marked "Partially Done – Needs Testing"

### Column Definitions

- **ID**: Unique short ID (e.g., TASK-001)
- **Feature / Area**: Category/area of the application (e.g., "Messages & Notifications", "Analytics Dashboard")
- **Page / Route**: Relevant page or API route (e.g., `/messages`, `/api/analytics`)
- **Description**: Detailed description of the task/issue
- **Priority**: High / Medium / Low
- **Status**: Not Started / In Progress / Partially Done – Needs Testing / Passed / Blocked / Won't Do
- **Owner**: Assigned owner (to be filled)
- **Environment**: Local / Vercel prod / Both
- **Last Updated**: Date last modified
- **Test Instructions**: Step-by-step instructions to reproduce and verify
- **Notes**: Additional context, diagnostic information, or implementation notes

### Legacy Files

The following files have been consolidated into the master CSV and should **not be updated** going forward:

- `off_axis_deals_full_tasks_with_status.csv` (root directory)
- `off_axis_done_feature_test_matrix.csv` (root directory)
- `My Test.xlsx` (root directory)
- `off_axis_deals_test_matrix.xlsx` (root directory)
- `docs/tasks.md` (markdown task list)

These files are kept for historical reference only.

### Known Critical Issues

The master CSV includes specific tracking for current blockers:

1. **Messages & Notifications 401** (TASK-001)
   - Routes updated to use modern auth pattern
   - Status: Partially Done – Needs Testing
   - Requires production testing to verify cookies/headers work correctly

2. **Analytics Dashboard 401** (TASK-002)
   - Route updated with dual auth support (cookies + Authorization header)
   - Status: Partially Done – Needs Testing
   - Requires production testing to verify access for all authenticated users

### Updating Tasks

When updating task status:

1. Open `off_axis_deals_master_tasks.csv`
2. Update the relevant row(s)
3. Set **Status** to:
   - "Partially Done – Needs Testing" if code is complete but needs verification
   - "Passed" if tested and working
   - "Blocked" if waiting on external dependency
4. Update **Last Updated** date
5. Add detailed **Test Instructions** if not present
6. Include diagnostic **Notes** explaining what was done and what needs verification

### Status Workflow

```
Not Started → In Progress → Partially Done – Needs Testing → Passed
                                                      ↓
                                                  Blocked
```

**"Partially Done – Needs Testing"** means:
- Code changes have been implemented
- Build passes successfully
- Manual testing required to verify end-to-end functionality
- Diagnostic notes should explain what was changed and what to verify

---

## Other Documentation

See individual documentation files in this directory for:
- Environment setup (`ENV.md`, `environment-setup.md`)
- Email configuration (`email-setup.md`, `SUPABASE_EMAIL_CONFIG.md`)
- Google Maps setup (`google-maps-setup.md`)
- Deployment guides (`release-checklist.md`, `vercel-domain-setup.md`)
- And more...


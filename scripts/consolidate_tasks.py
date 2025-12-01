#!/usr/bin/env python3
"""
Consolidate all task tracking files into one master CSV.
"""
import csv
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime
import re

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Input files
INPUT_FILES = {
    'tasks_status': BASE_DIR / 'off_axis_deals_full_tasks_with_status.csv',
    'test_matrix': BASE_DIR / 'off_axis_done_feature_test_matrix.csv',
}

# Output file
OUTPUT_FILE = BASE_DIR / 'docs' / 'off_axis_deals_master_tasks.csv'

# Master CSV columns
COLUMNS = [
    'ID',
    'Feature / Area',
    'Page / Route',
    'Description',
    'Priority',
    'Status',
    'Owner',
    'Environment',
    'Last Updated',
    'Test Instructions',
    'Notes',
]

def normalize_status(status):
    """Normalize status values."""
    if not status:
        return 'Not Started'
    status_lower = status.lower().strip()
    if 'done' in status_lower:
        return 'Passed'
    elif 'in progress' in status_lower or 'progress' in status_lower:
        return 'In Progress'
    elif 'blocked' in status_lower:
        return 'Blocked'
    elif 'won' in status_lower and 'do' in status_lower:
        return "Won't Do"
    elif 'test' in status_lower and 'need' in status_lower:
        return 'Partially Done – Needs Testing'
    return status.strip()

def normalize_priority(priority):
    """Normalize priority values."""
    if not priority:
        return 'Medium'
    priority_lower = priority.lower().strip()
    if priority_lower.startswith('p0') or priority_lower == 'high' or priority_lower == 'critical':
        return 'High'
    elif priority_lower.startswith('p1') or priority_lower == 'medium':
        return 'Medium'
    elif priority_lower.startswith('p2') or priority_lower == 'low':
        return 'Low'
    return 'Medium'

def extract_routes(description, task_name):
    """Extract page/route from description and task name."""
    routes = []
    # Common route patterns
    route_patterns = [
        r'/(?:api/)?[a-z-]+(?:\/[a-z-]+)?',
        r'`([^`]+)`',
    ]
    
    text = f"{description} {task_name}"
    for pattern in route_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        routes.extend(matches)
    
    # Deduplicate and format
    unique_routes = sorted(set(routes))
    return ', '.join(unique_routes[:3]) if unique_routes else ''

def parse_tasks_status_csv():
    """Parse the main tasks status CSV."""
    tasks = []
    file_path = INPUT_FILES['tasks_status']
    
    if not file_path.exists():
        print(f"Warning: {file_path} not found")
        return tasks
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                category = row.get('Category', '').strip()
                priority = normalize_priority(row.get('Priority', ''))
                task = row.get('Task', '').strip()
                status = normalize_status(row.get('Status', ''))
                notes = row.get('StatusNotes', '').strip()
                cursor_prompt = row.get('CursorPrompt', '').strip()
                
                if not task:
                    continue
                
                # Extract route from prompt or task name
                route = extract_routes(cursor_prompt, task)
                
                tasks.append({
                    'feature': category or 'General',
                    'route': route,
                    'description': task,
                    'priority': priority,
                    'status': status,
                    'notes': notes,
                    'test_instructions': '',  # Will be filled from test matrix
                })
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    
    return tasks

def parse_test_matrix_csv():
    """Parse the test matrix CSV."""
    tests = {}
    file_path = INPUT_FILES['test_matrix']
    
    if not file_path.exists():
        print(f"Warning: {file_path} not found")
        return tests
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                feature = row.get('Feature', '').strip()
                scenario = row.get('Scenario', '').strip()
                test_steps = row.get('TestSteps', '').strip()
                expected = row.get('ExpectedResult', '').strip()
                
                if not feature:
                    continue
                
                # Combine test instructions
                instructions = f"{test_steps}\nExpected: {expected}" if expected else test_steps
                
                # Key by feature name for matching
                key = feature.lower()
                if key not in tests:
                    tests[key] = []
                tests[key].append(instructions)
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    
    return tests

def deduplicate_tasks(tasks):
    """Deduplicate tasks by description and route."""
    seen = defaultdict(list)
    unique_tasks = []
    
    for task in tasks:
        # Create a signature for deduplication
        desc_key = task['description'].lower().strip()[:100]
        route_key = task['route'].lower().strip()
        signature = f"{desc_key}|{route_key}"
        
        if signature in seen:
            # Merge with existing task
            existing_idx = seen[signature][0]
            existing = unique_tasks[existing_idx]
            
            # Merge notes
            if task['notes'] and task['notes'] not in existing['notes']:
                existing['notes'] += f" | {task['notes']}"
            
            # Merge test instructions
            if task['test_instructions'] and task['test_instructions'] not in existing['test_instructions']:
                existing['test_instructions'] += f"\n\nAdditional: {task['test_instructions']}"
            
            # Keep higher priority
            if task['priority'] == 'High' and existing['priority'] != 'High':
                existing['priority'] = 'High'
        else:
            # New task
            idx = len(unique_tasks)
            unique_tasks.append(task.copy())
            seen[signature] = [idx]
    
    return unique_tasks

def add_known_issues():
    """Add specific known issues that need tracking."""
    return [
        {
            'feature': 'Messages & Notifications',
            'route': '/messages /api/messages /api/notifications /api/messages/unread-count /api/notifications/unread-count',
            'description': '401 Unauthorized for notifications/messages APIs and unknown sign-in loop behavior even for logged-in wholesaler accounts.',
            'priority': 'High',
            'status': 'Partially Done – Needs Testing',
            'notes': 'Routes updated to use createServerClient() from @/supabase/server. Needs production testing to verify cookies/headers work correctly.',
            'test_instructions': """1) Login as wholesaler.free@test.com on Vercel prod.
2) Open `/messages` and check: 
   - No sign-in loop.
   - No repeated 401s in console for `/api/notifications` or `/api/messages`.
   - Unread counts load without error and list renders without crashing.""",
        },
        {
            'feature': 'Analytics Dashboard',
            'route': '/analytics /api/analytics',
            'description': '401 Unauthorized when hitting analytics as a normal wholesaler; analytics should be available to any signed-in user (tier aware if needed).',
            'priority': 'High',
            'status': 'Partially Done – Needs Testing',
            'notes': 'Updated route to use createServerClient() and added Authorization header fallback. All authenticated users should now have access. Needs production testing.',
            'test_instructions': """1) Login as wholesaler.free@test.com on Vercel prod.
2) Open `/analytics`.
3) Verify:
   - API call to `/api/analytics` returns 200 (not 401).
   - Charts/metrics render without errors.
   - Data reflects that listing views are being captured (once the view counter is wired).""",
        },
    ]

def main():
    print("Consolidating task tracking files...")
    
    # Parse all input files
    tasks = parse_tasks_status_csv()
    test_matrix = parse_test_matrix_csv()
    
    # Add known critical issues
    known_issues = add_known_issues()
    tasks.extend(known_issues)
    
    # Match test instructions from test matrix
    for task in tasks:
        feature_key = task['feature'].lower()
        for test_key, instructions in test_matrix.items():
            if test_key in feature_key or feature_key in test_key:
                if instructions:
                    task['test_instructions'] = '\n\n'.join(instructions)
                break
    
    # Deduplicate
    unique_tasks = deduplicate_tasks(tasks)
    
    # Assign IDs and format for output
    output_rows = []
    for idx, task in enumerate(unique_tasks, 1):
        task_id = f"TASK-{idx:03d}"
        output_rows.append({
            'ID': task_id,
            'Feature / Area': task['feature'],
            'Page / Route': task['route'],
            'Description': task['description'],
            'Priority': task['priority'],
            'Status': task['status'],
            'Owner': '',  # To be filled manually
            'Environment': 'Both',  # Default
            'Last Updated': datetime.now().strftime('%Y-%m-%d'),
            'Test Instructions': task['test_instructions'],
            'Notes': task['notes'],
        })
    
    # Write output CSV
    output_file = OUTPUT_FILE
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(output_rows)
    
    print(f"✓ Consolidated {len(output_rows)} unique tasks")
    print(f"✓ Written to: {output_file}")
    print(f"  - {len(known_issues)} known critical issues")
    print(f"  - {len(unique_tasks) - len(known_issues)} tasks from input files")

if __name__ == '__main__':
    main()


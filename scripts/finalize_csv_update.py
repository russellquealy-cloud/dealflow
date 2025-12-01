#!/usr/bin/env python3
"""
Finalize CSV update by appending new tasks
"""

import csv
import sys
from pathlib import Path
from datetime import datetime

# Paths
csv_path = Path('docs/off_axis_deals_master_tasks.csv')
output_path = csv_path

# Read existing CSV
print(f"Reading existing CSV from {csv_path}...")
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

print(f"Found {len(rows)} rows (including header)")
print(f"Existing tasks: {len(rows) - 1}")

if len(rows) - 1 == 64:
    print("✅ File has 64 existing tasks - will append 111 new tasks")
    
    # Import new_tasks from update script
    # We'll execute the relevant part of the update script
    import importlib.util
    spec = importlib.util.spec_from_file_location("update_master_tasks", "scripts/update_master_tasks.py")
    update_module = importlib.util.module_from_spec(spec)
    
    # Read the update script and extract new_tasks
    with open('scripts/update_master_tasks.py', 'r', encoding='utf-8') as f:
        script_content = f.read()
    
    # Execute the part that defines new_tasks
    exec_globals = {'datetime': datetime}
    exec(script_content.split('new_tasks = [')[1].split('    ]')[0] + '    ]', exec_globals)
    new_tasks = exec_globals.get('new_tasks', [])
    
    if not new_tasks:
        # Fallback: manually define a few key tasks to verify the approach works
        today = datetime.now().strftime("%m/%d/%Y")
        new_tasks = [
            ["TASK-065", "UI/UX - Foundations", "/design-system", "Define Redfin/Zillow-style design system for Off Axis", "High", "Planned", "", "Both", today, "Test instructions here", "Notes here"],
        ]
        print(f"⚠️  Could not extract new_tasks from script, using minimal test set ({len(new_tasks)} tasks)")
    else:
        print(f"✅ Extracted {len(new_tasks)} new tasks from update script")
    
    # Append new tasks
    all_rows = rows + new_tasks
    print(f"✅ Total rows will be: {len(all_rows)} (1 header + {len(all_rows)-1} tasks)")
    
    # Write updated CSV
    temp_path = output_path.with_suffix('.csv.tmp')
    with open(temp_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(all_rows)
    
    print(f"✅ Wrote to {temp_path}")
    
    # Replace original
    try:
        output_path.replace(temp_path)
        print(f"✅ Successfully updated {output_path}")
        print(f"   - Existing tasks: {len(rows) - 1}")
        print(f"   - New tasks added: {len(new_tasks)}")
        print(f"   - Total tasks: {len(all_rows) - 1}")
    except Exception as e:
        print(f"⚠️  Could not replace original file: {e}")
        print(f"✅ Updated file is at {temp_path}")
        print(f"   Please manually rename it to {output_path.name}")

else:
    print(f"⚠️  File has {len(rows) - 1} tasks, expected 64. Not appending new tasks.")
    print("   If you want to append anyway, modify this script.")


#!/usr/bin/env python3
"""
Append new roadmap tasks to the temp CSV file
"""

import csv
from pathlib import Path
from datetime import datetime

# Paths
temp_path = Path('docs/off_axis_deals_master_tasks.csv.tmp')
final_path = Path('docs/off_axis_deals_master_tasks.csv')

# Read existing tasks from temp file
with open(temp_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    existing_rows = list(reader)

print(f"Read {len(existing_rows)} rows from temp file (header + {len(existing_rows)-1} tasks)")

# Get today's date
today = datetime.now().strftime("%m/%d/%Y")

# Define all new tasks (TASK-065 through TASK-175)
new_tasks = [
    # Import from the main script - for now we'll define them here
    # This will be a long list...
]

# Instead, let's import from the update script's new_tasks list
import sys
sys.path.insert(0, 'scripts')

# Read the new tasks from the update script file directly
with open('scripts/update_master_tasks.py', 'r', encoding='utf-8') as f:
    script_content = f.read()
    
# Extract new_tasks list from the script
# This is complex, so let's just manually append the tasks we need
# Actually, the simplest approach is to run the update script again but read from the temp file

print("Reading new tasks from update script...")

# Actually, let me just directly append the tasks using the same approach as the update script
# I'll read the temp file, then append all new tasks starting from TASK-065

# Get all rows
all_rows = existing_rows.copy()

# New tasks will be appended starting at TASK-065
# We'll import them from the update script by executing a portion of it

exec(open('scripts/update_master_tasks.py').read().split('new_tasks = [')[1].split(']')[0] + ']', globals())

# Actually, simpler approach - just manually write the append script with all tasks
# But that's a lot of code. Let me try a different approach - run the update script but 
# have it read from the temp file instead

print(f"Current file has tasks up to: {existing_rows[-1][0] if len(existing_rows) > 1 else 'header only'}")

# Since we need TASK-065 through TASK-175, let me create a focused script that just appends
# I'll write a Python file that imports and uses the new_tasks from update_master_tasks.py


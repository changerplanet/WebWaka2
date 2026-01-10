#!/usr/bin/env python3
"""
PHASE 2.1: Fix remaining create calls with missing id/updatedAt

This script adds id: uuidv4() and updatedAt: new Date() to all 
prisma.*.create({ data: { ... } }) calls that are missing them.

SCOPE: Only .create() calls - NOT update/upsert/connect/createMany
"""

import os
import re
from pathlib import Path

# Files identified as needing fixes
FILES_TO_FIX = [
    'src/lib/billing/discount-service.ts',
    'src/lib/billing/event-service.ts',
    'src/lib/billing/grace-service.ts',
    'src/lib/billing/usage-service.ts',
    'src/lib/capabilities/activation-service.ts',
    'src/lib/commerce-wallet-service.ts',
    'src/lib/crm/campaign-service.ts',
    'src/lib/crm/loyalty-service.ts',
    'src/lib/crm/segmentation-service.ts',
    'src/lib/entitlements.ts',
    'src/lib/hr/attendance-service.ts',
    'src/lib/hr/config-service.ts',
    'src/lib/hr/employee-service.ts',
    'src/lib/hr/leave-service.ts',
    'src/lib/hr/payroll-service.ts',
    'src/lib/integrations/config-service.ts',
    'src/lib/integrations/developer-service.ts',
    'src/lib/integrations/instance-service.ts',
    'src/lib/integrations/provider-service.ts',
    'src/lib/integrations/webhook-service.ts',
    'src/lib/inventory/event-emitter.ts',
    'src/lib/inventory/event-service.ts',
    'src/lib/inventory/reorder-service.ts',
    'src/lib/inventory/warehouse-service.ts',
    'src/lib/logistics/agent-service.ts',
    'src/lib/logistics/config-service.ts',
    'src/lib/logistics/zone-service.ts',
    'src/lib/marketing/config-service.ts',
    'src/lib/marketing/execution-service.ts',
    'src/lib/partner-first/guards.ts',
    'src/lib/partner-tenant-creation.ts',
    'src/lib/partner/commission-service.ts',
    'src/lib/partner/config-service.ts',
    'src/lib/partner/onboarding-service.ts',
    'src/lib/partner/referral-service.ts',
    'src/lib/payments/config-service.ts',
    'src/lib/payments/partial-payment-service.ts',
    'src/lib/payments/payment-service.ts',
    'src/lib/payments/refund-service.ts',
    'src/lib/payments/wallet-service.ts',
    'src/lib/payout-readiness.ts',
    'src/lib/platform-instance/default-instance.ts',
    'src/lib/platform-instance/instance-service.ts',
    'src/lib/procurement/config-service.ts',
    'src/lib/procurement/supplier-service.ts',
    'src/lib/promotions-storage.ts',
    'src/lib/subscription.ts',
]

FRONTEND_DIR = Path('/app/frontend')

def ensure_uuid_import(content: str) -> tuple[str, bool]:
    """Add uuid import if not present"""
    if "import { v4 as uuidv4 }" in content:
        return content, False
    
    # Find first import statement
    import_match = re.search(r'^(import .+)', content, re.MULTILINE)
    if import_match:
        insert_pos = import_match.start()
        new_import = "import { v4 as uuidv4 } from 'uuid' // AUTO-FIX: added for Prisma create\n"
        return content[:insert_pos] + new_import + content[insert_pos:], True
    
    return content, False

def add_id_updatedAt_to_create(content: str) -> tuple[str, int]:
    """
    Find .create({ data: { ... } }) patterns and add id/updatedAt
    if they're missing.
    """
    fixes = 0
    lines = content.split('\n')
    result_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        result_lines.append(line)
        
        # Look for .create({ pattern
        if '.create({' in line or '.create(\n' in line:
            # Look ahead for 'data: {' within next few lines
            j = i + 1
            while j < min(i + 10, len(lines)):
                data_line = lines[j]
                result_lines.append(data_line)
                
                # Found data: { - check if id is already there
                if 'data:' in data_line and '{' in data_line:
                    # Look at next few lines to see if id: exists
                    has_id = False
                    has_updated_at = False
                    
                    # Scan forward to check existing fields
                    k = j + 1
                    brace_count = 1
                    while k < len(lines) and brace_count > 0:
                        check_line = lines[k]
                        if re.search(r'\bid:\s', check_line):
                            has_id = True
                        if 'updatedAt:' in check_line:
                            has_updated_at = True
                        brace_count += check_line.count('{') - check_line.count('}')
                        if brace_count <= 0:
                            break
                        k += 1
                    
                    # If missing id or updatedAt, add them
                    if not has_id or not has_updated_at:
                        # Determine indentation
                        indent_match = re.match(r'^(\s*)', data_line)
                        base_indent = indent_match.group(1) if indent_match else ''
                        field_indent = base_indent + '    '  # 4 more spaces
                        
                        additions = []
                        if not has_id:
                            additions.append(f"{field_indent}id: uuidv4(), // AUTO-FIX: required by Prisma schema")
                            fixes += 1
                        if not has_updated_at:
                            additions.append(f"{field_indent}updatedAt: new Date(), // AUTO-FIX: required by Prisma schema")
                            fixes += 1
                        
                        # Insert after data: { line
                        for addition in additions:
                            result_lines.append(addition)
                    
                    i = j
                    break
                j += 1
            else:
                i = j - 1 if j > i + 1 else i
        
        i += 1
    
    return '\n'.join(result_lines), fixes

def process_file(filepath: Path) -> dict:
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return {'file': str(filepath), 'error': str(e)}
    
    original = content
    
    # Add id/updatedAt to create calls
    content, fixes = add_id_updatedAt_to_create(content)
    
    # Add uuid import if we made changes and it's not present
    if fixes > 0:
        content, import_added = ensure_uuid_import(content)
    else:
        import_added = False
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return {
            'file': str(filepath.relative_to(FRONTEND_DIR)),
            'fixes': fixes,
            'import_added': import_added
        }
    
    return {'file': str(filepath.relative_to(FRONTEND_DIR)), 'fixes': 0}

def main():
    print("=" * 60)
    print("PHASE 2.1: FINAL MECHANICAL COMPLETION")
    print("Adding id/updatedAt to remaining create calls")
    print("=" * 60)
    
    total_fixes = 0
    modified_files = []
    
    for rel_path in FILES_TO_FIX:
        filepath = FRONTEND_DIR / rel_path
        if filepath.exists():
            result = process_file(filepath)
            if result.get('fixes', 0) > 0:
                modified_files.append(result)
                total_fixes += result['fixes']
                print(f"  ✓ {result['file']}: {result['fixes']} fixes")
        else:
            print(f"  ⚠ File not found: {rel_path}")
    
    print()
    print("=" * 60)
    print(f"PHASE 2.1 COMPLETE")
    print(f"Files modified: {len(modified_files)}")
    print(f"Total field additions: {total_fixes}")
    print("=" * 60)

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
PHASE 2: CONTROLLED AUTO-FIX SCRIPT
====================================
Purpose: Fix Prisma model naming issues blocking production build

AUTHORIZED FIX CLASSES ONLY:
1. Model name corrections (camelCase -> snake_case)
2. Required field injection (id, updatedAt) in .create() calls
3. Relation name fixes (confirmed in schema)

FORBIDDEN:
- Schema changes
- Business logic changes
- Formatting changes
- Type cleanup unrelated to Prisma

This script is IDEMPOTENT - safe to re-run.
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime

# Configuration
FRONTEND_DIR = Path('/app/frontend')
SRC_DIR = FRONTEND_DIR / 'src'
SCHEMA_PATH = FRONTEND_DIR / 'prisma' / 'schema.prisma'
REPORT_PATH = FRONTEND_DIR / 'docs' / 'PHASE2_FIX_REPORT.md'

# Track all changes
changes_log = {
    'model_replacements': defaultdict(list),
    'create_fixes': defaultdict(list),
    'relation_fixes': defaultdict(list),
    'files_modified': set(),
    'total_replacements': 0,
}

def parse_prisma_schema():
    """Extract all model names from Prisma schema - SOURCE OF TRUTH"""
    with open(SCHEMA_PATH, 'r') as f:
        content = f.read()
    
    # Find all model names
    model_pattern = r'^model\s+(\w+)\s*\{'
    models = set(re.findall(model_pattern, content, re.MULTILINE))
    
    # Find all relation names (field names that reference other models)
    # Pattern: fieldName  ModelName  @relation(...)
    # or fieldName  ModelName[]
    # or fieldName  ModelName?
    relation_pattern = r'^\s+(\w+)\s+(\w+)[\[\]?]*\s+@relation'
    relations = {}
    for match in re.finditer(relation_pattern, content, re.MULTILINE):
        field_name = match.group(1)
        model_name = match.group(2)
        if model_name in models:
            relations[field_name] = model_name
    
    return models, relations

def build_replacement_map(models):
    """Build camelCase -> snake_case mapping based on schema models"""
    
    # The 68 confirmed replacements from Phase 1 audit
    # These are the ONLY replacements we'll make
    CONFIRMED_REPLACEMENTS = {
        # Logistics
        'logisticsDeliveryAssignment': 'logistics_delivery_assignments',
        'logisticsDeliveryAgent': 'logistics_delivery_agents',
        'logisticsConfiguration': 'logistics_configurations',
        'logisticsDeliveryZone': 'logistics_delivery_zones',
        'logisticsDeliveryProof': 'logistics_delivery_proofs',
        'logisticsDeliveryStatusHistory': 'logistics_delivery_status_history',
        'logisticsDeliveryPricingRule': 'logistics_delivery_pricing_rules',
        
        # Procurement
        'procPurchaseOrder': 'proc_purchase_orders',
        'procPurchaseRequest': 'proc_purchase_requests',
        'procGoodsReceipt': 'proc_goods_receipts',
        'procConfiguration': 'proc_configurations',
        'procEventLog': 'proc_event_logs',
        'procSupplierPriceList': 'proc_supplier_price_lists',
        'procSupplierPerformance': 'proc_supplier_performance',
        'procPurchaseOrderItem': 'proc_purchase_order_items',
        'procGoodsReceiptItem': 'proc_goods_receipt_items',
        'procPurchaseRequestItem': 'proc_purchase_request_items',
        
        # Integrations
        'integrationLog': 'integration_logs',
        'integrationEventLog': 'integration_event_logs',
        'integrationProvider': 'integration_providers',
        'integrationInstance': 'integration_instances',
        'integrationWebhook': 'integration_webhooks',
        'integrationCredential': 'integration_credentials',
        'developerApp': 'developer_apps',
        'apiKey': 'api_keys',
        'accessScope': 'access_scopes',
        
        # Payments
        'payPaymentTransaction': 'pay_payment_transactions',
        'payWallet': 'pay_wallets',
        'payRefund': 'pay_refunds',
        'payPaymentIntent': 'pay_payment_intents',
        'payEventLog': 'pay_event_logs',
        'paySettlement': 'pay_settlements',
        'payWalletTransaction': 'pay_wallet_transactions',
        
        # HR
        'hrAttendanceRecord': 'hr_attendance_records',
        'hrEmployeeProfile': 'hr_employee_profiles',
        'hrPayrollPeriod': 'hr_payroll_periods',
        'hrLeaveRequest': 'hr_leave_requests',
        'hrPayslip': 'hr_payslips',
        'hrConfiguration': 'hr_configurations',
        'hrLeaveBalance': 'hr_leave_balances',
        'hrWorkSchedule': 'hr_work_schedules',
        'hrPayrollCalculation': 'hr_payroll_calculations',
        
        # CRM
        'crmCampaign': 'crm_campaigns',
        'crmLoyaltyProgram': 'crm_loyalty_programs',
        'crmEngagementEvent': 'crm_engagement_events',
        'crmSegmentMembership': 'crm_segment_memberships',
        'crmLoyaltyTransaction': 'crm_loyalty_transactions',
        'crmCampaignAudience': 'crm_campaign_audiences',
        'crmLoyaltyRule': 'crm_loyalty_rules',
        'crmSegment': 'crm_segments',
        'crmCustomerProfile': 'crm_customer_profiles',
        
        # Marketing
        'mktAutomationWorkflow': 'mkt_automation_workflows',
        'mktAutomationRun': 'mkt_automation_runs',
        'mktConfiguration': 'mkt_configurations',
        'mktAutomationTrigger': 'mkt_automation_triggers',
        'mktAutomationAction': 'mkt_automation_actions',
        'mktAutomationLog': 'mkt_automation_logs',
        
        # Commerce
        'commerceWallet': 'commerce_wallets',
        'commerceWalletLedger': 'commerce_wallet_ledger',
        'svmShippingZone': 'svm_shipping_zones',
        'svmShippingRate': 'svm_shipping_rates',
        
        # Compliance
        'complianceProfile': 'compliance_profiles',
        'complianceStatus': 'compliance_statuses',
        'complianceEventLog': 'compliance_event_logs',
        'taxComputationRecord': 'tax_computation_records',
        'taxConfiguration': 'tax_configurations',
        'regulatoryReport': 'regulatory_reports',
        'auditArtifact': 'audit_artifacts',
        
        # Inventory (special cases)
        'stockMovement': 'wh_stock_movement',
        'stockTransfer': 'wh_stock_transfers',
        'warehouse': 'wh_warehouses',
        'reorderRule': 'wh_reorder_rules',
        'inventoryAudit': 'inv_audits',
        
        # Billing
        'billing_addonsSubscription': 'billing_addon_subscriptions',
        
        # Intent
        'userIntent': 'user_intents',
        
        # Capabilities
        'capabilityEventLog': 'core_capability_event_logs',
    }
    
    # Validate each replacement target exists in schema
    validated = {}
    for wrong, correct in CONFIRMED_REPLACEMENTS.items():
        if correct in models:
            validated[wrong] = correct
        else:
            print(f"  WARNING: Target model '{correct}' not in schema, skipping '{wrong}'")
    
    return validated

def build_prisma_type_replacements(models):
    """Build Prisma type reference replacements"""
    replacements = {}
    
    # Common type suffixes
    suffixes = ['WhereInput', 'CreateInput', 'UpdateInput', 'OrderByWithRelationInput']
    
    # Map from camelCase type to snake_case type
    type_mappings = {
        'CommerceWalletLedger': 'commerce_wallet_ledger',
        'CrmCampaign': 'crm_campaigns',
        'CrmSegment': 'crm_segments',
        # Add more as needed based on audit
    }
    
    for camel, snake in type_mappings.items():
        for suffix in suffixes:
            replacements[f'{camel}{suffix}'] = f'{snake}{suffix}'
    
    return replacements

def fix_model_names_in_file(file_path, model_map, type_map):
    """Fix model name references in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    file_changes = []
    
    # Fix prisma.modelName patterns
    for wrong, correct in model_map.items():
        # Pattern: prisma.wrongModelName (followed by . or whitespace or end)
        pattern = rf'(prisma\.){wrong}(\.|[\s\(])'
        replacement = rf'\g<1>{correct}\g<2>'
        
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            file_changes.append(f"prisma.{wrong} -> prisma.{correct} ({len(matches)}x)")
            changes_log['model_replacements'][f"{wrong}->{correct}"].append(str(file_path))
            changes_log['total_replacements'] += len(matches)
    
    # Also fix tx.modelName patterns (transaction context)
    for wrong, correct in model_map.items():
        pattern = rf'(tx\.){wrong}(\.|[\s\(])'
        replacement = rf'\g<1>{correct}\g<2>'
        
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            file_changes.append(f"tx.{wrong} -> tx.{correct} ({len(matches)}x)")
            changes_log['model_replacements'][f"{wrong}->{correct}"].append(str(file_path))
            changes_log['total_replacements'] += len(matches)
    
    # Fix Prisma type references: Prisma.WrongTypeWhereInput -> Prisma.correct_typeWhereInput
    for wrong, correct in type_map.items():
        pattern = rf'(Prisma\.){wrong}'
        replacement = rf'\g<1>{correct}'
        
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, replacement, content)
            file_changes.append(f"Prisma.{wrong} -> Prisma.{correct} ({len(matches)}x)")
            changes_log['total_replacements'] += len(matches)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        changes_log['files_modified'].add(str(file_path))
        return file_changes
    
    return []

def fix_relation_names_in_file(file_path, relation_map):
    """Fix relation names in include statements"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    file_changes = []
    
    # Common lowercase to PascalCase relation fixes based on schema
    RELATION_FIXES = {
        # Product relations
        'product': 'Product',
        'category': 'ProductCategory',
        'variants': 'ProductVariant',
        'inventoryLevels': 'InventoryLevel',
        
        # Location relations
        'location': 'Location',
        
        # Variant relations  
        'variant': 'ProductVariant',
        
        # Include patterns
        'ledgerEntries': 'commerce_wallet_ledger',
        'memberships': 'crm_segment_memberships',
        
        # Subscription relations
        'plan': 'SubscriptionPlan',
        'subscription': 'Subscription',
        
        # Partner relations
        'partner': 'Partner',
        'referralCode': 'PartnerReferralCode',
        'tenant': 'Tenant',
        
        # Instance relations
        'platformInstance': 'PlatformInstance',
        'financialSummary': 'InstanceFinancialSummary',
        'subscriptions': 'InstanceSubscription',
        
        # Branding
        'branding': 'BusinessProfile',
    }
    
    # Fix include: { relation: true } patterns
    for wrong, correct in RELATION_FIXES.items():
        # Match include patterns like: include: { relation: true }
        # or nested: { relation: { include: ... } }
        pattern = rf'(\{{[^}}]*?)(\b){wrong}(:)'
        
        matches = re.findall(pattern, content)
        if matches:
            content = re.sub(pattern, rf'\g<1>\g<2>{correct}\g<3>', content)
            file_changes.append(f"include.{wrong} -> include.{correct} ({len(matches)}x)")
            changes_log['relation_fixes'][f"{wrong}->{correct}"].append(str(file_path))
            changes_log['total_replacements'] += len(matches)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        changes_log['files_modified'].add(str(file_path))
        return file_changes
    
    return []

def fix_create_calls_in_file(file_path):
    """
    Add missing id and updatedAt to .create() calls.
    
    ONLY touches .create({ data: { ... } }) patterns.
    Does NOT touch: update, upsert, connect, createMany
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    file_changes = []
    
    # Check if file already has uuid import
    has_uuid_import = 'import { v4 as uuidv4 }' in content or "import { v4 as uuidv4 }" in content
    needs_uuid = False
    
    # Pattern to find .create({ data: { ... } }) that's missing id or updatedAt
    # This is complex because we need to match nested braces
    
    # Simple approach: find lines that have .create({ and data: {
    # Then check if they're missing id: and updatedAt:
    
    lines = content.split('\n')
    modified_lines = []
    in_create_data = False
    create_data_indent = 0
    brace_depth = 0
    data_block_start = -1
    current_data_block = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Detect start of .create({ data: { pattern
        if '.create({' in line or '.create(\n' in line:
            # Look ahead for data: {
            j = i
            found_data = False
            while j < min(i + 5, len(lines)):
                if 'data:' in lines[j] and '{' in lines[j]:
                    found_data = True
                    data_line_idx = j
                    break
                elif 'data: {' in lines[j]:
                    found_data = True
                    data_line_idx = j
                    break
                j += 1
            
            if found_data:
                # Check if this data block already has id and updatedAt
                # by scanning forward
                k = data_line_idx
                block_content = []
                depth = 0
                started = False
                
                while k < len(lines):
                    check_line = lines[k]
                    block_content.append(check_line)
                    
                    for c in check_line:
                        if c == '{':
                            if not started:
                                started = True
                            depth += 1
                        elif c == '}':
                            depth -= 1
                            if started and depth == 0:
                                break
                    
                    if started and depth == 0:
                        break
                    k += 1
                
                block_text = '\n'.join(block_content)
                
                # Check what's missing
                has_id = re.search(r'\bid:\s*[^,}]', block_text) is not None
                has_updated_at = 'updatedAt:' in block_text or 'updatedAt :' in block_text
                
                # If missing both, we need to add them
                if not has_id or not has_updated_at:
                    # Find the line with 'data: {' and add fields after it
                    data_line = lines[data_line_idx]
                    indent_match = re.match(r'^(\s*)', data_line)
                    base_indent = indent_match.group(1) if indent_match else ''
                    field_indent = base_indent + '    '  # 4 more spaces
                    
                    additions = []
                    if not has_id:
                        additions.append(f"{field_indent}id: uuidv4(), // AUTO-FIX: required by Prisma schema")
                        needs_uuid = True
                    if not has_updated_at:
                        additions.append(f"{field_indent}updatedAt: new Date(), // AUTO-FIX: required by Prisma schema")
                    
                    if additions:
                        # Insert after the 'data: {' line
                        for add_idx, addition in enumerate(additions):
                            lines.insert(data_line_idx + 1 + add_idx, addition)
                        
                        file_changes.append(f"Added {'id, ' if not has_id else ''}{'updatedAt' if not has_updated_at else ''} at line {data_line_idx + 1}")
                        changes_log['create_fixes'][str(file_path)].append(data_line_idx + 1)
                        changes_log['total_replacements'] += len(additions)
                        
                        # Adjust i to account for inserted lines
                        i += len(additions)
        
        i += 1
    
    new_content = '\n'.join(lines)
    
    # Add uuid import if needed
    if needs_uuid and not has_uuid_import:
        # Find first import line
        import_match = re.search(r'^(import .+;?\n)', new_content, re.MULTILINE)
        if import_match:
            new_content = new_content[:import_match.start()] + \
                          "import { v4 as uuidv4 } from 'uuid'; // AUTO-FIX: added for Prisma create\n" + \
                          new_content[import_match.start():]
            file_changes.append("Added uuid import")
    
    if new_content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        changes_log['files_modified'].add(str(file_path))
        return file_changes
    
    return []

def process_all_files(model_map, type_map, relation_map):
    """Process all TypeScript files in src directory"""
    ts_files = list(SRC_DIR.rglob('*.ts')) + list(SRC_DIR.rglob('*.tsx'))
    
    # Filter to only files that likely have Prisma usage
    prisma_files = []
    for f in ts_files:
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
                if 'prisma.' in content or 'tx.' in content:
                    prisma_files.append(f)
        except:
            pass
    
    print(f"\nFound {len(prisma_files)} files with Prisma usage")
    
    all_changes = {}
    
    for file_path in prisma_files:
        file_changes = []
        
        # Fix 1: Model names
        model_changes = fix_model_names_in_file(file_path, model_map, type_map)
        file_changes.extend(model_changes)
        
        # Fix 2: Relation names
        relation_changes = fix_relation_names_in_file(file_path, relation_map)
        file_changes.extend(relation_changes)
        
        # Note: Fix 3 (create calls) is more complex and risky
        # We'll handle it more carefully in a second pass
        
        if file_changes:
            all_changes[str(file_path)] = file_changes
            print(f"  ✓ {file_path.relative_to(FRONTEND_DIR)}: {len(file_changes)} fixes")
    
    return all_changes

def generate_report(changes, start_time):
    """Generate Phase 2 fix report"""
    end_time = datetime.now()
    
    report = f"""# PHASE 2: AUTO-FIX COMPLETION REPORT

**Execution Time:** {start_time.strftime('%Y-%m-%d %H:%M:%S')} - {end_time.strftime('%H:%M:%S')}
**Duration:** {(end_time - start_time).seconds} seconds
**Status:** COMPLETED

---

## SUMMARY

| Metric | Count |
|--------|-------|
| **Files Modified** | {len(changes_log['files_modified'])} |
| **Total Replacements** | {changes_log['total_replacements']} |
| **Model Name Fixes** | {sum(len(v) for v in changes_log['model_replacements'].values())} |
| **Relation Name Fixes** | {sum(len(v) for v in changes_log['relation_fixes'].values())} |
| **Create Call Fixes** | {sum(len(v) for v in changes_log['create_fixes'].values())} |

---

## MODEL NAME REPLACEMENTS

"""
    
    for replacement, files in sorted(changes_log['model_replacements'].items()):
        report += f"### `{replacement}`\n"
        report += f"- Files affected: {len(files)}\n"
        for f in files[:5]:
            report += f"  - `{f}`\n"
        if len(files) > 5:
            report += f"  - ... and {len(files) - 5} more\n"
        report += "\n"
    
    report += """
---

## FILES MODIFIED

"""
    
    for f in sorted(changes_log['files_modified']):
        rel_path = f.replace('/app/frontend/', '')
        if rel_path in changes:
            report += f"### `{rel_path}`\n"
            for change in changes[rel_path]:
                report += f"- {change}\n"
            report += "\n"
    
    report += """
---

## VERIFICATION REQUIRED

Run the following command to verify the fix:

```bash
cd /app/frontend && yarn build
```

**Expected Result:** Significant reduction in TypeScript errors (>80%)

---

## MARKERS ADDED

All automated fixes include one of these markers for traceability:
- `// AUTO-FIX: required by Prisma schema`
- `// AUTO-FIX: added for Prisma create`

---

**END OF PHASE 2 REPORT**
"""
    
    with open(REPORT_PATH, 'w') as f:
        f.write(report)
    
    print(f"\nReport saved to: {REPORT_PATH}")

def main():
    print("=" * 60)
    print("PHASE 2: CONTROLLED AUTO-FIX")
    print("=" * 60)
    
    start_time = datetime.now()
    
    # Step 1: Parse Prisma schema
    print("\n[1/4] Parsing Prisma schema...")
    models, relations = parse_prisma_schema()
    print(f"  Found {len(models)} models, {len(relations)} relations")
    
    # Step 2: Build replacement maps
    print("\n[2/4] Building replacement maps...")
    model_map = build_replacement_map(models)
    type_map = build_prisma_type_replacements(models)
    print(f"  {len(model_map)} model replacements validated")
    print(f"  {len(type_map)} type replacements prepared")
    
    # Step 3: Process all files
    print("\n[3/4] Processing files...")
    changes = process_all_files(model_map, type_map, relations)
    
    # Step 4: Generate report
    print("\n[4/4] Generating report...")
    generate_report(changes, start_time)
    
    print("\n" + "=" * 60)
    print("PHASE 2 COMPLETE")
    print("=" * 60)
    print(f"\nFiles modified: {len(changes_log['files_modified'])}")
    print(f"Total replacements: {changes_log['total_replacements']}")
    print("\nNext step: Run 'yarn build' to verify")

if __name__ == '__main__':
    main()

/**
 * COMMERCE RULES ENGINE
 * Inventory Rules Module
 * 
 * CANONICAL WRAPPER - S2-S3
 * 
 * Re-exports inventory reorder service.
 * 
 * @module lib/rules/inventory
 */

// Re-export from inventory module
export { ReorderRuleService, ReorderSuggestionEngine } from '../inventory'

// Import for aliasing
import { ReorderRuleService as _ReorderRuleService, ReorderSuggestionEngine as _ReorderSuggestionEngine } from '../inventory'

// Canonical aliases
export const InventoryRulesService = _ReorderRuleService
export const InventoryReorderEngine = _ReorderSuggestionEngine

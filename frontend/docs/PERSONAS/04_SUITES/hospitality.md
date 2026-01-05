# Suite-Specific Personas: Hospitality
## WebWaka Platform - Persona Extraction Document 04
**Extraction Date:** January 5, 2026  
**Document Type:** EXTRACTION ONLY (No Creation)

---

## Hospitality Suite Overview

**Capabilities:** `hotel_rooms`, `hotel_reservations`

**Note:** Hospitality capabilities are registered but marked as `status: 'planned'` in the capability registry.

---

## Planned Capabilities

### hotel_rooms
- Manage room inventory
- Domain: `hospitality`

### hotel_reservations
- Manage reservations
- Dependencies: `hotel_rooms`
- Domain: `hospitality`

---

## Potential Personas (Not Yet Implemented)

Based on capability names, the following personas would apply when implemented:

| Role | Type | Description |
|------|------|-------------|
| Hotel Admin | Internal | Full hotel management |
| Front Desk | Internal | Check-in/out, reservations |
| Housekeeping | Internal | Room status updates |
| Guest | External | Make/view reservations |

**Note:** These personas are NOT currently implemented.

---

**Document Status:** EXTRACTION COMPLETE  
**Note:** Hospitality suite is PLANNED, not implemented.

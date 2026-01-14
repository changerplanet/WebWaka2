# Sites & Funnels Form Builder

**Phase E1.3: Schema-Driven Forms with Payment Integration**

This document describes the form builder system for Sites & Funnels, enabling lead capture and payment-enabled forms across websites and funnels.

## Overview

The Form Builder is a schema-driven system that allows Partners to create forms without drag-and-drop builders. Forms are defined using JSON schemas and can optionally integrate with the Payment Execution Layer (E1.2) for collecting payments.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC WEBSITE / FUNNEL                  │
│  Renders forms based on schema, collects submissions        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FORMS API (E1.3)                         │
│  • /api/sites-funnels/forms - CRUD for forms                │
│  • /api/sites-funnels/forms/submit - Handle submissions     │
│  • /api/sites-funnels/forms/public - Public form fetch      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FORM SERVICES (E1.3)                     │
│  • FormService - Create, update, list forms                 │
│  • SubmissionService - Handle submissions + payments        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               PAYMENT EXECUTION (E1.2)                       │
│  • PaymentExecutionService - Process payments               │
│  • Only used when form.paymentEnabled = true                │
└─────────────────────────────────────────────────────────────┘
```

## Form Schema Structure

Forms are defined using a JSON schema with field definitions:

```typescript
interface FormSchema {
  fields: FormFieldDefinition[]
  version?: string
}

interface FormFieldDefinition {
  id: string           // Unique field identifier
  type: FormFieldType  // text, email, phone, select, etc.
  name: string         // Field name for submission data
  label: string        // Display label
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean
  options?: SelectOption[]  // For select, radio, checkbox
  validation?: ValidationRule[]
  width?: 'full' | 'half' | 'third'
  order: number
}
```

### Supported Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `email` | Email address with validation |
| `phone` | Phone number input |
| `number` | Numeric input |
| `textarea` | Multi-line text |
| `select` | Dropdown selection |
| `radio` | Radio button group |
| `checkbox` | Checkbox (single or group) |
| `date` | Date picker |
| `time` | Time picker |
| `url` | URL input |
| `hidden` | Hidden field |

### Validation Rules

```typescript
interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'phone'
  value?: string | number | boolean
  message?: string
}
```

## API Endpoints

### Forms Management (Authenticated)

**GET /api/sites-funnels/forms**

List forms for a tenant.

Query Parameters:
- `action`: `list` | `get` | `get-by-slug`
- `tenantId`: Tenant ID
- `formId`: Form ID (for `get`)
- `slug`: Form slug (for `get-by-slug`)
- `status`: Filter by status (DRAFT, ACTIVE, PAUSED, ARCHIVED)
- `siteId`: Filter by site
- `funnelId`: Filter by funnel
- `search`: Search by name/description
- `includeDemo`: Include demo forms (default: false)
- `page`, `limit`: Pagination

**POST /api/sites-funnels/forms**

Manage forms.

Actions:
- `create`: Create a new form
- `update`: Update form settings
- `delete`: Delete a form
- `activate`: Activate a form (make it public)
- `pause`: Pause a form
- `archive`: Archive a form

### Public Form Access (No Auth Required)

**GET /api/sites-funnels/forms/public?formId=xxx**

Fetch an active form for public rendering.

Response:
```json
{
  "success": true,
  "form": {
    "id": "form-123",
    "name": "Contact Form",
    "schema": { "fields": [...] },
    "submitButtonText": "Send Message",
    "paymentEnabled": false,
    "paymentAvailable": false,
    "styling": null,
    "tenantId": "tenant-456"
  }
}
```

### Form Submission (No Auth Required)

**POST /api/sites-funnels/forms/submit**

Submit a form.

Request:
```json
{
  "formId": "form-123",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello!"
  },
  "callbackUrl": "https://site.com/thank-you"
}
```

Response (non-payment form):
```json
{
  "success": true,
  "submissionId": "sub-789",
  "status": "COMPLETED",
  "paymentRequired": false,
  "message": "Form submitted successfully"
}
```

Response (payment form):
```json
{
  "success": true,
  "submissionId": "sub-789",
  "status": "PAYMENT_PENDING",
  "paymentRequired": true,
  "paymentUrl": "https://checkout.paystack.com/xxx",
  "paymentReference": "TXN-ABC123"
}
```

### Submissions Management (Authenticated)

**GET /api/sites-funnels/forms/submissions**

List form submissions.

Query Parameters:
- `tenantId`: Tenant ID
- `formId`: Filter by form
- `status`: Filter by status
- `email`: Filter by submitter email
- `includeDemo`: Include demo submissions
- `fromDate`, `toDate`: Date range
- `page`, `limit`: Pagination

## Example Form Schemas

### Contact Form

```json
{
  "fields": [
    {
      "id": "name",
      "type": "text",
      "name": "name",
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "validation": [{ "type": "required", "message": "Name is required" }],
      "width": "full",
      "order": 1
    },
    {
      "id": "email",
      "type": "email",
      "name": "email",
      "label": "Email Address",
      "validation": [
        { "type": "required", "message": "Email is required" },
        { "type": "email", "message": "Please enter a valid email" }
      ],
      "width": "half",
      "order": 2
    },
    {
      "id": "phone",
      "type": "phone",
      "name": "phone",
      "label": "Phone Number",
      "width": "half",
      "order": 3
    },
    {
      "id": "message",
      "type": "textarea",
      "name": "message",
      "label": "Message",
      "validation": [{ "type": "required" }],
      "width": "full",
      "order": 4
    }
  ],
  "version": "1.0.0"
}
```

### Event Registration Form (with Payment)

```json
{
  "fields": [
    {
      "id": "fullName",
      "type": "text",
      "name": "fullName",
      "label": "Full Name",
      "validation": [{ "type": "required" }],
      "order": 1
    },
    {
      "id": "email",
      "type": "email",
      "name": "email",
      "label": "Email Address",
      "validation": [
        { "type": "required" },
        { "type": "email" }
      ],
      "order": 2
    },
    {
      "id": "phone",
      "type": "phone",
      "name": "phone",
      "label": "Phone Number",
      "validation": [{ "type": "required" }],
      "order": 3
    },
    {
      "id": "category",
      "type": "select",
      "name": "category",
      "label": "Registration Category",
      "options": [
        { "label": "Regular - ₦5,000", "value": "regular" },
        { "label": "VIP - ₦15,000", "value": "vip" },
        { "label": "Student - ₦2,500", "value": "student" }
      ],
      "validation": [{ "type": "required" }],
      "order": 4
    }
  ]
}
```

## Payment Integration

Forms can optionally require payment before the submission is considered complete.

### Enabling Payments

When creating/updating a form, set:

```json
{
  "paymentEnabled": true,
  "paymentAmount": 5000,
  "paymentCurrency": "NGN",
  "paymentDescription": "Event Registration Fee"
}
```

### Payment Flow

1. User submits form → Submission created with status `PAYMENT_PENDING`
2. Payment initiated via PaymentExecutionService
3. User redirected to Paystack checkout
4. After payment, verify via `/api/sites-funnels/forms/submit` with `action: verify-payment`
5. On success → Submission status becomes `PAYMENT_COMPLETED`

### Graceful Degradation

If payments are not available (Partner hasn't configured Paystack):
- `paymentAvailable: false` is returned in the public form response
- Frontend should show appropriate message or alternative payment instructions

## Database Schema

### sf_forms

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| tenantId | String | Tenant scope |
| partnerId | String | Partner owner |
| name | String | Form name |
| slug | String | URL-friendly identifier |
| schema | JSON | Form field definitions |
| status | Enum | DRAFT, ACTIVE, PAUSED, ARCHIVED |
| paymentEnabled | Boolean | Payment required |
| paymentAmount | Decimal | Payment amount |
| paymentCurrency | String | Currency code |
| totalSubmissions | Int | Submission count |
| successfulPayments | Int | Paid submission count |
| totalRevenue | Decimal | Total collected |
| isDemo | Boolean | Demo flag |

### sf_form_submissions

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| formId | UUID | Parent form |
| tenantId | String | Tenant scope |
| data | JSON | Submitted field values |
| status | Enum | PENDING, COMPLETED, PAYMENT_* |
| submitterEmail | String | Submitter email |
| submitterName | String | Submitter name |
| paymentTransactionId | String | Links to PaymentTransaction |
| paymentReference | String | Payment reference |
| isDemo | Boolean | Demo flag |

## Demo Mode

Forms marked with `isDemo: true`:
- Submissions can be completed via `POST /api/sites-funnels/forms/submissions` with `action: complete-demo`
- Useful for demonstrations and testing
- Demo submissions excluded by default from listings

## What's NOT Included (Phase E1.3)

Explicitly out of scope:

- ❌ Drag-and-drop form builder UI
- ❌ Email/SMS notifications on submission
- ❌ Form automation workflows
- ❌ File upload fields
- ❌ Multi-page/wizard forms
- ❌ Conditional field logic
- ❌ Form analytics dashboard

These may be addressed in future phases.

## Related Documentation

- [Payment Execution (E1.2)](./PAYMENTS_EXECUTION.md) - Payment processing
- [Paystack Integration (E1.1)](./PAYSTACK_INTEGRATION.md) - Provider setup

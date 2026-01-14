/**
 * Form Builder Types - Phase E1.3
 * 
 * Schema-driven form definitions with optional payment integration
 */

// =============================================================================
// FIELD TYPES
// =============================================================================

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'url'
  | 'hidden'

// =============================================================================
// VALIDATION RULES
// =============================================================================

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'phone'
  value?: string | number | boolean
  message?: string
}

// =============================================================================
// FIELD DEFINITIONS
// =============================================================================

export interface SelectOption {
  label: string
  value: string
}

export interface FormFieldDefinition {
  id: string
  type: FormFieldType
  name: string
  label: string
  placeholder?: string
  helpText?: string
  defaultValue?: string | number | boolean
  options?: SelectOption[] // For select, radio, checkbox
  validation?: ValidationRule[]
  width?: 'full' | 'half' | 'third' // Layout width
  order: number
}

// =============================================================================
// FORM SCHEMA
// =============================================================================

export interface FormSchema {
  fields: FormFieldDefinition[]
  version?: string
}

// =============================================================================
// FORM STYLING
// =============================================================================

export interface FormStyling {
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  borderRadius?: 'none' | 'sm' | 'md' | 'lg'
  spacing?: 'compact' | 'normal' | 'relaxed'
  labelPosition?: 'top' | 'left' | 'floating'
}

// =============================================================================
// FORM STATUS
// =============================================================================

export type FormStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
export type SubmissionStatus = 
  | 'PENDING' 
  | 'COMPLETED' 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_COMPLETED' 
  | 'PAYMENT_FAILED'
  | 'FAILED'

// =============================================================================
// FORM ENTITY
// =============================================================================

export interface Form {
  id: string
  tenantId: string
  partnerId: string
  platformInstanceId?: string | null
  
  name: string
  slug: string
  description?: string | null
  
  schema: FormSchema
  status: FormStatus
  
  submitButtonText: string
  successMessage?: string | null
  successRedirectUrl?: string | null
  
  paymentEnabled: boolean
  paymentAmount?: number | null
  paymentCurrency: string
  paymentDescription?: string | null
  
  styling?: FormStyling | null
  
  totalSubmissions: number
  successfulPayments: number
  totalRevenue: number
  
  siteId?: string | null
  funnelId?: string | null
  pageId?: string | null
  
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string | null
  
  isDemo: boolean
}

// =============================================================================
// FORM SUBMISSION ENTITY
// =============================================================================

export interface FormSubmission {
  id: string
  formId: string
  tenantId: string
  
  data: Record<string, any>
  status: SubmissionStatus
  
  submitterEmail?: string | null
  submitterName?: string | null
  submitterPhone?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  
  paymentRequired: boolean
  paymentAmount?: number | null
  paymentCurrency?: string | null
  paymentTransactionId?: string | null
  paymentReference?: string | null
  paymentStatus?: string | null
  paidAt?: Date | null
  
  createdAt: Date
  completedAt?: Date | null
  
  isDemo: boolean
}

// =============================================================================
// API TYPES
// =============================================================================

export interface CreateFormInput {
  tenantId: string
  partnerId: string
  platformInstanceId?: string
  
  name: string
  slug: string
  description?: string
  
  schema: FormSchema
  
  submitButtonText?: string
  successMessage?: string
  successRedirectUrl?: string
  
  paymentEnabled?: boolean
  paymentAmount?: number
  paymentCurrency?: string
  paymentDescription?: string
  
  styling?: FormStyling
  
  siteId?: string
  funnelId?: string
  pageId?: string
  
  createdBy: string
  isDemo?: boolean
}

export interface UpdateFormInput {
  name?: string
  description?: string
  schema?: FormSchema
  status?: FormStatus
  
  submitButtonText?: string
  successMessage?: string
  successRedirectUrl?: string
  
  paymentEnabled?: boolean
  paymentAmount?: number
  paymentCurrency?: string
  paymentDescription?: string
  
  styling?: FormStyling
  
  siteId?: string
  funnelId?: string
  pageId?: string
  
  updatedBy: string
}

export interface ListFormsOptions {
  status?: FormStatus
  partnerId?: string
  siteId?: string
  funnelId?: string
  search?: string
  includeDemo?: boolean
  page?: number
  limit?: number
}

export interface SubmitFormInput {
  formId: string
  data: Record<string, any>
  
  submitterEmail?: string
  submitterName?: string
  submitterPhone?: string
  
  ipAddress?: string
  userAgent?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  
  callbackUrl?: string // For payment redirect
}

export interface SubmitFormResult {
  success: boolean
  submissionId?: string
  status?: SubmissionStatus
  
  // If payment required
  paymentRequired?: boolean
  paymentUrl?: string
  paymentReference?: string
  
  // If no payment / completed
  redirectUrl?: string
  message?: string
  
  error?: string
}

export interface ListSubmissionsOptions {
  formId?: string
  status?: SubmissionStatus
  submitterEmail?: string
  includeDemo?: boolean
  fromDate?: Date
  toDate?: Date
  page?: number
  limit?: number
}

// =============================================================================
// EXAMPLE FORM SCHEMAS
// =============================================================================

/**
 * Example: Contact Form
 */
export const EXAMPLE_CONTACT_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      id: 'name',
      type: 'text',
      name: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      validation: [{ type: 'required', message: 'Name is required' }],
      width: 'full',
      order: 1
    },
    {
      id: 'email',
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email' }
      ],
      width: 'half',
      order: 2
    },
    {
      id: 'phone',
      type: 'phone',
      name: 'phone',
      label: 'Phone Number',
      placeholder: '08012345678',
      validation: [{ type: 'phone', message: 'Please enter a valid phone number' }],
      width: 'half',
      order: 3
    },
    {
      id: 'message',
      type: 'textarea',
      name: 'message',
      label: 'Message',
      placeholder: 'How can we help you?',
      validation: [
        { type: 'required', message: 'Message is required' },
        { type: 'minLength', value: 10, message: 'Message must be at least 10 characters' }
      ],
      width: 'full',
      order: 4
    }
  ],
  version: '1.0.0'
}

/**
 * Example: Registration Form with Payment
 */
export const EXAMPLE_REGISTRATION_FORM_SCHEMA: FormSchema = {
  fields: [
    {
      id: 'fullName',
      type: 'text',
      name: 'fullName',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      validation: [{ type: 'required', message: 'Name is required' }],
      width: 'full',
      order: 1
    },
    {
      id: 'email',
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email',
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email' }
      ],
      width: 'half',
      order: 2
    },
    {
      id: 'phone',
      type: 'phone',
      name: 'phone',
      label: 'Phone Number',
      placeholder: '08012345678',
      validation: [{ type: 'required', message: 'Phone is required' }],
      width: 'half',
      order: 3
    },
    {
      id: 'category',
      type: 'select',
      name: 'category',
      label: 'Registration Category',
      placeholder: 'Select a category',
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'VIP', value: 'vip' },
        { label: 'Student', value: 'student' }
      ],
      validation: [{ type: 'required', message: 'Please select a category' }],
      width: 'full',
      order: 4
    },
    {
      id: 'specialRequests',
      type: 'textarea',
      name: 'specialRequests',
      label: 'Special Requests (Optional)',
      placeholder: 'Any dietary or accessibility requirements?',
      width: 'full',
      order: 5
    }
  ],
  version: '1.0.0'
}

/**
 * Example: Lead Capture Form
 */
export const EXAMPLE_LEAD_CAPTURE_SCHEMA: FormSchema = {
  fields: [
    {
      id: 'email',
      type: 'email',
      name: 'email',
      label: 'Email Address',
      placeholder: 'Enter your email to get started',
      validation: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Please enter a valid email' }
      ],
      width: 'full',
      order: 1
    },
    {
      id: 'businessType',
      type: 'select',
      name: 'businessType',
      label: 'Business Type',
      options: [
        { label: 'Retail', value: 'retail' },
        { label: 'Services', value: 'services' },
        { label: 'Manufacturing', value: 'manufacturing' },
        { label: 'Other', value: 'other' }
      ],
      width: 'full',
      order: 2
    }
  ],
  version: '1.0.0'
}

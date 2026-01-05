/**
 * SITES & FUNNELS: AI Content Service
 * 
 * AI-assisted content generation with strict guardrails:
 * - AI generates DRAFTS only - never auto-publishes
 * - Partner approval required before any AI content is used
 * - No legal/medical claims generation
 * - All prompts and outputs are logged
 * - Partner can edit/reject any AI suggestion
 * 
 * Part of: Phase 5 - WebWaka Sites & Funnels
 * Created: January 5, 2026
 */

import { prisma } from '../prisma';
import { randomUUID } from 'crypto';
import { canUseAIContent } from './entitlements-service';

// ============================================================================
// TYPES
// ============================================================================

export type AIContentType = 
  | 'headline'
  | 'subheadline'
  | 'body'
  | 'cta'
  | 'bullet_points'
  | 'meta_description'
  | 'meta_title'
  | 'testimonial'
  | 'faq';

export type AIContentStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface AIContentRequest {
  tenantId: string;
  platformInstanceId?: string;
  partnerId: string;
  userId: string;
  
  // Content context
  contentType: AIContentType;
  industry?: string;
  targetAudience?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'urgent' | 'luxury';
  
  // Additional context
  businessName?: string;
  productService?: string;
  keywords?: string[];
  
  // Reference
  siteId?: string;
  funnelId?: string;
  pageId?: string;
}

export interface AIContentResponse {
  success: boolean;
  content?: string;
  logId?: string;
  error?: string;
  remainingQuota?: number;
}

// ============================================================================
// AI GUARDRAILS
// ============================================================================

const PROHIBITED_CONTENT = [
  // Legal claims
  'guaranteed results',
  'legal advice',
  'financial advice',
  'investment returns',
  '100% success',
  
  // Medical claims
  'cure',
  'treat',
  'diagnose',
  'medical advice',
  'prescription',
  
  // Deceptive claims
  'get rich quick',
  'miracle',
  'secret formula',
  'limited time only',
  'act now',
];

const CONTENT_FILTERS = [
  // Remove excessive claims
  /\b(guaranteed|promise|assure|ensure)\s+(results|success|returns)/gi,
  // Remove urgency manipulation
  /\b(limited\s+time|act\s+now|last\s+chance|don't\s+miss)/gi,
  // Remove medical/legal claims
  /\b(cure|treat|diagnose|legal\s+advice|medical\s+advice)/gi,
];

/**
 * Validate and sanitize AI-generated content
 */
function sanitizeContent(content: string): string {
  let sanitized = content;
  
  // Apply content filters
  for (const filter of CONTENT_FILTERS) {
    sanitized = sanitized.replace(filter, '');
  }
  
  // Clean up extra whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Check if content contains prohibited terms
 */
function containsProhibitedContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return PROHIBITED_CONTENT.some(term => lowerContent.includes(term));
}

// ============================================================================
// PROMPT LIBRARY
// ============================================================================

const PROMPT_TEMPLATES: Record<AIContentType, (ctx: AIContentRequest) => string> = {
  headline: (ctx) => `Create a compelling headline for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
Target Audience: ${ctx.targetAudience || 'General audience'}
Tone: ${ctx.tone || 'professional'}
${ctx.keywords?.length ? `Keywords to include: ${ctx.keywords.join(', ')}` : ''}

Requirements:
- Keep it under 10 words
- Make it clear and compelling
- Avoid hype or exaggerated claims
- Focus on value proposition

Generate only the headline text, nothing else.`,

  subheadline: (ctx) => `Create a supporting subheadline for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
Target Audience: ${ctx.targetAudience || 'General audience'}
Tone: ${ctx.tone || 'professional'}

Requirements:
- Keep it under 20 words
- Support and expand on the main headline
- Include a clear benefit
- Avoid hype or exaggerated claims

Generate only the subheadline text, nothing else.`,

  body: (ctx) => `Write body copy for a ${ctx.industry || 'business'} website section.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
Target Audience: ${ctx.targetAudience || 'General audience'}
Tone: ${ctx.tone || 'professional'}
${ctx.keywords?.length ? `Keywords to include naturally: ${ctx.keywords.join(', ')}` : ''}

Requirements:
- 2-3 paragraphs
- Clear and concise
- Focus on benefits
- Include a subtle call to action
- Avoid hype, guarantees, or exaggerated claims
- Do not make medical, legal, or financial claims

Generate only the body text.`,

  cta: (ctx) => `Create a call-to-action button text for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
Tone: ${ctx.tone || 'professional'}

Requirements:
- 2-4 words maximum
- Action-oriented
- Clear value
- Avoid pushy language like "Act Now" or "Limited Time"

Generate only the CTA text, nothing else.`,

  bullet_points: (ctx) => `Create 4-5 bullet points highlighting benefits for a ${ctx.industry || 'business'}.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
Target Audience: ${ctx.targetAudience || 'General audience'}

Requirements:
- Each point should be 5-10 words
- Focus on specific benefits
- Use action verbs
- Avoid exaggerated claims

Generate only the bullet points, one per line with a dash prefix.`,

  meta_description: (ctx) => `Write an SEO meta description for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
${ctx.keywords?.length ? `Keywords: ${ctx.keywords.join(', ')}` : ''}

Requirements:
- 150-160 characters
- Include primary keyword naturally
- Include a value proposition
- Encourage clicks

Generate only the meta description text.`,

  meta_title: (ctx) => `Write an SEO meta title for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}
${ctx.keywords?.length ? `Primary keyword: ${ctx.keywords[0]}` : ''}

Requirements:
- 50-60 characters
- Include primary keyword near the start
- Include brand name if space allows

Generate only the meta title text.`,

  testimonial: (ctx) => `Write a sample testimonial template for a ${ctx.industry || 'business'}.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}

Requirements:
- 2-3 sentences
- Specific but not over-the-top
- Focus on the experience, not results
- Include placeholders like [Customer Name] and [Company]

Note: This is a template. Real testimonials should come from actual customers.

Generate only the testimonial template.`,

  faq: (ctx) => `Create 3 FAQ items for a ${ctx.industry || 'business'} website.
Business: ${ctx.businessName || 'A professional business'}
Product/Service: ${ctx.productService || 'Professional services'}

Requirements:
- Common questions customers might ask
- Clear, helpful answers
- 2-3 sentences per answer
- Avoid making guarantees or promises

Format as:
Q: Question?
A: Answer.

Generate only the FAQ items.`,
};

// ============================================================================
// AI CONTENT GENERATION (Mock Implementation)
// ============================================================================

/**
 * Generate AI content with guardrails
 * NOTE: This is a mock implementation. In production, integrate with actual AI service.
 */
export async function generateAIContent(
  request: AIContentRequest
): Promise<AIContentResponse> {
  try {
    // Check entitlement
    const quotaCheck = await canUseAIContent(request.tenantId);
    if (!quotaCheck.allowed) {
      return { success: false, error: quotaCheck.reason };
    }

    // Build prompt
    const promptTemplate = PROMPT_TEMPLATES[request.contentType];
    if (!promptTemplate) {
      return { success: false, error: 'Invalid content type' };
    }

    const prompt = promptTemplate(request);

    // In production, call actual AI service here
    // For now, generate mock content based on type
    const generatedContent = await mockAIGeneration(request);

    // Sanitize content
    const sanitizedContent = sanitizeContent(generatedContent);

    // Check for prohibited content
    if (containsProhibitedContent(sanitizedContent)) {
      return { 
        success: false, 
        error: 'Generated content contains prohibited claims. Please try again with different parameters.' 
      };
    }

    // Log the generation
    const logId = randomUUID();
    await prisma.sf_ai_content_logs.create({
      data: {
        id: logId,
        tenantId: request.tenantId,
        platformInstanceId: request.platformInstanceId,
        partnerId: request.partnerId,
        promptType: request.contentType,
        prompt: prompt,
        generatedContent: sanitizedContent,
        status: 'pending',
        siteId: request.siteId,
        funnelId: request.funnelId,
        pageId: request.pageId,
        createdBy: request.userId,
        model: 'mock-v1', // Replace with actual model in production
        tokensUsed: prompt.length + sanitizedContent.length, // Approximate
      },
    });

    return {
      success: true,
      content: sanitizedContent,
      logId,
      remainingQuota: (quotaCheck.maxAllowed || 100) - (quotaCheck.usedThisMonth || 0) - 1,
    };
  } catch (error: any) {
    console.error('AI content generation error:', error);
    return { success: false, error: error.message || 'Failed to generate content' };
  }
}

/**
 * Mock AI generation for development
 * Replace with actual AI integration in production
 */
async function mockAIGeneration(request: AIContentRequest): Promise<string> {
  const { contentType, businessName, productService, industry } = request;
  const business = businessName || 'Your Business';
  const product = productService || 'services';

  switch (contentType) {
    case 'headline':
      return `Transform Your ${industry || 'Business'} with ${business}`;
    
    case 'subheadline':
      return `Professional ${product} designed to help you achieve your goals efficiently and effectively.`;
    
    case 'body':
      return `At ${business}, we understand the unique challenges facing ${industry || 'businesses'} today. Our ${product} are designed with your success in mind, providing the tools and support you need to thrive.

We take pride in delivering exceptional quality and personalized attention to every client. Our team of experienced professionals is dedicated to understanding your specific needs and creating solutions that work for you.

Contact us today to learn how we can help you reach your goals.`;
    
    case 'cta':
      return 'Get Started Today';
    
    case 'bullet_points':
      return `- Professional service tailored to your needs
- Experienced team with industry expertise
- Flexible solutions for every budget
- Dedicated support throughout your journey
- Proven track record of client satisfaction`;
    
    case 'meta_description':
      return `${business} offers professional ${product} for ${industry || 'businesses'}. Contact us today to learn how we can help you succeed.`;
    
    case 'meta_title':
      return `${business} | Professional ${product}`;
    
    case 'testimonial':
      return `"Working with ${business} has been a great experience. Their team was professional, responsive, and delivered exactly what we needed. I would recommend them to anyone looking for quality ${product}." - [Customer Name], [Company]`;
    
    case 'faq':
      return `Q: What services does ${business} offer?
A: We offer comprehensive ${product} designed to meet your specific needs. Contact us to learn more about how we can help.

Q: How long does it typically take to see results?
A: The timeline varies depending on your specific situation and goals. We'll work with you to create a realistic timeline during our initial consultation.

Q: What makes ${business} different from other providers?
A: We pride ourselves on personalized service, industry expertise, and a commitment to your success. Every client receives dedicated attention and customized solutions.`;
    
    default:
      return `Professional content for ${business}`;
  }
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve AI-generated content
 */
export async function approveAIContent(
  logId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sf_ai_content_logs.update({
      where: { id: logId },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reject AI-generated content
 */
export async function rejectAIContent(
  logId: string,
  rejectedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sf_ai_content_logs.update({
      where: { id: logId },
      data: {
        status: 'rejected',
        approvedBy: rejectedBy, // Track who rejected
        approvedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Mark AI content as edited (user modified it)
 */
export async function markAIContentEdited(
  logId: string,
  editedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sf_ai_content_logs.update({
      where: { id: logId },
      data: {
        status: 'edited',
        approvedBy: editedBy,
        approvedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get AI content history for a tenant
 */
export async function getAIContentHistory(
  tenantId: string,
  options: {
    status?: AIContentStatus;
    contentType?: AIContentType;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  logs: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { status, contentType, page = 1, limit = 20 } = options;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (contentType) where.promptType = contentType;

  const [logs, total] = await Promise.all([
    prisma.sf_ai_content_logs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sf_ai_content_logs.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

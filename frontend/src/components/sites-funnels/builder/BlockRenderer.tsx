'use client';

/**
 * SITES & FUNNELS: Block Renderer
 * 
 * Renders page blocks in preview and edit modes.
 * 
 * Part of: Phase E2.1 - Visual Page Builder
 * Created: January 14, 2026
 */

import React from 'react';
import { 
  PageBlock, 
  HeroBlock, 
  FeaturesBlock, 
  PricingBlock, 
  TestimonialsBlock, 
  CTABlock, 
  FormBlock, 
  FooterBlock 
} from '@/lib/sites-funnels/builder/types';

// ============================================================================
// HERO BLOCK
// ============================================================================

function HeroBlockRenderer({ block, isEditing, onEdit }: { block: HeroBlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { headline, subheadline, ctaText, ctaLink, ctaSecondaryText, backgroundImage, alignment = 'center' } = block.content;
  
  const alignClass = alignment === 'left' ? 'text-left items-start' : alignment === 'right' ? 'text-right items-end' : 'text-center items-center';
  
  return (
    <section 
      className="relative min-h-[400px] md:min-h-[500px] flex flex-col justify-center py-16 px-4 bg-gradient-to-br from-indigo-600 to-purple-700"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {backgroundImage && <div className="absolute inset-0 bg-black/50" />}
      <div className={`relative z-10 max-w-4xl mx-auto w-full flex flex-col ${alignClass}`}>
        {isEditing ? (
          <input
            type="text"
            value={headline}
            onChange={(e) => onEdit?.({ headline: e.target.value })}
            className="text-3xl md:text-5xl font-bold text-white bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full mb-4"
            placeholder="Enter headline..."
          />
        ) : (
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{headline}</h1>
        )}
        
        {isEditing ? (
          <input
            type="text"
            value={subheadline || ''}
            onChange={(e) => onEdit?.({ subheadline: e.target.value })}
            className="text-lg md:text-xl text-white/90 bg-transparent border-b border-white/20 focus:border-white/50 outline-none w-full mb-8"
            placeholder="Enter subheadline..."
          />
        ) : (
          subheadline && <p className="text-lg md:text-xl text-white/90 mb-8">{subheadline}</p>
        )}
        
        <div className="flex flex-wrap gap-4">
          {ctaText && (
            <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              {isEditing ? (
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => onEdit?.({ ctaText: e.target.value })}
                  className="bg-transparent outline-none text-center w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : ctaText}
            </button>
          )}
          {ctaSecondaryText && (
            <button className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              {ctaSecondaryText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES BLOCK
// ============================================================================

function FeaturesBlockRenderer({ block, isEditing, onEdit }: { block: FeaturesBlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { title, subtitle, features, columns = 3 } = block.content;
  
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onEdit?.({ title: e.target.value })}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none w-full text-center"
            />
          ) : (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          )}
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
        
        <div className={`grid grid-cols-1 ${gridCols} gap-8`}>
          {features.map((feature, index) => (
            <div key={feature.id || index} className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={feature.title}
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[index] = { ...feature, title: e.target.value };
                      onEdit?.({ features: newFeatures });
                    }}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none w-full text-center mb-2"
                  />
                  <textarea
                    value={feature.description}
                    onChange={(e) => {
                      const newFeatures = [...features];
                      newFeatures[index] = { ...feature, description: e.target.value };
                      onEdit?.({ features: newFeatures });
                    }}
                    className="text-gray-600 bg-transparent border border-gray-200 focus:border-indigo-500 outline-none w-full text-center resize-none p-2 rounded"
                    rows={2}
                  />
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING BLOCK
// ============================================================================

function PricingBlockRenderer({ block, isEditing, onEdit }: { block: PricingBlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { title, subtitle, tiers } = block.content;
  
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onEdit?.({ title: e.target.value })}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none w-full text-center"
            />
          ) : (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          )}
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div 
              key={tier.id || index} 
              className={`bg-white rounded-2xl p-8 shadow-lg ${tier.isPopular ? 'ring-2 ring-indigo-600 relative' : ''}`}
            >
              {tier.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                {tier.period && <span className="text-gray-500">{tier.period}</span>}
              </div>
              {tier.description && <p className="text-gray-600 mb-6">{tier.description}</p>}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${tier.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                {tier.ctaText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TESTIMONIALS BLOCK
// ============================================================================

function TestimonialsBlockRenderer({ block, isEditing, onEdit }: { block: TestimonialsBlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { title, subtitle, testimonials, layout = 'grid' } = block.content;
  
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onEdit?.({ title: e.target.value })}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none w-full text-center"
            />
          ) : (
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          )}
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id || index} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  {testimonial.role && (
                    <p className="text-sm text-gray-500">
                      {testimonial.role}{testimonial.company && `, ${testimonial.company}`}
                    </p>
                  )}
                </div>
              </div>
              {isEditing ? (
                <textarea
                  value={testimonial.quote}
                  onChange={(e) => {
                    const newTestimonials = [...testimonials];
                    newTestimonials[index] = { ...testimonial, quote: e.target.value };
                    onEdit?.({ testimonials: newTestimonials });
                  }}
                  className="text-gray-600 italic bg-transparent border border-gray-200 focus:border-indigo-500 outline-none w-full p-2 rounded resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA BLOCK
// ============================================================================

function CTABlockRenderer({ block, isEditing, onEdit }: { block: CTABlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { headline, subheadline, ctaText, ctaSecondaryText, backgroundStyle = 'gradient' } = block.content;
  
  const bgClass = backgroundStyle === 'solid' ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600';
  
  return (
    <section className={`py-16 px-4 ${bgClass}`}>
      <div className="max-w-4xl mx-auto text-center">
        {isEditing ? (
          <input
            type="text"
            value={headline}
            onChange={(e) => onEdit?.({ headline: e.target.value })}
            className="text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-white/30 focus:border-white outline-none w-full text-center mb-4"
          />
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{headline}</h2>
        )}
        
        {subheadline && <p className="text-xl text-white/90 mb-8">{subheadline}</p>}
        
        <div className="flex flex-wrap justify-center gap-4">
          {ctaText && (
            <button className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              {ctaText}
            </button>
          )}
          {ctaSecondaryText && (
            <button className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
              {ctaSecondaryText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FORM BLOCK (Integrates with E1.3 Forms)
// ============================================================================

function FormBlockRenderer({ block, isEditing, onEdit, availableForms }: { 
  block: FormBlock; 
  isEditing?: boolean; 
  onEdit?: (content: any) => void;
  availableForms?: Array<{ id: string; name: string; description?: string }>;
}) {
  const { title, description, formId, submitText = 'Submit' } = block.content;
  
  const selectedForm = availableForms?.find(f => f.id === formId);
  
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {isEditing ? (
            <input
              type="text"
              value={title || ''}
              onChange={(e) => onEdit?.({ title: e.target.value })}
              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-indigo-500 outline-none w-full text-center mb-4"
              placeholder="Form Title"
            />
          ) : (
            title && <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">{title}</h2>
          )}
          
          {isEditing ? (
            <textarea
              value={description || ''}
              onChange={(e) => onEdit?.({ description: e.target.value })}
              className="text-gray-600 bg-transparent border border-gray-200 focus:border-indigo-500 outline-none w-full text-center p-2 rounded resize-none mb-4"
              placeholder="Form description..."
              rows={2}
            />
          ) : (
            description && <p className="text-gray-600 text-center mb-8">{description}</p>
          )}
          
          {isEditing && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <label className="block text-sm font-medium text-indigo-900 mb-2">Select Form (from E1.3 Forms)</label>
              <select
                value={formId || ''}
                onChange={(e) => onEdit?.({ formId: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Use placeholder form preview</option>
                {availableForms?.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
              {availableForms?.length === 0 && (
                <p className="text-xs text-indigo-600 mt-2">No forms available. Create forms in the Forms section.</p>
              )}
            </div>
          )}
          
          {formId && selectedForm ? (
            <div className="text-center py-8 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/50">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-medium text-indigo-900">{selectedForm.name}</p>
              {selectedForm.description && (
                <p className="text-sm text-indigo-600 mt-1">{selectedForm.description}</p>
              )}
              <p className="text-xs text-indigo-500 mt-2">Form will render here at runtime</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" rows={3} placeholder="Your message" />
              </div>
              <button disabled className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg opacity-75">
                {submitText}
              </button>
              {!isEditing && !formId && (
                <p className="text-xs text-gray-400 text-center">Placeholder form preview</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER BLOCK
// ============================================================================

function FooterBlockRenderer({ block, isEditing, onEdit }: { block: FooterBlock; isEditing?: boolean; onEdit?: (content: any) => void }) {
  const { logoText, tagline, columns, copyright, socialLinks } = block.content;
  
  return (
    <footer className="py-12 px-4 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            {isEditing ? (
              <input
                type="text"
                value={logoText || ''}
                onChange={(e) => onEdit?.({ logoText: e.target.value })}
                className="text-xl font-bold bg-transparent border-b border-white/30 focus:border-white outline-none w-full mb-2"
                placeholder="Company Name"
              />
            ) : (
              logoText && <h3 className="text-xl font-bold mb-2">{logoText}</h3>
            )}
            {tagline && <p className="text-gray-400">{tagline}</p>}
          </div>
          
          {columns.map((column, cIndex) => (
            <div key={column.id || cIndex}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, lIndex) => (
                  <li key={link.id || lIndex}>
                    <a href={link.url} className="text-gray-400 hover:text-white transition-colors">
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          {isEditing ? (
            <input
              type="text"
              value={copyright || ''}
              onChange={(e) => onEdit?.({ copyright: e.target.value })}
              className="text-gray-400 text-sm bg-transparent border-b border-white/20 focus:border-white/50 outline-none"
              placeholder="© 2026 Company Name"
            />
          ) : (
            copyright && <p className="text-gray-400 text-sm">{copyright}</p>
          )}
          
          {socialLinks && (
            <div className="flex gap-4">
              {socialLinks.facebook && <a href={socialLinks.facebook} className="text-gray-400 hover:text-white"><span>Facebook</span></a>}
              {socialLinks.twitter && <a href={socialLinks.twitter} className="text-gray-400 hover:text-white"><span>Twitter</span></a>}
              {socialLinks.instagram && <a href={socialLinks.instagram} className="text-gray-400 hover:text-white"><span>Instagram</span></a>}
              {socialLinks.linkedin && <a href={socialLinks.linkedin} className="text-gray-400 hover:text-white"><span>LinkedIn</span></a>}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN BLOCK RENDERER
// ============================================================================

interface BlockRendererProps {
  block: PageBlock;
  isEditing?: boolean;
  onEdit?: (content: any) => void;
  availableForms?: Array<{ id: string; name: string; description?: string }>;
}

export function BlockRenderer({ block, isEditing, onEdit, availableForms }: BlockRendererProps) {
  if (!block.isVisible && !isEditing) return null;
  
  const wrapperClass = !block.isVisible && isEditing ? 'opacity-50' : '';
  
  switch (block.type) {
    case 'hero':
      return <div className={wrapperClass}><HeroBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    case 'features':
      return <div className={wrapperClass}><FeaturesBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    case 'pricing':
      return <div className={wrapperClass}><PricingBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    case 'testimonials':
      return <div className={wrapperClass}><TestimonialsBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    case 'cta':
      return <div className={wrapperClass}><CTABlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    case 'form':
      return <div className={wrapperClass}><FormBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} availableForms={availableForms} /></div>;
    case 'footer':
      return <div className={wrapperClass}><FooterBlockRenderer block={block} isEditing={isEditing} onEdit={onEdit} /></div>;
    default:
      return <div className="p-4 bg-yellow-50 text-yellow-800">Unknown block type: {(block as any).type}</div>;
  }
}

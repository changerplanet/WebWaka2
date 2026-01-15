'use client'

import Link from 'next/link'
import { BlockRenderer } from '@/components/sites-funnels/builder/BlockRenderer'
import { PublicTenant, PublicFunnel, PublicPage } from '@/lib/sites-funnels/public-resolver'

interface Props {
  tenant: PublicTenant
  funnel: PublicFunnel
  currentStep: PublicPage
  stepIndex: number
}

export function FunnelEntryClient({ tenant, funnel, currentStep, stepIndex }: Props) {
  const blocks = currentStep.blocks || []
  const totalSteps = funnel.steps.length
  const nextStep = funnel.steps[stepIndex + 1]
  const prevStep = stepIndex > 0 ? funnel.steps[stepIndex - 1] : null

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {tenant.logoUrl && (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.name} 
                  className="h-8 w-auto"
                />
              )}
              <span className="font-semibold text-gray-900">
                {funnel.name}
              </span>
            </div>
            
            {tenant.isDemo && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">
                DEMO
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {funnel.steps.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div 
                  className={`flex-1 h-2 rounded-full ${
                    idx <= stepIndex ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                />
                {idx < funnel.steps.length - 1 && (
                  <div className="w-2" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </div>
      </header>

      <main>
        {blocks.length > 0 ? (
          blocks.map((block: any, index: number) => (
            <BlockRenderer 
              key={block.id || index} 
              block={block} 
              isEditing={false} 
            />
          ))
        ) : (
          <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-600">{stepIndex + 1}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentStep.name}</h2>
              <p className="text-gray-600">This step is being set up. Check back soon!</p>
            </div>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {prevStep ? (
            <Link 
              href={`/${tenant.slug}/funnel/${funnel.slug}/${prevStep.slug}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </Link>
          ) : (
            <div />
          )}
          
          {nextStep ? (
            <Link 
              href={`/${tenant.slug}/funnel/${funnel.slug}/${nextStep.slug}`}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Continue
            </Link>
          ) : (
            <button 
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </footer>

      {currentStep.customCss && (
        <style dangerouslySetInnerHTML={{ __html: currentStep.customCss }} />
      )}
    </div>
  )
}

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolvePublishedForm } from '@/lib/sites-funnels/public-resolver'
import { FormLandingClient } from './FormLandingClient'

interface Props {
  params: Promise<{ tenantSlug: string; formSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenantSlug, formSlug } = await params
  const result = await resolvePublishedForm(tenantSlug, formSlug)
  
  if (!result.success) {
    return { title: 'Form Not Found' }
  }

  const { form, tenant } = result
  
  return {
    title: `${form.name} - ${tenant.name}`,
    description: form.description || `Submit ${form.name}`,
  }
}

export default async function FormLandingPage({ params }: Props) {
  const { tenantSlug, formSlug } = await params
  const result = await resolvePublishedForm(tenantSlug, formSlug)
  
  if (!result.success) {
    notFound()
  }

  const { form, tenant } = result

  return (
    <FormLandingClient
      tenant={tenant}
      form={form}
    />
  )
}

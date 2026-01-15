'use client'

import { useState } from 'react'
import { Star, Send, Loader2, CheckCircle, X } from 'lucide-react'

interface VendorRatingFormProps {
  tenantId: string
  vendorId: string
  vendorName: string
  subOrderId: string
  parentOrderId: string
  subOrderNumber: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function VendorRatingForm({
  tenantId,
  vendorId,
  vendorName,
  subOrderId,
  parentOrderId,
  subOrderNumber,
  onSuccess,
  onCancel
}: VendorRatingFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/mvm/vendor-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          vendorId,
          subOrderId,
          parentOrderId,
          rating,
          comment: comment.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating')
      }

      setIsSubmitted(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center" data-testid="rating-success">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Thank you!</h3>
        <p className="text-slate-500">Your rating has been submitted successfully.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6" data-testid="vendor-rating-form">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Rate Your Experience</h3>
          <p className="text-sm text-slate-500">
            Order {subOrderNumber} from {vendorName}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            How was your experience?
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                data-testid={`star-${star}`}
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(rating > 0 || hoverRating > 0) && (
            <p className="mt-2 text-sm font-medium text-slate-600">
              {ratingLabels[hoverRating || rating]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
            Add a comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this seller..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            data-testid="rating-comment"
          />
          <p className="mt-1 text-xs text-slate-400 text-right">{comment.length}/500</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          data-testid="submit-rating-btn"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Rating
            </>
          )}
        </button>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlace } from '@/hooks/usePlaces'
import { submitReport } from '@/services/api'
import type { PlaceReportCategory, PlaceReportField } from '@/types'

const REPORT_FIELDS: Record<PlaceReportCategory, { value: PlaceReportField; label: string }[]> = {
  'place-details': [
    { value: 'name', label: 'Place name' },
    { value: 'address', label: 'Address' },
    { value: 'area', label: 'Area' },
    { value: 'phone', label: 'Phone number' },
    { value: 'website', label: 'Website' },
    { value: 'openingHours', label: 'Opening hours' },
  ],
  accessibility: [
    { value: 'wheelchairEntrance', label: 'Wheelchair accessible entrance' },
    { value: 'ramp', label: 'Ramp' },
    { value: 'elevator', label: 'Elevator' },
    { value: 'accessibleToilet', label: 'Accessible toilet' },
    { value: 'accessibleParking', label: 'Accessible parking' },
    { value: 'tactilePaving', label: 'Tactile paving' },
    { value: 'audioAssistance', label: 'Audio assistance' },
  ],
}

export default function ReportUpdate() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: place, isLoading, isError } = usePlace(id)
  const [category, setCategory] = useState<PlaceReportCategory>('place-details')
  const [fields, setFields] = useState<PlaceReportField[]>([])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!place || isSubmitting) return
    const trimmedDescription = description.trim()
    if (fields.length === 0) {
      setSubmitError('Select at least one detail this report is about.')
      return
    }
    if (!trimmedDescription || trimmedDescription.length > 2000) {
      setSubmitError('Describe what appears incorrect or outdated (up to 2,000 characters).')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await submitReport({ placeId: place.id, category, fields, description: trimmedDescription })
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error && error.message === 'place-not-found'
        ? 'This place could not be found. Return to Explore and select a current place.'
        : 'We could not submit this report. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <main className="container mx-auto max-w-2xl px-4 py-10"><Skeleton className="mb-4 h-8 w-64" /><Skeleton className="h-80 w-full" /></main>
  if (isError || !place) return <main id="main-content" className="container mx-auto max-w-xl px-4 py-16 text-center"><AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" /><h1 className="mb-2 text-xl font-semibold">Place not found</h1><p className="mb-6 text-sm text-muted-foreground">This place may have been removed or the link is incorrect.</p><Button asChild variant="outline"><Link to="/explore">Back to Explore</Link></Button></main>

  if (submitted) return (
    <main id="main-content" className="container mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" aria-hidden="true" />
      <h1 className="mb-3 text-2xl font-bold">Report submitted</h1>
      <p className="mb-8 text-sm text-muted-foreground">Your report about {place.name} is saved for admin review. Submitting it did not change the place information.</p>
      <Button onClick={() => navigate(`/places/${place.id}`)}>Back to place</Button>
    </main>
  )

  return (
    <main id="main-content" className="container mx-auto max-w-2xl px-4 py-10">
      <Link to={`/places/${place.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to {place.name}</Link>
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Report an Update</h1>
        <p className="text-muted-foreground">Tell us what appears incorrect or out of date for <strong className="text-foreground">{place.name}</strong>.</p>
      </div>

      <form onSubmit={event => void handleSubmit(event)} className="space-y-6" noValidate>
        <div>
          <Label htmlFor="report-category">What kind of information is this about?</Label>
          <select
            id="report-category"
            value={category}
            onChange={event => {
              setCategory(event.target.value as PlaceReportCategory)
              setFields([])
              setSubmitError('')
            }}
            className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="place-details">Place details</option>
            <option value="accessibility">Accessibility information</option>
          </select>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-medium">Which details should we check?</legend>
          <div className="space-y-3">
            {REPORT_FIELDS[category].map(field => {
              const checked = fields.includes(field.value)
              return (
                <div key={field.value} className="flex items-center gap-3">
                  <input
                    id={`report-field-${field.value}`}
                    type="checkbox"
                    checked={checked}
                    onChange={event => setFields(current => event.target.checked
                      ? [...current, field.value]
                      : current.filter(value => value !== field.value))}
                    className="h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Label htmlFor={`report-field-${field.value}`} className="cursor-pointer font-normal">{field.label}</Label>
                </div>
              )
            })}
          </div>
        </fieldset>

        <div>
          <Label htmlFor="report-description">What seems incorrect or outdated?</Label>
          <Textarea
            id="report-description"
            value={description}
            onChange={event => setDescription(event.target.value)}
            maxLength={2000}
            placeholder="Describe what you observed and, if known, what information should be checked."
            className="mt-2 min-h-32"
            aria-invalid={Boolean(submitError && description.trim().length === 0)}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/2000</p>
        </div>

        <p className="text-xs text-muted-foreground">Reports are visible to authorized administrators for review. If you are signed in, your Firebase user ID may be included. Submitting a report does not change the place information.</p>
        {submitError && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" />{submitError}</p>}
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          <Flag className="h-4 w-4" aria-hidden="true" />{isSubmitting ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </main>
  )
}

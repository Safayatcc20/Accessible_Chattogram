import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlace } from '@/hooks/usePlaces'
import { submitVerificationRequest } from '@/services/api'

const schema = z.object({
  wheelchairEntrance: z.boolean(),
  ramp: z.boolean(),
  elevator: z.boolean(),
  accessibleToilet: z.boolean(),
  accessibleParking: z.boolean(),
  tactilePaving: z.boolean(),
  audioAssistance: z.boolean(),
  notes: z.string().max(2000, 'Notes must be 2,000 characters or fewer'),
})

type FormData = z.infer<typeof schema>

const fields: { name: keyof Omit<FormData, 'notes'>; label: string }[] = [
  { name: 'wheelchairEntrance', label: 'Wheelchair accessible entrance' },
  { name: 'ramp', label: 'Ramp available' },
  { name: 'elevator', label: 'Elevator available' },
  { name: 'accessibleToilet', label: 'Accessible toilet' },
  { name: 'accessibleParking', label: 'Accessible parking' },
  { name: 'tactilePaving', label: 'Tactile paving' },
  { name: 'audioAssistance', label: 'Audio assistance' },
]

export default function VerifyPlace() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: place, isLoading, isError } = usePlace(id)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      wheelchairEntrance: false,
      ramp: false,
      elevator: false,
      accessibleToilet: false,
      accessibleParking: false,
      tactilePaving: false,
      audioAssistance: false,
      notes: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!place) return
    setSubmitError('')
    try {
      await submitVerificationRequest({
        placeId: place.id,
        placeName: place.name,
        accessibility: {
          wheelchairEntrance: data.wheelchairEntrance,
          ramp: data.ramp,
          elevator: data.elevator,
          accessibleToilet: data.accessibleToilet,
          accessibleParking: data.accessibleParking,
          tactilePaving: data.tactilePaving,
          audioAssistance: data.audioAssistance,
        },
        notes: data.notes.trim() || null,
      })
      setSubmitted(true)
    } catch {
      setSubmitError('We could not submit your verification. Please try again.')
    }
  }

  if (isLoading) return <main className="container mx-auto max-w-2xl px-4 py-10"><Skeleton className="mb-4 h-8 w-64" /><Skeleton className="h-80 w-full" /></main>
  if (isError || !place) return <main className="container mx-auto max-w-xl px-4 py-16 text-center"><AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" /><h1 className="mb-2 text-xl font-semibold">Place not found</h1><Button asChild variant="outline"><Link to="/explore">Back to Explore</Link></Button></main>

  if (submitted) return (
    <main id="main-content" className="container mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" aria-hidden="true" />
      <h1 className="mb-3 text-2xl font-bold">Verification submitted</h1>
      <p className="mb-8 text-sm text-muted-foreground">Your confirmation for {place.name} is pending admin review. It will not change the public information until approved.</p>
      <Button onClick={() => navigate(`/places/${place.id}`)}>Back to place</Button>
    </main>
  )

  return (
    <main id="main-content" className="container mx-auto max-w-2xl px-4 py-10">
      <Link to={`/places/${place.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to {place.name}</Link>
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Verify this place</h1>
        <p className="text-muted-foreground">Confirm the accessibility information you have personally observed at <strong className="text-foreground">{place.name}</strong>.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
        <section aria-labelledby="verification-fields-heading">
          <h2 id="verification-fields-heading" className="mb-1 text-base font-semibold">Accessibility features</h2>
          <p className="mb-4 text-sm text-muted-foreground">Check an item only if you have personally confirmed that feature is available. Unchecked means “not confirmed”; it does not mean the feature is absent. This form records confirmations and is not a complete yes/no accessibility assessment.</p>
          <div className="space-y-3">
            {fields.map(field => (
              <div key={field.name} className="flex items-center gap-3">
                <Checkbox id={`verify-${field.name}`} checked={watch(field.name)} onCheckedChange={value => setValue(field.name, value === true, { shouldDirty: true })} />
                <Label htmlFor={`verify-${field.name}`} className="cursor-pointer text-sm font-normal">{field.label}</Label>
              </div>
            ))}
          </div>
        </section>
        <Separator />
        <div>
          <Label htmlFor="verification-notes">Observations (optional)</Label>
          <Textarea id="verification-notes" {...register('notes')} maxLength={2000} placeholder="For example, where the ramp is or when you visited." className="mt-2 min-h-24" aria-invalid={Boolean(errors.notes)} />
          {errors.notes && <p role="alert" className="mt-1 text-xs text-destructive">{errors.notes.message}</p>}
        </div>
        <p className="text-xs text-muted-foreground">No email or name is collected by this form. If you are signed in, your Firebase user ID (UID) may be stored with the request and visible to authorized administrators. Requests are reviewed before any confirmation is counted. This is not a complete accessibility assessment.</p>
        {submitError && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{submitError}</p>}
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          <ShieldCheck className="h-4 w-4" />{isSubmitting ? 'Submitting…' : 'Submit verification'}
        </Button>
      </form>
    </main>
  )
}

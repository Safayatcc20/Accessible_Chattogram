import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2, MapPin, FileText, ShieldCheck, AlertCircle, Plus, Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { submitPlace } from '@/services/api'

const contributeSchema = z.object({
  placeName: z.string().min(2, 'Place name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  area: z.string().min(2, 'Area is required'),
  phone: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  wheelchairEntrance: z.boolean().optional(),
  ramp: z.boolean().optional(),
  elevator: z.boolean().optional(),
  accessibleToilet: z.boolean().optional(),
  accessibleParking: z.boolean().optional(),
  tactilePaving: z.boolean().optional(),
  audioAssistance: z.boolean().optional(),
  notes: z.string().optional(),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email('Invalid email').optional().or(z.literal('')),
})

type ContributeFormData = z.infer<typeof contributeSchema>

const CATEGORIES = [
  { value: 'hospital', label: 'Hospital / Clinic' },
  { value: 'university', label: 'University' },
  { value: 'school', label: 'School' },
  { value: 'restaurant', label: 'Restaurant / Café' },
  { value: 'shopping', label: 'Shopping Mall' },
  { value: 'government', label: 'Government Office' },
  { value: 'transport', label: 'Transport Hub' },
  { value: 'other', label: 'Other' },
]

const AREAS = [
  'GEC', '2 No Gate', 'Chawkbazar', 'Agrabad', 'Khulshi', 'Nasirabad',
  'Panchlaish', 'Halishahar', 'Patenga', 'Sholoshahar', 'Anderkilla',
  'Mehedibag', 'Bahaddarhat', 'CUET area', 'Other',
]

const ACCESSIBILITY_FIELDS = [
  { name: 'wheelchairEntrance' as const, label: 'Wheelchair Accessible Entrance' },
  { name: 'ramp' as const, label: 'Ramp Available' },
  { name: 'elevator' as const, label: 'Elevator' },
  { name: 'accessibleToilet' as const, label: 'Accessible Toilet / Restroom' },
  { name: 'accessibleParking' as const, label: 'Accessible Parking Space' },
  { name: 'tactilePaving' as const, label: 'Tactile Paving / Tactile Path' },
  { name: 'audioAssistance' as const, label: 'Audio Assistance' },
]

export default function Contribute() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ContributeFormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      wheelchairEntrance: false,
      ramp: false,
      elevator: false,
      accessibleToilet: false,
      accessibleParking: false,
      tactilePaving: false,
      audioAssistance: false,
    },
  })

  const onSubmit = async (data: ContributeFormData) => {
    setIsSubmitting(true)
    try {
      await submitPlace(data as Record<string, unknown>)
      setSubmitted(true)
      reset()
      toast({ title: 'Contribution submitted', description: 'Thank you for helping improve accessibility data.', variant: 'success' as never })
    } catch {
      toast({ title: 'Submission failed', description: 'Please try again later.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main id="main-content" className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-accent" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Contribution received</h1>
        <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
          Thank you for contributing to Accessible Chattogram. Your submission will be reviewed and added to the map.
        </p>
        <p className="text-xs text-muted-foreground mb-8">
          Note: This is a demo — no data was actually stored. In the live version, submissions are reviewed before publishing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => setSubmitted(false)}>Add Another Place</Button>
          <Button variant="outline" onClick={() => window.history.back()}>Back to Explore</Button>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="container mx-auto px-4 py-10 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">Help Make Chattogram More Accessible</h1>
        <p className="text-muted-foreground leading-relaxed">
          Share what you know about accessibility at places across Chattogram. Every contribution — accurate or partial — helps people with disabilities plan their visits.
        </p>
      </div>

      {/* What you can do */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { Icon: Plus, label: 'Add a new place' },
          { Icon: ShieldCheck, label: 'Verify existing info' },
          { Icon: AlertCircle, label: 'Report outdated data' },
          { Icon: FileText, label: 'Add missing features' },
        ].map(({ Icon, label }) => (
          <div key={label} className="border border-border rounded-lg p-3 text-center">
            <Icon className="w-4 h-4 text-primary mx-auto mb-2" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Separator className="mb-8" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Contribute a place form">
        {/* Place Information */}
        <section aria-labelledby="place-info-heading" className="mb-8">
          <h2 id="place-info-heading" className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            Place Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="placeName">
                Place Name <span aria-label="required">*</span>
              </Label>
              <Input
                id="placeName"
                {...register('placeName')}
                placeholder="e.g. Chittagong Medical College Hospital"
                className="mt-1"
                aria-describedby={errors.placeName ? 'placeName-error' : undefined}
                aria-invalid={!!errors.placeName}
              />
              {errors.placeName && (
                <p id="placeName-error" role="alert" className="text-xs text-destructive mt-1">{errors.placeName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">
                  Category <span aria-label="required">*</span>
                </Label>
                <Select onValueChange={v => setValue('category', v)}>
                  <SelectTrigger id="category" className="mt-1" aria-describedby={errors.category ? 'category-error' : undefined}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p id="category-error" role="alert" className="text-xs text-destructive mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="area">
                  Area <span aria-label="required">*</span>
                </Label>
                <Select onValueChange={v => setValue('area', v)}>
                  <SelectTrigger id="area" className="mt-1">
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.area && (
                  <p role="alert" className="text-xs text-destructive mt-1">{errors.area.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">
                Address <span aria-label="required">*</span>
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Street address or landmark description"
                className="mt-1"
                aria-invalid={!!errors.address}
              />
              {errors.address && (
                <p role="alert" className="text-xs text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" {...register('phone')} placeholder="+880 31..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="website">Website (optional)</Label>
                <Input id="website" {...register('website')} placeholder="https://..." className="mt-1" type="url" />
                {errors.website && (
                  <p role="alert" className="text-xs text-destructive mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Accessibility Features */}
        <section aria-labelledby="accessibility-heading" className="mb-8">
          <div className="mb-5">
            <h2 id="accessibility-heading" className="text-base font-semibold text-foreground mb-1">
              Accessibility Features
            </h2>
            <p className="text-sm text-muted-foreground">
              Only check features you have personally confirmed are available. Leave unchecked if you're unsure — "no info" is better than incorrect data.
            </p>
          </div>
          <div className="space-y-3">
            {ACCESSIBILITY_FIELDS.map(field => (
              <div key={field.name} className="flex items-center gap-3">
                <Checkbox
                  id={field.name}
                  checked={watch(field.name) ?? false}
                  onCheckedChange={v => setValue(field.name, Boolean(v))}
                />
                <Label htmlFor={field.name} className="text-sm font-normal cursor-pointer">
                  {field.label}
                </Label>
              </div>
            ))}
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Additional Info */}
        <section aria-labelledby="additional-heading" className="mb-8">
          <h2 id="additional-heading" className="text-base font-semibold text-foreground mb-5">
            Additional Notes
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Anything else that would help people understand accessibility at this place? (e.g. 'Ramp is on the side entrance', 'Elevator is often out of service')"
                className="mt-1 min-h-24"
              />
            </div>

            {/* Photo upload placeholder */}
            <div>
              <Label>Photo (optional)</Label>
              <div className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Photo upload will be available in a future version.</p>
                <p className="text-xs text-muted-foreground mt-1">Photos of entrances, ramps, and signage are especially helpful.</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Your info */}
        <section aria-labelledby="reporter-heading" className="mb-8">
          <h2 id="reporter-heading" className="text-base font-semibold text-foreground mb-2">Your Information (optional)</h2>
          <p className="text-sm text-muted-foreground mb-5">Not required, but helps us follow up if we have questions about your submission.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reporterName">Name</Label>
              <Input id="reporterName" {...register('reporterName')} placeholder="Your name" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="reporterEmail">Email</Label>
              <Input id="reporterEmail" {...register('reporterEmail')} placeholder="your@email.com" type="email" className="mt-1" />
              {errors.reporterEmail && (
                <p role="alert" className="text-xs text-destructive mt-1">{errors.reporterEmail.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* Privacy note */}
        <div className="p-3 bg-secondary rounded-lg mb-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Demo mode:</strong> This form is currently in demonstration mode. Submissions are not stored or processed. In the live version, submissions are reviewed before being published to the map.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Contribution'}
        </Button>
      </form>
    </main>
  )
}

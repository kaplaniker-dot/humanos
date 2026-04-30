// src/app/(app)/admin/reports/[id]/edit/EditForm.tsx
// Day 12 — Admin: Rapor Edit Form (Client Component)
// Day 12 A5.6.3 — Tam form: 11 section, array editors, save & approve
//
// Mira'nın content_json yapısını section bazlı düzenlemeye olanak verir.
// Server Action: saveReportEdit (actions.ts)

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveReportEdit } from '../actions'

// ═══════════════════════════════════════════════════
// TYPES — Mira content_json schema
// ═══════════════════════════════════════════════════

type WeeklyPlanItem = {
  day: string
  action: string
  duration_min: number
}

type MiraSections = {
  opening?: string
  current_state?: {
    strengths?: string[]
    watch_areas?: string[]
  }
  pattern?: string
  priority_map?: {
    main_goal?: string
    main_action?: string
    support_1?: string
    support_2?: string
  }
  weekly_plan?: WeeklyPlanItem[]
  closing?: string
  medical_disclaimer?: string
}

type MiraContent = {
  version?: string
  user_name?: string
  report_date?: string
  sections?: MiraSections
  metadata?: Record<string, unknown>
}

// ═══════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════

type Props = {
  reportId: string
  initialContent: unknown
  currentStatus: string
}

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════

export function EditForm({ reportId, initialContent, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── Initial state'i parse et ───
  const initial = (initialContent ?? {}) as MiraContent
  const initialSections = initial.sections ?? {}

  // ─── Form state — her section için ayrı state ───
  const [opening, setOpening] = useState(initialSections.opening ?? '')
  const [strengths, setStrengths] = useState<string[]>(
    initialSections.current_state?.strengths ?? [],
  )
  const [watchAreas, setWatchAreas] = useState<string[]>(
    initialSections.current_state?.watch_areas ?? [],
  )
  const [pattern, setPattern] = useState(initialSections.pattern ?? '')
  const [mainGoal, setMainGoal] = useState(
    initialSections.priority_map?.main_goal ?? '',
  )
  const [mainAction, setMainAction] = useState(
    initialSections.priority_map?.main_action ?? '',
  )
  const [support1, setSupport1] = useState(
    initialSections.priority_map?.support_1 ?? '',
  )
  const [support2, setSupport2] = useState(
    initialSections.priority_map?.support_2 ?? '',
  )
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanItem[]>(
    initialSections.weekly_plan ?? [],
  )
  const [closing, setClosing] = useState(initialSections.closing ?? '')

  const medicalDisclaimer = initialSections.medical_disclaimer ?? ''

  // ─── Handlers ───
  function handleSave(approveAfterSave: boolean) {
    setErrorMsg(null)

    // Build updated content_json
    const updatedContent: MiraContent = {
      ...initial,
      sections: {
        opening: opening.trim(),
        current_state: {
          strengths: strengths.map((s) => s.trim()).filter(Boolean),
          watch_areas: watchAreas.map((s) => s.trim()).filter(Boolean),
        },
        pattern: pattern.trim(),
        priority_map: {
          main_goal: mainGoal.trim(),
          main_action: mainAction.trim(),
          support_1: support1.trim(),
          support_2: support2.trim(),
        },
        weekly_plan: weeklyPlan
          .filter((item) => item.day.trim() && item.action.trim())
          .map((item) => ({
            day: item.day.trim(),
            action: item.action.trim(),
            duration_min: Number(item.duration_min) || 0,
          })),
        closing: closing.trim(),
        medical_disclaimer: medicalDisclaimer,
      },
    }

    if (approveAfterSave) {
      const confirmed = confirm(
        'Bu rapor kullanıcıya açılacak (status="approved"). Emin misin?',
      )
      if (!confirmed) return
    }

    startTransition(async () => {
      const result = await saveReportEdit({
        reportId,
        contentJson: updatedContent as Record<string, unknown>,
        approveAfterSave,
      })

      if (!result.success) {
        setErrorMsg(result.error)
      }
      // Başarılıysa redirect oldu (server action'da)
    })
  }

  function handleCancel() {
    if (
      confirm(
        'Değişiklikleri iptal etmek istediğine emin misin? Kaydetmediğin değişiklikler kaybolacak.',
      )
    ) {
      router.push(`/admin/reports/${reportId}`)
    }
  }

  // ─── Array helpers ───
  function addStringItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ''])
  }

  function removeStringItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) {
    setter((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStringItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function addWeeklyItem() {
    setWeeklyPlan((prev) => [
      ...prev,
      { day: '', action: '', duration_min: 30 },
    ])
  }

  function removeWeeklyItem(index: number) {
    setWeeklyPlan((prev) => prev.filter((_, i) => i !== index))
  }

  function updateWeeklyItem(
    index: number,
    field: keyof WeeklyPlanItem,
    value: string | number,
  ) {
    setWeeklyPlan((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === 'duration_min'
                  ? Number(value) || 0
                  : (value as string),
            }
          : item,
      ),
    )
  }

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Error display */}
      {errorMsg && (
        <div className="px-4 py-3 rounded-xl border border-humanos-rose bg-humanos-rose/10 text-humanos-rose text-sm">
          {errorMsg}
        </div>
      )}

      {/* ═══ Section: Opening ═══ */}
      <FormSection
        title="Açılış (Opening)"
        description="Mira'nın raporun en başındaki samimi giriş paragrafı. ~150 kelime."
      >
        <textarea
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          rows={6}
          disabled={isPending}
          className={textareaCls}
        />
        <WordCount text={opening} />
      </FormSection>

      {/* ═══ Section: Mevcut Durum — Güçlü Yanlar ═══ */}
      <FormSection
        title="Güçlü Yanlar"
        description="Kullanıcının zaten iyi yaptığı şeyler. Onaylama, motivasyon."
      >
        <ArrayStringEditor
          items={strengths}
          onAdd={() => addStringItem(setStrengths)}
          onRemove={(i) => removeStringItem(setStrengths, i)}
          onUpdate={(i, v) => updateStringItem(setStrengths, i, v)}
          placeholder="Örn: Düzenli hareket alışkanlığı var"
          disabled={isPending}
        />
      </FormSection>

      {/* ═══ Section: Mevcut Durum — İzlenmesi Gerekenler ═══ */}
      <FormSection
        title="İzlenmesi Gerekenler"
        description="Henüz problem değil ama dikkat edilmeli. Erken uyarılar."
      >
        <ArrayStringEditor
          items={watchAreas}
          onAdd={() => addStringItem(setWatchAreas)}
          onRemove={(i) => removeStringItem(setWatchAreas, i)}
          onUpdate={(i, v) => updateStringItem(setWatchAreas, i, v)}
          placeholder="Örn: Pre-diyabet riski, öğleden sonra enerji düşüşü"
          disabled={isPending}
        />
      </FormSection>

      {/* ═══ Section: Pattern ═══ */}
      <FormSection
        title="Örüntü (Pattern)"
        description="Verileri birbirine bağlayan ana hipotez. ~100 kelime."
      >
        <textarea
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          rows={5}
          disabled={isPending}
          className={textareaCls}
        />
        <WordCount text={pattern} />
      </FormSection>

      {/* ═══ Section: Priority Map ═══ */}
      <FormSection
        title="Öncelik Haritası"
        description="Ana hedef + asıl aksiyon + 2 destek aksiyonu."
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Ana Hedef</label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              disabled={isPending}
              className={inputCls}
              placeholder="Örn: Pre-diyabet riskini geri çevirmek"
            />
          </div>
          <div>
            <label className={labelCls}>Asıl Aksiyon</label>
            <textarea
              value={mainAction}
              onChange={(e) => setMainAction(e.target.value)}
              rows={3}
              disabled={isPending}
              className={textareaCls}
              placeholder="Hedefe ulaştıracak en önemli adım"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Destek 1</label>
              <input
                type="text"
                value={support1}
                onChange={(e) => setSupport1(e.target.value)}
                disabled={isPending}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Destek 2</label>
              <input
                type="text"
                value={support2}
                onChange={(e) => setSupport2(e.target.value)}
                disabled={isPending}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </FormSection>

      {/* ═══ Section: Weekly Plan ═══ */}
      <FormSection
        title="Haftalık Plan"
        description="Hafta içine yayılmış somut aksiyonlar."
      >
        <div className="space-y-2">
          {weeklyPlan.map((item, i) => (
            <div
              key={i}
              className="flex gap-2 items-center p-3 rounded-lg bg-humanos-bg/50 border border-humanos-border-faint"
            >
              <input
                type="text"
                value={item.day}
                onChange={(e) => updateWeeklyItem(i, 'day', e.target.value)}
                disabled={isPending}
                placeholder="Gün"
                className={`${inputSmallCls} w-32`}
              />
              <input
                type="text"
                value={item.action}
                onChange={(e) => updateWeeklyItem(i, 'action', e.target.value)}
                disabled={isPending}
                placeholder="Aksiyon"
                className={`${inputSmallCls} flex-1`}
              />
              <input
                type="number"
                value={item.duration_min}
                onChange={(e) =>
                  updateWeeklyItem(i, 'duration_min', e.target.value)
                }
                disabled={isPending}
                placeholder="dk"
                min={0}
                className={`${inputSmallCls} w-20 text-center`}
              />
              <span className="text-xs text-humanos-text-muted w-6">dk</span>
              <button
                type="button"
                onClick={() => removeWeeklyItem(i)}
                disabled={isPending}
                className="text-humanos-rose hover:text-humanos-rose/70 px-2 disabled:opacity-50"
                aria-label="Sil"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addWeeklyItem}
            disabled={isPending}
            className="text-sm text-humanos-accent hover:text-humanos-accent-hover transition-colors disabled:opacity-50"
          >
            + Plan adımı ekle
          </button>
        </div>
      </FormSection>

      {/* ═══ Section: Closing ═══ */}
      <FormSection
        title="Kapanış (Closing)"
        description="Raporu kapatış paragrafı. Umut + güven. ~80 kelime."
      >
        <textarea
          value={closing}
          onChange={(e) => setClosing(e.target.value)}
          rows={5}
          disabled={isPending}
          className={textareaCls}
        />
        <WordCount text={closing} />
      </FormSection>

      {/* ═══ Section: Medical Disclaimer (READ-ONLY) ═══ */}
      <FormSection
        title="Tıbbi Uyarı (otomatik)"
        description="Yasal metin. Düzenlenmez."
      >
        <p className="text-sm text-humanos-text-muted italic p-3 rounded-lg bg-humanos-subtle/50 border border-humanos-border-faint">
          {medicalDisclaimer || '(Tıbbi uyarı metni yok)'}
        </p>
      </FormSection>

      {/* ═══ Action Bar ═══ */}
      <div className="sticky bottom-4 mt-8 rounded-2xl border border-humanos-border-strong bg-white shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-humanos-text-muted">
            {currentStatus === 'rejected'
              ? 'Düzeltip onayladığında red durumu kalkar.'
              : 'Onayla — kullanıcıya açılır. Kaydet — sadece taslak.'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="px-5 py-2 rounded-lg border border-humanos-border-faint text-humanos-text text-sm font-medium hover:bg-humanos-bg/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="px-5 py-2 rounded-lg border border-humanos-accent text-humanos-accent text-sm font-medium hover:bg-humanos-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Kaydediliyor…' : 'Kaydet (taslak)'}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-humanos-accent text-white text-sm font-medium hover:bg-humanos-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'İşleniyor…' : 'Kaydet ve Onayla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-humanos-border-faint bg-white/70 backdrop-blur-sm p-6">
      <h2 className="font-serif text-xl text-humanos-text mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-humanos-text-muted mb-4">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ArrayStringEditor({
  items,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
  disabled,
}: {
  items: string[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            disabled={disabled}
            className="text-humanos-rose hover:text-humanos-rose/70 px-2 disabled:opacity-50"
            aria-label="Sil"
          >
            ×
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-humanos-text-subtle italic">
          (Henüz öğe yok)
        </p>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="text-sm text-humanos-accent hover:text-humanos-accent-hover transition-colors disabled:opacity-50"
      >
        + Ekle
      </button>
    </div>
  )
}

function WordCount({ text }: { text: string }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <p className="text-xs text-humanos-text-subtle mt-2 font-mono">
      {words} kelime
    </p>
  )
}

// ═══════════════════════════════════════════════════
// SHARED CLASSES
// ═══════════════════════════════════════════════════

const labelCls =
  'block text-xs uppercase tracking-wider text-humanos-text-muted mb-2'

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-humanos-border-faint bg-white text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors disabled:opacity-50 disabled:bg-humanos-bg/30'

const inputSmallCls =
  'px-3 py-2 rounded-lg border border-humanos-border-faint bg-white text-humanos-text text-sm placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors disabled:opacity-50'

const textareaCls =
  'w-full px-4 py-3 rounded-xl border border-humanos-border-faint bg-white text-humanos-text placeholder:text-humanos-text-subtle focus:outline-none focus:border-humanos-accent transition-colors resize-vertical disabled:opacity-50 disabled:bg-humanos-bg/30'

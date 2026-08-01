'use client'

import { useEffect, useMemo, useState } from 'react'
import plan from '@/data/training-plan.json'
import { Check, ChevronLeft, ChevronRight, Dumbbell, Flame, LogOut, Mail, Moon, Play, Plus, Settings2, SkipForward, Sun, Timer, Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase, type AuthSession } from '@/lib/supabase-browser'

type Exercise = (typeof plan.schedule)[keyof typeof plan.schedule]['exercises'][number]

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const storageKey = 'pulse-training-progress-v1'

type SavedProgress = {
  completedByDay: Record<string, string[]>
  skippedDays: string[]
  notesByWorkout: Record<string, string>
  selectedDayIndex: number
  selectedWeek: number
  dark: boolean
}

export default function Home() {
  const actualDayIndex = (new Date().getDay() + 6) % 7
  const [selectedDayIndex, setSelectedDayIndex] = useState(actualDayIndex)
  const [selectedWeek, setSelectedWeek] = useState(plan.week)
  const dayKey = weekDayKeys[selectedDayIndex]
  const workout = plan.schedule[dayKey]
  const weekIndex = selectedWeek - 1
  const workoutKey = `${selectedWeek}-${dayKey}`
  const phase = selectedWeek <= 4 ? 'Foundation phase' : selectedWeek <= 8 ? 'Build the aerobic base' : 'Endurance phase'
  const runFocus = dayKey === 'monday' ? `Easy run · ${plan.weekSettings.easyRun[weekIndex]}` : dayKey === 'wednesday' ? plan.weekSettings.speedRun[weekIndex] : dayKey === 'saturday' ? `${plan.weekSettings.longRunMiles[weekIndex]} mile long run` : null
  const exercises = workout.exercises.map(exercise => exercise.id === 'speed-session' ? { ...exercise, detail: plan.weekSettings.speedRun[weekIndex] } : exercise.id === 'long-run' ? { ...exercise, detail: `${plan.weekSettings.longRunMiles[weekIndex]} miles · easy conversational pace` } : exercise)
  const [completedByDay, setCompletedByDay] = useState<Record<string, string[]>>({})
  const [skippedDays, setSkippedDays] = useState<string[]>([])
  const [notesByWorkout, setNotesByWorkout] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [dark, setDark] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cloudReady, setCloudReady] = useState(false)
  const [email, setEmail] = useState('')
  const [authMessage, setAuthMessage] = useState('')

  const completed = completedByDay[workoutKey] ?? []
  const isSkipped = skippedDays.includes(workoutKey)
  const notes = notesByWorkout[workoutKey] ?? workout.coachNote

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const progress = JSON.parse(saved) as Partial<SavedProgress>
        if (progress.completedByDay) setCompletedByDay(progress.completedByDay)
        if (progress.skippedDays) setSkippedDays(progress.skippedDays)
        if (progress.notesByWorkout) setNotesByWorkout(progress.notesByWorkout)
        if (typeof progress.selectedDayIndex === 'number') setSelectedDayIndex(progress.selectedDayIndex)
        if (typeof progress.selectedWeek === 'number') setSelectedWeek(progress.selectedWeek)
        if (typeof progress.dark === 'boolean') setDark(progress.dark)
      }
    } catch { window.localStorage.removeItem(storageKey) }
    setHydrated(true)
  }, [])
  useEffect(() => {
    void (async () => {
      const restored = await supabase.restoreSession()
      setSession(restored)
      if (restored) {
        try {
          const cloudProgress = await supabase.getProgress(restored.user.id, restored.accessToken) as Partial<SavedProgress> | null
          if (cloudProgress) {
            if (cloudProgress.completedByDay) setCompletedByDay(cloudProgress.completedByDay)
            if (cloudProgress.skippedDays) setSkippedDays(cloudProgress.skippedDays)
            if (cloudProgress.notesByWorkout) setNotesByWorkout(cloudProgress.notesByWorkout)
            if (typeof cloudProgress.selectedDayIndex === 'number') setSelectedDayIndex(cloudProgress.selectedDayIndex)
            if (typeof cloudProgress.selectedWeek === 'number') setSelectedWeek(cloudProgress.selectedWeek)
            if (typeof cloudProgress.dark === 'boolean') setDark(cloudProgress.dark)
          }
        } catch { setAuthMessage('Your account is signed in, but saved progress could not load yet.') }
        setCloudReady(true)
      }
      setAuthLoading(false)
    })
  }, [])
  useEffect(() => {
    if (!hydrated) return
    const progress: SavedProgress = { completedByDay, skippedDays, notesByWorkout, selectedDayIndex, selectedWeek, dark }
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
    if (!session || !cloudReady) return
    const save = window.setTimeout(() => { void supabase.saveProgress(session.user.id, progress, session.accessToken).catch(() => setAuthMessage('Changes are saved on this device, but cloud sync is temporarily unavailable.')) }, 500)
    return () => window.clearTimeout(save)
  }, [cloudReady, completedByDay, dark, hydrated, notesByWorkout, selectedDayIndex, selectedWeek, session, skippedDays])
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => setElapsed(s => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [running])

  const percent = Math.round((completed.length / exercises.length) * 100)
  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const next = useMemo(() => exercises.find(e => !completed.includes(e.id)) ?? exercises[0], [completed, exercises])
  const toggle = (id: string) => setCompletedByDay(days => {
    const current = days[workoutKey] ?? []
    return { ...days, [workoutKey]: current.includes(id) ? current.filter(x => x !== id) : [...current, id] }
  })
  const changeDay = (direction: number) => setSelectedDayIndex(index => (index + direction + 7) % 7)
  const toggleSkip = () => setSkippedDays(days => days.includes(workoutKey) ? days.filter(day => day !== workoutKey) : [...days, workoutKey])
  const changeWeek = (direction: number) => setSelectedWeek(week => Math.min(plan.totalWeeks, Math.max(1, week + direction)))
  const updateNotes = (note: string) => setNotesByWorkout(current => ({ ...current, [workoutKey]: note }))
  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    setAuthMessage('')
    try {
      await supabase.sendMagicLink(email, window.location.origin)
      setAuthMessage('Check your email for a secure sign-in link.')
    } catch (error) { setAuthMessage(error instanceof Error ? error.message : 'Unable to send sign-in email.') }
  }
  const signOut = async () => {
    if (session) await supabase.signOut(session.accessToken).catch(() => undefined)
    setSession(null)
    setCloudReady(false)
  }

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-[#f6f7f3] p-6 dark:bg-[#0c0e0c]"><p className="text-sm font-semibold muted">Loading Pulse Training…</p></main>
  if (!session) return <main className="grid min-h-screen place-items-center bg-[#f6f7f3] p-5 dark:bg-[#0c0e0c]"><section className="glass w-full max-w-md rounded-4xl p-7 sm:p-9"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-lime dark:bg-lime dark:text-ink"><Dumbbell size={26}/></div><p className="mt-7 text-xs font-bold tracking-[.16em] muted">PULSE TRAINING</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your plan, wherever you train.</h1><p className="mt-3 text-sm leading-6 muted">Sign in once and your workouts, notes, and progress will stay in sync across your devices.</p><form onSubmit={signIn} className="mt-7 space-y-3"><label className="text-sm font-semibold" htmlFor="email">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/><input id="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" className="h-13 w-full rounded-2xl bg-zinc-100 py-3 pl-11 pr-4 text-sm outline-none ring-lime focus:ring-2 dark:bg-white/5"/></div><Button type="submit" className="w-full">Send me a sign-in link</Button></form>{authMessage && <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-lime">{authMessage}</p>}<p className="mt-5 text-xs leading-5 muted">No password needed. We’ll email you a secure link to sign in.</p></section></main>

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lime dark:bg-lime dark:text-ink"><Dumbbell size={21}/></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] muted">Good morning, Mike</p><h1 className="text-xl font-bold tracking-tight">Let’s move.</h1></div></div>
        <div className="flex items-center gap-2"><span className="hidden text-xs font-semibold text-emerald-600 sm:block">{authMessage || 'Synced'}</span><button onClick={signOut} className="grid h-11 w-11 place-items-center rounded-2xl glass" aria-label="Sign out"><LogOut size={18}/></button><button onClick={() => setDark(!dark)} className="grid h-11 w-11 place-items-center rounded-2xl glass" aria-label="Toggle theme">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></div>
      </header>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.45fr_.9fr]">
        <div className="relative overflow-hidden rounded-4xl bg-ink px-6 py-7 text-white shadow-soft sm:px-8 sm:py-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/15 blur-3xl"/>
          <div className="relative flex items-center justify-between gap-3"><p className="text-sm font-semibold text-lime">{selectedDayIndex === actualDayIndex ? 'TODAY' : 'PLAN DAY'} · {workout.day.toUpperCase()}</p><div className="flex gap-1"><button onClick={() => changeDay(-1)} className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 hover:bg-white/20" aria-label="Previous workout"><ChevronLeft size={17}/></button><button onClick={() => changeDay(1)} className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 hover:bg-white/20" aria-label="Next workout"><ChevronRight size={17}/></button></div></div>
          <h2 className="relative mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{workout.focus}</h2>
          <p className="relative mt-3 max-w-md text-sm leading-6 text-white/60">{workout.coachNote}</p>
          <div className="relative mt-6 flex flex-wrap gap-2">{workout.equipment.map(x => <span key={x} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium">{x}</span>)}</div>
          <div className="relative mt-8 flex items-center gap-6 text-sm"><span className="flex items-center gap-2"><Timer size={16} className="text-lime"/>{workout.duration} min</span><span className="flex items-center gap-2"><Flame size={16} className="text-coral"/>{workout.calories} kcal</span></div>
        </div>

        <aside className="glass rounded-4xl p-6 sm:p-7">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Training plan</p><h3 className="mt-1 text-xl font-bold">{plan.planName}</h3></div><button className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"><Settings2 size={18}/></button></div>
          <div className="mt-7 flex items-center gap-5"><div className="ring-progress grid h-20 w-20 place-items-center rounded-full p-[6px]" style={{'--progress': `${(selectedWeek / plan.totalWeeks) * 100}%`} as React.CSSProperties}><div className="grid h-full w-full place-items-center rounded-full bg-white text-center dark:bg-[#161816]"><b className="text-lg leading-none">{selectedWeek}</b><span className="text-[10px] muted">OF {plan.totalWeeks}</span></div></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Week {selectedWeek} of {plan.totalWeeks}</p><div className="flex gap-1"><button onClick={() => changeWeek(-1)} disabled={selectedWeek === 1} className="rounded-lg p-1 disabled:opacity-25" aria-label="Previous week"><ChevronLeft size={16}/></button><button onClick={() => changeWeek(1)} disabled={selectedWeek === plan.totalWeeks} className="rounded-lg p-1 disabled:opacity-25" aria-label="Next week"><ChevronRight size={16}/></button></div></div><p className="mt-1 text-sm muted">{phase}</p><div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"><div className="h-full rounded-full bg-lime" style={{width: `${(selectedWeek / plan.totalWeeks) * 100}%`}}/></div></div></div>
          <div className="mt-6 border-t pt-5 text-sm dark:border-white/10"><span className="font-bold">{selectedWeek === plan.week ? plan.completedThisWeek : 0} of {plan.weeklyGoal}</span><span className="muted"> sessions complete this week{selectedWeek !== plan.week ? ' (preview)' : ''}</span></div>
        </aside>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.45fr_.9fr]">
        <div className="glass rounded-4xl p-5 sm:p-7">
          <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Your workout</p><h2 className="mt-1 text-2xl font-bold">{selectedDayIndex === actualDayIndex ? 'Today’s' : `${workout.day}'s`} exercises</h2></div><span className="text-sm font-semibold text-zinc-500">{isSkipped ? 'Skipped' : `${completed.length}/${exercises.length} done`}</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"><div className="h-full rounded-full bg-lime transition-all duration-500" style={{width: `${percent}%`}}/></div>
          <div className={`mt-5 space-y-2 ${isSkipped ? 'opacity-40' : ''}`}>{exercises.map((ex, i) => <ExerciseRow key={`${ex.id}-${i}`} exercise={ex} number={i + 1} checked={completed.includes(ex.id)} onToggle={() => toggle(ex.id)} />)}</div>
          <div className="mt-5 grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-3 text-sm font-semibold muted transition hover:border-zinc-500 hover:text-ink dark:border-white/15 dark:hover:text-white"><Plus size={16}/> Add exercise</button><button onClick={toggleSkip} className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${isSkipped ? 'border-coral bg-coral text-white' : 'border-zinc-200 text-zinc-500 hover:border-coral hover:text-coral dark:border-white/10'}`}><SkipForward size={16}/>{isSkipped ? 'Undo skip' : 'Skip workout'}</button></div>
        </div>

        <div className="space-y-5">
          <section className={`rounded-4xl p-6 text-white shadow-soft ${running ? 'bg-[#26483f]' : 'bg-[#1c3029]'}`}>
            <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.16em] text-lime">RUNNING WORKOUT</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">{time}</span></div>
            <h3 className="mt-6 text-xl font-bold">{running ? 'You’re in the zone.' : 'Ready when you are.'}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">{runFocus ? <><span className="font-medium text-white">{runFocus}</span><br/>Up next: </> : 'Up next: '}<span className="font-medium text-white">{next.name}</span></p>
            <Button onClick={() => setRunning(!running)} className="mt-6 w-full gap-2">{running ? <><X size={17}/> Pause workout</> : <><Play size={17} fill="currentColor"/> Start workout</>}</Button>
          </section>
          <section className="glass rounded-4xl p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Coach’s notes</p><h3 className="mt-1 text-lg font-bold">Today’s intention</h3></div><Trophy size={19} className="text-coral"/></div><textarea value={notes} onChange={e => updateNotes(e.target.value)} className="mt-4 min-h-24 w-full resize-none rounded-2xl bg-zinc-100 p-3 text-sm leading-6 outline-none ring-lime focus:ring-2 dark:bg-white/5"/><p className="mt-3 text-xs muted">Saved securely to your account.</p></section>
        </div>
      </section>

      <section className="glass rounded-3xl px-5 py-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">This week</p><p className="mt-1 font-bold">Tap a day to view that workout.</p></div><ChevronRight className="muted"/></div><div className="mt-5 flex justify-between">{dayLabels.map((d, i) => <button onClick={() => setSelectedDayIndex(i)} key={`${d}-${i}`} className="flex flex-col items-center gap-2"><span className="text-[11px] font-semibold muted">{dayNames[i]}</span><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition ${i < plan.completedThisWeek ? 'bg-lime text-ink' : i === selectedDayIndex ? 'bg-ink text-white ring-2 ring-lime/60 dark:bg-white dark:text-ink' : 'bg-zinc-100 text-zinc-400 dark:bg-white/5'}`}>{i < plan.completedThisWeek ? <Check size={15}/> : d}</span></button>)}</div></section>
    </main>
  )
}

function ExerciseRow({ exercise, number, checked, onToggle }: { exercise: Exercise; number: number; checked: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:gap-4 sm:p-4 ${checked ? 'border-lime/50 bg-lime/10' : 'border-transparent bg-zinc-50 hover:border-zinc-200 dark:bg-white/[.035] dark:hover:border-white/15'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-lime bg-lime text-ink' : 'border-zinc-300 dark:border-zinc-600'}`}>{checked ? <Check size={14} strokeWidth={3}/> : <span className="text-[10px] font-bold text-zinc-400">{number}</span>}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${checked ? 'line-through opacity-50' : ''}`}>{exercise.name}</span><span className="mt-0.5 block text-xs muted">{exercise.detail} <span className="mx-1">·</span> {exercise.load}</span></span><span className="hidden rounded-lg bg-white px-2 py-1 text-[11px] font-semibold muted shadow-sm dark:bg-white/5 sm:block">{exercise.rest}</span></button>
}

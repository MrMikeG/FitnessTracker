'use client'

import { useEffect, useState } from 'react'
import plan from '@/data/training-plan.json'
import { Check, ChevronLeft, ChevronRight, CircleCheck, Dumbbell, Flame, ImageIcon, Moon, Pause, Play, RotateCcw, SkipForward, Sun, Timer, X } from 'lucide-react'
import imageMap from '@/data/workout-images.json'

type Exercise = (typeof plan.schedule)[keyof typeof plan.schedule]['exercises'][number]

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const storageKey = 'pulse-training-progress-v2'
const workoutImages = imageMap as Record<string, string>

type SavedProgress = {
  completedByDay: Record<string, string[]>
  setProgressByDay: Record<string, Record<string, number>>
  completedWorkouts: string[]
  skippedDays: string[]
  selectedDayIndex: number
  selectedWeek: number
  dark: boolean
}

export default function Home() {
  const [now, setNow] = useState(() => new Date())
  const actualDayIndex = (now.getDay() + 6) % 7
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const dayKey = weekDayKeys[selectedDayIndex]
  const workout = plan.schedule[dayKey]
  const weekIndex = selectedWeek - 1
  const workoutKey = `${selectedWeek}-${dayKey}`
  const phase = selectedWeek <= 4 ? 'Foundation phase' : selectedWeek <= 8 ? 'Build the aerobic base' : 'Endurance phase'
  const exercises = workout.exercises.map(exercise => exercise.id === 'easy-run' ? { ...exercise, detail: `${plan.weekSettings.easyRun[weekIndex]} · easy conversational pace` } : exercise.id === 'speed-session' ? { ...exercise, detail: plan.weekSettings.speedRun[weekIndex] } : exercise.id === 'long-run' ? { ...exercise, detail: `${plan.weekSettings.longRunMiles[weekIndex]} miles · easy conversational pace` } : exercise)
  const [completedByDay, setCompletedByDay] = useState<Record<string, string[]>>({})
  const [setProgressByDay, setSetProgressByDay] = useState<Record<string, Record<string, number>>>({})
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([])
  const [skippedDays, setSkippedDays] = useState<string[]>([])
  const [dark, setDark] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const [restPreset, setRestPreset] = useState(60)
  const [restRemaining, setRestRemaining] = useState(60)
  const [restRunning, setRestRunning] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [preview, setPreview] = useState<{ name: string; image?: string } | null>(null)

  const completed = completedByDay[workoutKey] ?? []
  const isWorkoutComplete = completedWorkouts.includes(workoutKey)
  const isSkipped = skippedDays.includes(workoutKey)
  const completedThisWeek = completedWorkouts.filter(key => key.startsWith(`${selectedWeek}-`)).length
  const totalPlanDays = plan.totalWeeks * weekDayKeys.length
  const overallProgress = Math.round((completedWorkouts.length / totalPlanDays) * 100)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(clock)
  }, [])
  useEffect(() => {
    if (!restRunning) return
    if (restRemaining === 0) { setRestRunning(false); return }
    const timer = window.setInterval(() => setRestRemaining(seconds => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [restRemaining, restRunning])
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const progress = JSON.parse(saved) as Partial<SavedProgress>
        if (progress.completedByDay) setCompletedByDay(progress.completedByDay)
        if (progress.setProgressByDay) setSetProgressByDay(progress.setProgressByDay)
        if (progress.completedWorkouts) setCompletedWorkouts(progress.completedWorkouts)
        if (progress.skippedDays) setSkippedDays(progress.skippedDays)
        if (typeof progress.selectedDayIndex === 'number') setSelectedDayIndex(progress.selectedDayIndex)
        if (typeof progress.selectedWeek === 'number') setSelectedWeek(progress.selectedWeek)
      }
    } catch { window.localStorage.removeItem(storageKey) }
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (!hydrated) return
    const progress: SavedProgress = { completedByDay, setProgressByDay, completedWorkouts, skippedDays, selectedDayIndex, selectedWeek, dark }
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [completedByDay, completedWorkouts, dark, hydrated, selectedDayIndex, selectedWeek, setProgressByDay, skippedDays])

  const percent = Math.round((completed.length / exercises.length) * 100)
  const getSetTarget = (exercise: Exercise) => Number(exercise.detail.match(/(\d+)\s*sets?/)?.[1] ?? 1)
  const advanceExercise = (exercise: Exercise) => {
    const target = getSetTarget(exercise)
    const current = setProgressByDay[workoutKey]?.[exercise.id] ?? (completed.includes(exercise.id) ? target : 0)
    const next = current >= target ? 0 : current + 1
    setSetProgressByDay(days => ({ ...days, [workoutKey]: { ...days[workoutKey], [exercise.id]: next } }))
    setCompletedByDay(days => {
      const currentCompleted = days[workoutKey] ?? []
      const nextCompleted = next === target
        ? currentCompleted.includes(exercise.id) ? currentCompleted : [...currentCompleted, exercise.id]
        : currentCompleted.filter(id => id !== exercise.id)
      return { ...days, [workoutKey]: nextCompleted }
    })
  }
  const changeDay = (direction: number) => setSelectedDayIndex(index => (index + direction + 7) % 7)
  const toggleSkip = () => {
    setSkippedDays(days => days.includes(workoutKey) ? days.filter(day => day !== workoutKey) : [...days, workoutKey])
    setCompletedWorkouts(days => days.filter(day => day !== workoutKey))
  }
  const toggleWorkoutComplete = () => {
    if (!isWorkoutComplete) {
      setCelebrating(true)
      window.setTimeout(() => setCelebrating(false), 900)
    }
    setCompletedWorkouts(days => days.includes(workoutKey) ? days.filter(day => day !== workoutKey) : [...days, workoutKey])
    setSkippedDays(days => days.filter(day => day !== workoutKey))
  }
  const changeWeek = (direction: number) => setSelectedWeek(week => Math.min(plan.totalWeeks, Math.max(1, week + direction)))
  const chooseRestPreset = (seconds: number) => { setRestPreset(seconds); setRestRemaining(seconds); setRestRunning(false) }
  const toggleRestTimer = () => {
    if (restRunning) {
      setRestRunning(false)
      return
    }
    if (restRemaining === 0) setRestRemaining(restPreset)
    setRestRunning(true)
  }
  const restTime = `${String(Math.floor(restRemaining / 60)).padStart(2, '0')}:${String(restRemaining % 60).padStart(2, '0')}`
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lime dark:bg-lime dark:text-ink"><Dumbbell size={21}/></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] muted">{greeting}, Mike</p><h1 className="text-xl font-bold tracking-tight">Let’s move.</h1></div></div>
        <button onClick={() => setDark(!dark)} className="grid h-11 w-11 place-items-center rounded-2xl glass" aria-label="Toggle theme">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
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
          <div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Training plan</p><h3 className="mt-1 text-xl font-bold">{plan.planName}</h3></div>
          <div className="mt-7 flex items-center gap-5"><div className="ring-progress grid h-20 w-20 place-items-center rounded-full p-[6px]" style={{'--progress': `${(selectedWeek / plan.totalWeeks) * 100}%`} as React.CSSProperties}><div className="grid h-full w-full place-items-center rounded-full bg-white text-center dark:bg-[#161816]"><b className="text-lg leading-none">{selectedWeek}</b><span className="text-[10px] muted">OF {plan.totalWeeks}</span></div></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Week {selectedWeek} of {plan.totalWeeks}</p><div className="flex gap-1"><button onClick={() => changeWeek(-1)} disabled={selectedWeek === 1} className="rounded-lg p-1 disabled:opacity-25" aria-label="Previous week"><ChevronLeft size={16}/></button><button onClick={() => changeWeek(1)} disabled={selectedWeek === plan.totalWeeks} className="rounded-lg p-1 disabled:opacity-25" aria-label="Next week"><ChevronRight size={16}/></button></div></div><p className="mt-1 text-sm muted">{phase}</p><div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"><div className="h-full rounded-full bg-lime" style={{width: `${(selectedWeek / plan.totalWeeks) * 100}%`}}/></div></div></div>
          <div className="mt-6 border-t pt-5 text-sm dark:border-white/10"><span className="font-bold">{completedThisWeek} of {plan.weeklyGoal}</span><span className="muted"> sessions complete this week</span></div>
        </aside>
      </section>

      <section className="mb-5">
        <div className="glass rounded-4xl p-5 sm:p-7">
          <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Your workout</p><h2 className="mt-1 text-2xl font-bold">{selectedDayIndex === actualDayIndex ? 'Today’s' : `${workout.day}'s`} exercises</h2></div><span className="text-sm font-semibold text-zinc-500">{isSkipped ? 'Skipped' : isWorkoutComplete ? 'Complete' : `${completed.length}/${exercises.length} done`}</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"><div className="h-full rounded-full bg-lime transition-all duration-500" style={{width: `${percent}%`}}/></div>
          <div className={`mt-5 space-y-2 ${isSkipped ? 'opacity-40' : ''}`}>{exercises.map((ex, i) => { const target = getSetTarget(ex); const progress = setProgressByDay[workoutKey]?.[ex.id] ?? (completed.includes(ex.id) ? target : 0); return <ExerciseRow key={`${ex.id}-${i}`} exercise={ex} number={i + 1} checked={progress === target} progress={progress} target={target} onAdvance={() => advanceExercise(ex)} onPreview={() => setPreview({ name: ex.name, image: workoutImages[ex.id] })} /> })}</div>
          <button onClick={toggleSkip} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${isSkipped ? 'border-coral bg-coral text-white' : 'border-zinc-200 text-zinc-500 hover:border-coral hover:text-coral dark:border-white/10'}`}><SkipForward size={16}/>{isSkipped ? 'Undo skip' : 'Skip workout'}</button>
        </div>

      </section>

      <section className="glass mb-5 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Rest timer</p><h2 className="mt-1 text-xl font-bold">Recovery between sets</h2></div><Timer size={21} className="text-coral"/></div>
        <div className="mt-5"><div className="grid h-28 place-items-center rounded-3xl bg-ink text-5xl font-bold tabular-nums tracking-tight text-lime shadow-soft dark:bg-white dark:text-ink sm:h-32 sm:text-6xl">{restTime}</div><div className="mt-3 grid grid-cols-3 gap-3">{[60, 120, 180].map(seconds => <button key={seconds} onClick={() => chooseRestPreset(seconds)} className={`rounded-2xl py-4 text-base font-bold transition sm:py-5 ${restPreset === seconds ? 'bg-lime text-ink' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'}`}>{seconds / 60} min</button>)}</div></div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2"><button onClick={toggleRestTimer} className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-bold text-white transition hover:scale-[1.01] dark:bg-white dark:text-ink">{restRunning ? <><Pause size={17} fill="currentColor"/> Pause</> : <><Play size={17} fill="currentColor"/> {restRemaining === 0 ? 'Restart timer' : 'Start rest'}</>}</button><button onClick={() => { setRestRemaining(restPreset); setRestRunning(false) }} className="grid w-12 place-items-center rounded-2xl border border-zinc-200 text-zinc-500 transition hover:text-ink dark:border-white/10 dark:hover:text-white" aria-label="Reset rest timer"><RotateCcw size={18}/></button></div>
      </section>

      <section className="glass rounded-3xl px-5 py-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">This week</p><p className="mt-1 font-bold">Week {selectedWeek} of {plan.totalWeeks}</p></div><div className="flex items-center gap-1"><button onClick={() => changeWeek(-1)} disabled={selectedWeek === 1} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25" aria-label="Previous week"><ChevronLeft size={19}/></button><button onClick={() => changeWeek(1)} disabled={selectedWeek === plan.totalWeeks} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25" aria-label="Next week"><ChevronRight size={19}/></button></div></div><div className="mt-5 flex justify-between">{dayLabels.map((d, i) => { const key = `${selectedWeek}-${weekDayKeys[i]}`; const done = completedWorkouts.includes(key); return <button onClick={() => setSelectedDayIndex(i)} key={`${d}-${i}`} className="flex flex-col items-center gap-2"><span className="text-[11px] font-semibold muted">{dayNames[i]}</span><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition ${done ? 'bg-lime text-ink' : i === selectedDayIndex ? 'bg-ink text-white ring-2 ring-lime/60 dark:bg-white dark:text-ink' : 'bg-zinc-100 text-zinc-400 dark:bg-white/5'}`}>{done ? <Check size={15}/> : d}</span></button>})}</div></section>
      <button onClick={toggleWorkoutComplete} className={`relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition ${isWorkoutComplete ? 'border-lime bg-lime text-ink' : 'border-ink bg-ink text-white hover:scale-[1.01] dark:border-white dark:bg-white dark:text-ink'}`}><CircleCheck size={18}/>{isWorkoutComplete ? 'Undo today’s completion' : 'Completed Today’s Workout'}{celebrating && <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">{Array.from({ length: 26 }, (_, index) => <i key={index} className="confetti-piece" style={{ '--x': `${((index % 9) - 4) * 28}px`, '--y': `${-70 - (index % 5) * 18}px`, '--r': `${index * 27}deg`, animationDelay: `${(index % 6) * 24}ms`, backgroundColor: ['#d9ff43', '#ff5b50', '#ffffff', '#7dd3fc'][index % 4] } as React.CSSProperties}/>)}</span>}</button>
      {preview && <div onClick={() => setPreview(null)} className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><section onClick={event => event.stopPropagation()} className="glass w-full max-w-md overflow-hidden rounded-4xl p-5 dark:bg-[#181b18]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Exercise preview</p><h2 className="mt-1 text-xl font-bold">{preview.name}</h2></div><button onClick={() => setPreview(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 dark:bg-white/10" aria-label="Close preview"><X size={18}/></button></div>{preview.image ? <img src={preview.image} onError={() => setPreview(current => current ? { ...current, image: undefined } : null)} alt={preview.name} className="mt-5 max-h-[70vh] w-full rounded-md bg-black object-contain"/> : <div className="mt-5 grid aspect-video place-items-center rounded-md bg-zinc-100 text-center dark:bg-white/5"><div><ImageIcon className="mx-auto text-zinc-400" size={34}/><p className="mt-3 font-bold">No Image for workout</p><p className="mt-1 text-sm muted">An exercise image will be added soon.</p></div></div>}</section></div>}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0c0e0c]/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4"><p className="min-w-max text-xs font-bold uppercase tracking-[.15em] text-zinc-400">12-week progress</p><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${overallProgress}%` }}/></div><span className="text-sm font-bold text-lime">{overallProgress}%</span></div>
      </footer>
    </main>
  )
}

function ExerciseRow({ exercise, number, checked, progress, target, onAdvance, onPreview }: { exercise: Exercise; number: number; checked: boolean; progress: number; target: number; onAdvance: () => void; onPreview: () => void }) {
  return <div className={`flex w-full items-center gap-2 rounded-2xl border p-3 transition sm:gap-3 sm:p-4 ${checked ? 'border-lime/50 bg-lime/10' : 'border-transparent bg-zinc-50 hover:border-zinc-200 dark:bg-white/[.035] dark:hover:border-white/15'}`}><button onClick={onAdvance} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`${exercise.name}: ${checked ? 'reset progress' : 'complete next set'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-lime bg-lime text-ink' : 'border-zinc-300 dark:border-zinc-600'}`}>{checked ? <Check size={14} strokeWidth={3}/> : <span className="text-[10px] font-bold text-zinc-400">{number}</span>}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${checked ? 'line-through opacity-50' : ''}`}>{exercise.name}</span><span className="mt-0.5 block text-xs muted">{exercise.detail} <span className="mx-1">·</span> {exercise.load}</span><span className="mt-2 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"><span className="block h-full rounded-full bg-lime transition-all duration-300" style={{ width: `${(progress / target) * 100}%` }}/></span><span className="shrink-0 text-[11px] font-bold muted">{progress}/{target} {target === 1 ? 'set' : 'sets'}</span></span></span></button><button onClick={onPreview} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-zinc-500 shadow-sm transition hover:text-ink dark:bg-white/5 dark:hover:text-white" aria-label={`View image for ${exercise.name}`}><ImageIcon size={17}/></button><span className="hidden rounded-lg bg-white px-2 py-1 text-[11px] font-semibold muted shadow-sm dark:bg-white/5 md:block">{exercise.rest}</span></div>
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import plan from '@/data/training-plan.json'
import { Check, ChevronLeft, ChevronRight, CircleCheck, Dumbbell, Flame, Moon, Play, Settings2, SkipForward, Sun, Timer, Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Exercise = (typeof plan.schedule)[keyof typeof plan.schedule]['exercises'][number]

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const storageKey = 'pulse-training-progress-v2'

type SavedProgress = {
  completedByDay: Record<string, string[]>
  completedWorkouts: string[]
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
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([])
  const [skippedDays, setSkippedDays] = useState<string[]>([])
  const [notesByWorkout, setNotesByWorkout] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [dark, setDark] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const completed = completedByDay[workoutKey] ?? []
  const isWorkoutComplete = completedWorkouts.includes(workoutKey)
  const isSkipped = skippedDays.includes(workoutKey)
  const completedThisWeek = completedWorkouts.filter(key => key.startsWith(`${selectedWeek}-`)).length
  const notes = notesByWorkout[workoutKey] ?? workout.coachNote

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const progress = JSON.parse(saved) as Partial<SavedProgress>
        if (progress.completedByDay) setCompletedByDay(progress.completedByDay)
        if (progress.completedWorkouts) setCompletedWorkouts(progress.completedWorkouts)
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
    if (!hydrated) return
    const progress: SavedProgress = { completedByDay, completedWorkouts, skippedDays, notesByWorkout, selectedDayIndex, selectedWeek, dark }
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [completedByDay, completedWorkouts, dark, hydrated, notesByWorkout, selectedDayIndex, selectedWeek, skippedDays])
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
  const toggleSkip = () => {
    setSkippedDays(days => days.includes(workoutKey) ? days.filter(day => day !== workoutKey) : [...days, workoutKey])
    setCompletedWorkouts(days => days.filter(day => day !== workoutKey))
  }
  const toggleWorkoutComplete = () => {
    setCompletedWorkouts(days => days.includes(workoutKey) ? days.filter(day => day !== workoutKey) : [...days, workoutKey])
    setSkippedDays(days => days.filter(day => day !== workoutKey))
  }
  const changeWeek = (direction: number) => setSelectedWeek(week => Math.min(plan.totalWeeks, Math.max(1, week + direction)))
  const updateNotes = (note: string) => setNotesByWorkout(current => ({ ...current, [workoutKey]: note }))
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-5 sm:px-7 sm:pt-8">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-lime dark:bg-lime dark:text-ink"><Dumbbell size={21}/></div><div><p className="text-xs font-semibold uppercase tracking-[.18em] muted">Good morning, Mike</p><h1 className="text-xl font-bold tracking-tight">Let’s move.</h1></div></div>
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
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Training plan</p><h3 className="mt-1 text-xl font-bold">{plan.planName}</h3></div><button className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"><Settings2 size={18}/></button></div>
          <div className="mt-7 flex items-center gap-5"><div className="ring-progress grid h-20 w-20 place-items-center rounded-full p-[6px]" style={{'--progress': `${(selectedWeek / plan.totalWeeks) * 100}%`} as React.CSSProperties}><div className="grid h-full w-full place-items-center rounded-full bg-white text-center dark:bg-[#161816]"><b className="text-lg leading-none">{selectedWeek}</b><span className="text-[10px] muted">OF {plan.totalWeeks}</span></div></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Week {selectedWeek} of {plan.totalWeeks}</p><div className="flex gap-1"><button onClick={() => changeWeek(-1)} disabled={selectedWeek === 1} className="rounded-lg p-1 disabled:opacity-25" aria-label="Previous week"><ChevronLeft size={16}/></button><button onClick={() => changeWeek(1)} disabled={selectedWeek === plan.totalWeeks} className="rounded-lg p-1 disabled:opacity-25" aria-label="Next week"><ChevronRight size={16}/></button></div></div><p className="mt-1 text-sm muted">{phase}</p><div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10"><div className="h-full rounded-full bg-lime" style={{width: `${(selectedWeek / plan.totalWeeks) * 100}%`}}/></div></div></div>
          <div className="mt-6 border-t pt-5 text-sm dark:border-white/10"><span className="font-bold">{completedThisWeek} of {plan.weeklyGoal}</span><span className="muted"> sessions complete this week</span></div>
        </aside>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.45fr_.9fr]">
        <div className="glass rounded-4xl p-5 sm:p-7">
          <div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Your workout</p><h2 className="mt-1 text-2xl font-bold">{selectedDayIndex === actualDayIndex ? 'Today’s' : `${workout.day}'s`} exercises</h2></div><span className="text-sm font-semibold text-zinc-500">{isSkipped ? 'Skipped' : isWorkoutComplete ? 'Complete' : `${completed.length}/${exercises.length} done`}</span></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10"><div className="h-full rounded-full bg-lime transition-all duration-500" style={{width: `${percent}%`}}/></div>
          <div className={`mt-5 space-y-2 ${isSkipped ? 'opacity-40' : ''}`}>{exercises.map((ex, i) => <ExerciseRow key={`${ex.id}-${i}`} exercise={ex} number={i + 1} checked={completed.includes(ex.id)} onToggle={() => toggle(ex.id)} />)}</div>
          <button onClick={toggleSkip} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${isSkipped ? 'border-coral bg-coral text-white' : 'border-zinc-200 text-zinc-500 hover:border-coral hover:text-coral dark:border-white/10'}`}><SkipForward size={16}/>{isSkipped ? 'Undo skip' : 'Skip workout'}</button>
        </div>

        <div className="space-y-5">
          <section className={`rounded-4xl p-6 text-white shadow-soft ${running ? 'bg-[#26483f]' : 'bg-[#1c3029]'}`}>
            <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.16em] text-lime">RUNNING WORKOUT</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">{time}</span></div>
            <h3 className="mt-6 text-xl font-bold">{running ? 'You’re in the zone.' : 'Ready when you are.'}</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">{runFocus ? <><span className="font-medium text-white">{runFocus}</span><br/>Up next: </> : 'Up next: '}<span className="font-medium text-white">{next.name}</span></p>
            <Button onClick={() => setRunning(!running)} className="mt-6 w-full gap-2">{running ? <><X size={17}/> Pause workout</> : <><Play size={17} fill="currentColor"/> Start workout</>}</Button>
          </section>
          <section className="glass rounded-4xl p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">Coach’s notes</p><h3 className="mt-1 text-lg font-bold">Today’s intention</h3></div><Trophy size={19} className="text-coral"/></div><textarea value={notes} onChange={e => updateNotes(e.target.value)} className="mt-4 min-h-24 w-full resize-none rounded-2xl bg-zinc-100 p-3 text-sm leading-6 outline-none ring-lime focus:ring-2 dark:bg-white/5"/><p className="mt-3 text-xs muted">Saved privately on this device.</p></section>
        </div>
      </section>

      <section className="glass rounded-3xl px-5 py-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] muted">This week</p><p className="mt-1 font-bold">Tap a day to view and mark it complete.</p></div><ChevronRight className="muted"/></div><div className="mt-5 flex justify-between">{dayLabels.map((d, i) => { const key = `${selectedWeek}-${weekDayKeys[i]}`; const done = completedWorkouts.includes(key); return <button onClick={() => setSelectedDayIndex(i)} key={`${d}-${i}`} className="flex flex-col items-center gap-2"><span className="text-[11px] font-semibold muted">{dayNames[i]}</span><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition ${done ? 'bg-lime text-ink' : i === selectedDayIndex ? 'bg-ink text-white ring-2 ring-lime/60 dark:bg-white dark:text-ink' : 'bg-zinc-100 text-zinc-400 dark:bg-white/5'}`}>{done ? <Check size={15}/> : d}</span></button>})}</div></section>
      <button onClick={toggleWorkoutComplete} className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition ${isWorkoutComplete ? 'border-lime bg-lime text-ink' : 'border-ink bg-ink text-white hover:scale-[1.01] dark:border-white dark:bg-white dark:text-ink'}`}><CircleCheck size={18}/>{isWorkoutComplete ? 'Undo workout day' : 'Workout Day Done'}</button>
    </main>
  )
}

function ExerciseRow({ exercise, number, checked, onToggle }: { exercise: Exercise; number: number; checked: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:gap-4 sm:p-4 ${checked ? 'border-lime/50 bg-lime/10' : 'border-transparent bg-zinc-50 hover:border-zinc-200 dark:bg-white/[.035] dark:hover:border-white/15'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-lime bg-lime text-ink' : 'border-zinc-300 dark:border-zinc-600'}`}>{checked ? <Check size={14} strokeWidth={3}/> : <span className="text-[10px] font-bold text-zinc-400">{number}</span>}</span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${checked ? 'line-through opacity-50' : ''}`}>{exercise.name}</span><span className="mt-0.5 block text-xs muted">{exercise.detail} <span className="mx-1">·</span> {exercise.load}</span></span><span className="hidden rounded-lg bg-white px-2 py-1 text-[11px] font-semibold muted shadow-sm dark:bg-white/5 sm:block">{exercise.rest}</span></button>
}

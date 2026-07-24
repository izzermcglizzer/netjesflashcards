import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { TabLayout } from './components/TabLayout'

const DeckSelectScreen = lazy(() =>
  import('./features/deckSelect/DeckSelectScreen').then((m) => ({ default: m.DeckSelectScreen })),
)
const HomeDashboard = lazy(() => import('./features/home/HomeDashboard').then((m) => ({ default: m.HomeDashboard })))
const StudySessionShell = lazy(() =>
  import('./features/study/StudySessionShell').then((m) => ({ default: m.StudySessionShell })),
)
const QuickRecapSession = lazy(() =>
  import('./features/study/QuickRecapSession').then((m) => ({ default: m.QuickRecapSession })),
)
const LearnNewWordsSession = lazy(() =>
  import('./features/study/LearnNewWordsSession').then((m) => ({ default: m.LearnNewWordsSession })),
)
const SessionSummary = lazy(() =>
  import('./features/summary/SessionSummary').then((m) => ({ default: m.SessionSummary })),
)
const RankUpExam = lazy(() => import('./features/rankup/RankUpExam').then((m) => ({ default: m.RankUpExam })))
const RankUpResult = lazy(() => import('./features/rankup/RankUpResult').then((m) => ({ default: m.RankUpResult })))
const StatsAchievements = lazy(() =>
  import('./features/stats/StatsAchievements').then((m) => ({ default: m.StatsAchievements })),
)
const ChapterBrowser = lazy(() =>
  import('./features/browse/ChapterBrowser').then((m) => ({ default: m.ChapterBrowser })),
)
const SettingsPage = lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <p className="text-ink-light">Loading...</p>
        </div>
      }
    >
      {element}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <TabLayout />,
    children: [
      { path: '/', element: withSuspense(<DeckSelectScreen />) },
      { path: '/deck/:deckId', element: withSuspense(<HomeDashboard />) },
      { path: '/stats', element: withSuspense(<StatsAchievements />) },
      { path: '/settings', element: withSuspense(<SettingsPage />) },
    ],
  },
  { path: '/deck/:deckId/study/:mode', element: withSuspense(<StudySessionShell />) },
  { path: '/deck/:deckId/quick-recap', element: withSuspense(<QuickRecapSession />) },
  { path: '/deck/:deckId/learn', element: withSuspense(<LearnNewWordsSession />) },
  { path: '/deck/:deckId/summary', element: withSuspense(<SessionSummary />) },
  { path: '/deck/:deckId/rank-up', element: withSuspense(<RankUpExam />) },
  { path: '/deck/:deckId/rank-up/result', element: withSuspense(<RankUpResult />) },
  { path: '/deck/:deckId/browse', element: withSuspense(<ChapterBrowser />) },
], {
  basename: import.meta.env.BASE_URL,
})

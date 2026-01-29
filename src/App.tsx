import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MoviesPage } from './components/MoviesPage'
import { WorkflowsPage } from './components/WorkflowsPage'
import { AnalyticsPage } from './components/AnalyticsPage'
import { ReportsPage } from './components/ReportsPage'
import { CapturePage } from './components/CapturePage'
import { ThemeToggle } from './components/ThemeToggle'
import { NavMenu } from './components/NavMenu'
import { ThemeProvider } from './components/ThemeProvider'

function App() {

  return (
    <ThemeProvider>
      <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <div className="flex-shrink-0 p-6">
          {/* Header */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-between">
            <NavMenu />
            <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Digest Admin Portal
            </h1>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content - fills remaining space */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <Routes>
            <Route path="/" element={<Navigate to="/movies" replace />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reporting" element={<ReportsPage />} />
            <Route path="/capture/:review_id?" element={<CapturePage />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App

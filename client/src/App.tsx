import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PromptsProvider } from '@/contexts/PromptsContext'
import Layout from '@/components/Layout'
import FrontPage from '@/pages/FrontPage'
import SettingsPage from '@/pages/SettingsPage'
import DiscoverPage from '@/pages/DiscoverPage'
import DonatePage from '@/pages/DonatePage'
import RefinementPage from '@/pages/RefinementPage'

export default function App() {
  return (
    <ThemeProvider>
      <PromptsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<FrontPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/refine" element={<RefinementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/donate" element={<DonatePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PromptsProvider>
    </ThemeProvider>
  )
}

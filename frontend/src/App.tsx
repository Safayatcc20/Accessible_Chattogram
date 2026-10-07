import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { AdminGuard } from '@/components/layout/AdminGuard'
import Home from '@/pages/Home'
import Explore from '@/pages/Explore'
import PlaceDetails from '@/pages/PlaceDetails'
import Contribute from '@/pages/Contribute'
import Guide from '@/pages/Guide'
import About from '@/pages/About'
import NotFound from '@/pages/NotFound'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"           element={<Layout><Home /></Layout>} />
        <Route path="/explore"    element={<Layout fullHeight><Explore /></Layout>} />
        <Route path="/places/:id" element={<Layout><PlaceDetails /></Layout>} />
        <Route path="/contribute" element={<Layout><Contribute /></Layout>} />
        <Route path="/guide"      element={<Layout><Guide /></Layout>} />
        <Route path="/about"      element={<Layout><About /></Layout>} />

        {/* Admin routes — login is public, dashboard requires AdminGuard */}
        <Route
          path="/admin/login"
          element={<Layout><AdminLogin /></Layout>}
        />
        <Route
          path="/admin"
          element={
            <Layout>
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            </Layout>
          }
        />

        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}




/*
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/toaster'
import Home from '@/pages/Home'
import Explore from '@/pages/Explore'
import PlaceDetails from '@/pages/PlaceDetails'
import Contribute from '@/pages/Contribute'
import Guide from '@/pages/Guide'
import About from '@/pages/About'
import NotFound from '@/pages/NotFound'

function Layout({ children, fullHeight = false }: { children: React.ReactNode; fullHeight?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className={fullHeight ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1'}>
        {children}
      </div>
      {!fullHeight && <Footer />}
      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Home />
          </Layout>
        } />
        <Route path="/explore" element={
          <Layout fullHeight>
            <Explore />
          </Layout>
        } />
        <Route path="/places/:id" element={
          <Layout>
            <PlaceDetails />
          </Layout>
        } />
        <Route path="/contribute" element={
          <Layout>
            <Contribute />
          </Layout>
        } />
        <Route path="/guide" element={
          <Layout>
            <Guide />
          </Layout>
        } />
        <Route path="/about" element={
          <Layout>
            <About />
          </Layout>
        } />
        <Route path="*" element={
          <Layout>
            <NotFound />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
*/
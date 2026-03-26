
import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { I18nProvider } from './contexts/I18nContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SidebarTopBar from './components/SidebarTopBar';
import Footer from './components/Footer';

// Lazy load des pages pour le code splitting
const Hero = lazy(() => import('./components/Hero'));
const InvoiceForm = lazy(() => import('./components/InvoiceForm'));
const QuoteForm = lazy(() => import('./components/QuoteForm'));
const About = lazy(() => import('./components/About'));
const Contact = lazy(() => import('./components/Contact'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogPost = lazy(() => import('./components/BlogPost'));
const Admin = lazy(() => import('./components/Admin'));
const Pricing = lazy(() => import('./components/Pricing'));

// Composant de chargement
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Shared routes block
const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route index element={<Hero />} />
      <Route path="create" element={<InvoiceForm />} />
      <Route path="quote" element={<QuoteForm />} />
      <Route path="pricing" element={<Pricing />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="settings" element={<Settings />} />
      <Route path="blog" element={<BlogList />} />
      <Route path="blog/:slug" element={<BlogPost />} />
      <Route path="admin/*" element={<Admin />} />
    </Routes>
  </Suspense>
);

// Layout wrapping I18nProvider (needs to be inside Router for useParams)
const LangLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loader while auth state is resolving to avoid layout flash
  if (loading) {
    return (
      <I18nProvider>
        <PageLoader />
      </I18nProvider>
    );
  }

  // Logged-in: sidebar layout (fixed on xl+, slide-out below)
  if (user) {
    return (
      <I18nProvider>
        <div className="min-h-screen bg-slate-50 font-sans">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <SidebarTopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <div className="xl:pl-64 flex flex-col min-h-screen">
            <main className="flex-grow">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </div>
      </I18nProvider>
    );
  }

  // Not logged in: classic navbar layout
  return (
    <I18nProvider>
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  );
};

// Redirect helper that detects user language
const LangRedirect: React.FC = () => {
  const stored = localStorage.getItem('factumation-lang');
  const lang = stored === 'en' ? 'en' : stored === 'fr' ? 'fr' : (navigator.language.slice(0, 2) === 'en' ? 'en' : 'fr');
  // Preserve search params and hash (needed for OAuth callback tokens)
  return <Navigate to={`/${lang}${window.location.search}${window.location.hash}`} replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/:lang/*" element={<LangLayout />} />
            <Route path="*" element={<LangRedirect />} />
          </Routes>
        </BrowserRouter>
      </SubscriptionProvider>
    </AuthProvider>
  );
};

export default App;

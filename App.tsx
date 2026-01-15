
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import InvoiceForm from './components/InvoiceForm';
import QuoteForm from './components/QuoteForm';
import About from './components/About';
import Contact from './components/Contact';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/create" element={<InvoiceForm />} />
            <Route path="/quote" element={<QuoteForm />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;

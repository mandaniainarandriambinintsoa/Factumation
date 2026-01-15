import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary-950 mb-6">
            La facturation simplifiée pour les <span className="text-primary-500">professionnels</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
            Créez, gérez et envoyez des factures élégantes en quelques secondes. 
            Aucune inscription complexe requise. Connectez vos outils via Webhook.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/create"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary-900 hover:bg-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Créer une facture
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/quote"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-white bg-primary-500 hover:bg-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Créer un devis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          <div className="mt-4">
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-primary-900 hover:text-primary-700 transition-colors"
            >
              En savoir plus
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              100% Gratuit
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Pas de carte requise
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Export Webhook
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
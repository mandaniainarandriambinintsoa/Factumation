
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Workflow, Database, Zap, Shield, FileText, ArrowRight, Users, Building2, History, Mail, LogIn } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold sm:text-5xl mb-6">À propos de FactuPro</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Une solution de facturation et devis nouvelle génération, conçue pour simplifier la gestion administrative des freelances et des PME grâce à la puissance de l'automatisation.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        
        {/* Intro & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">L'innovation au service de votre temps</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              FactuPro n'est pas qu'un simple éditeur de factures. C'est une démonstration technique d'une application web moderne intégrant les dernières technologies d'IA et d'automatisation No-Code.
            </p>
            <ul className="space-y-4">
              {[
                { icon: FileText, text: "Création de factures et devis professionnels" },
                { icon: Zap, text: "Rapidité d'exécution et interface fluide" },
                { icon: Mail, text: "Envoi direct par email avec PDF en pièce jointe" },
                { icon: Shield, text: "Automatisation sécurisée des processus" },
              ].map((item, index) => (
                <li key={index} className="flex items-center text-slate-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mr-4">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary-200 rounded-2xl transform rotate-3 scale-95 opacity-50"></div>
            <div className="relative bg-slate-50 p-8 rounded-2xl shadow-lg border border-slate-100">
              <div className="space-y-6">
                <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-32 bg-white rounded border border-slate-200 p-4 flex items-center justify-center text-slate-400">
                  Aperçu Facture
                </div>
                <div className="flex justify-between">
                  <div className="h-8 w-24 bg-primary-100 rounded"></div>
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features with Account */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Fonctionnalités avec un compte</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
              Créez un compte gratuit pour débloquer des fonctionnalités avancées et gagner encore plus de temps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: "Carnet de clients",
                description: "Enregistrez vos clients et remplissez automatiquement leurs informations dans vos documents.",
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                icon: Building2,
                title: "Multi-sociétés",
                description: "Gérez plusieurs entreprises et basculez facilement entre elles lors de la création de documents.",
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                icon: History,
                title: "Historique",
                description: "Retrouvez toutes vos factures et devis sauvegardés. Téléchargez-les à tout moment.",
                color: "text-amber-600",
                bg: "bg-amber-50"
              },
              {
                icon: Mail,
                title: "Envoi par email",
                description: "Envoyez vos documents directement par email avec le PDF en pièce jointe.",
                color: "text-green-600",
                bg: "bg-green-50"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-300">
                <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Connexion rapide avec Google ou création de compte par email.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Notre Stack Technologique</h2>
            <p className="mt-4 text-slate-500">Les outils puissants qui propulsent cette application.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "Claude Code",
                description: "L'assistant IA d'Anthropic qui génère le code, le design et optimise l'expérience utilisateur.",
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                icon: Database,
                title: "Supabase",
                description: "La plateforme backend open-source pour l'authentification, la base de données et le stockage.",
                color: "text-green-600",
                bg: "bg-green-50"
              },
              {
                icon: Workflow,
                title: "n8n + Brevo",
                description: "Automatisation des workflows et envoi d'emails transactionnels professionnels.",
                color: "text-pink-600",
                bg: "bg-pink-50"
              }
            ].map((tech, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 text-center">
                <div className={`w-16 h-16 mx-auto ${tech.bg} rounded-full flex items-center justify-center mb-6`}>
                  <tech.icon className={`w-8 h-8 ${tech.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{tech.title}</h3>
                <p className="text-slate-600 leading-relaxed">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission CTA */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500 rounded-full opacity-20 filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500 rounded-full opacity-20 filter blur-3xl"></div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Prêt à simplifier votre gestion ?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
              Rejoignez l'ère de l'automatisation. Créez vos factures et devis professionnels dès maintenant, sans inscription.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/create"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-slate-900 rounded-full font-semibold hover:bg-slate-100 transition-colors"
              >
                Créer une facture
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                to="/quote"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-400 transition-colors"
              >
                Créer un devis
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;

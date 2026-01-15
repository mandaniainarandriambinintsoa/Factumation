import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Building2, Mail, Phone, MapPin, X, Check, Loader2, Star } from 'lucide-react';
import { getCompanies, createCompany, MappedCompany } from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';

interface CompanySelectorProps {
  onSelectCompany: (company: {
    companyName: string;
    companyEmail: string;
    companyAddress: string;
    companyPhone: string;
    logoUrl?: string;
    currency?: string;
    paymentMethod?: string;
    invoicePrefix?: string;
    quotePrefix?: string;
    // Informations fiscales
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => void;
  currentCompanyName?: string;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ onSelectCompany, currentCompanyName }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companies, setCompanies] = useState<MappedCompany[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<MappedCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    siret: '',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les sociétés au montage
  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user]);

  // Filtrer les sociétés selon la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter(
          company =>
            company.name.toLowerCase().includes(query) ||
            (company.email && company.email.toLowerCase().includes(query)) ||
            (company.siret && company.siret.includes(query))
        )
      );
    }
  }, [searchQuery, companies]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewCompanyForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await getCompanies();
    if (!error) {
      setCompanies(data);
      setFilteredCompanies(data);
    }
    setLoading(false);
  };

  const handleSelectCompany = (company: MappedCompany) => {
    onSelectCompany({
      companyName: company.name,
      companyEmail: company.email || '',
      companyAddress: company.address || '',
      companyPhone: company.phone || '',
      logoUrl: company.logoUrl,
      currency: company.defaultCurrency,
      paymentMethod: company.defaultPaymentMethod,
      invoicePrefix: company.invoicePrefix,
      quotePrefix: company.quotePrefix,
      // Informations fiscales
      fiscalRegion: company.fiscalRegion,
      siret: company.siret,
      vatNumber: company.vatNumber,
      nif: company.nif,
      stat: company.stat,
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name) return;

    setSavingCompany(true);

    const { data, error } = await createCompany({
      name: newCompany.name,
      email: newCompany.email || null,
      address: newCompany.address || null,
      phone: newCompany.phone || null,
      siret: newCompany.siret || null,
      isDefault: companies.length === 0, // Première société = par défaut
    });

    if (error) {
      console.error('Erreur lors de la création de la société:', error);
      alert('Erreur lors de la création de la société: ' + error);
      setSavingCompany(false);
      return;
    }

    if (data) {
      // Ajouter la nouvelle société à la liste
      setCompanies(prev => [data, ...prev]);

      // Sélectionner automatiquement la nouvelle société
      onSelectCompany({
        companyName: data.name,
        companyEmail: data.email || '',
        companyAddress: data.address || '',
        companyPhone: data.phone || '',
        logoUrl: data.logoUrl,
        currency: data.defaultCurrency,
        paymentMethod: data.defaultPaymentMethod,
        invoicePrefix: data.invoicePrefix,
        quotePrefix: data.quotePrefix,
        // Informations fiscales
        fiscalRegion: data.fiscalRegion,
        siret: data.siret,
        vatNumber: data.vatNumber,
        nif: data.nif,
        stat: data.stat,
      });

      // Réinitialiser le formulaire
      setNewCompany({ name: '', email: '', address: '', phone: '', siret: '' });
      setShowNewCompanyForm(false);
      setIsOpen(false);
    }

    setSavingCompany(false);
  };

  // Si l'utilisateur n'est pas connecté, ne pas afficher le sélecteur
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton d'ouverture */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNewCompanyForm(false);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
      >
        <Building2 size={16} />
        Mes sociétés
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-[calc(100vw-2rem)] sm:w-96 right-0 sm:right-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
          {!showNewCompanyForm ? (
            <>
              {/* Barre de recherche */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une société..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Liste des sociétés */}
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="py-8 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {searchQuery ? 'Aucune société trouvée' : 'Aucune société enregistrée'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Créez votre première société pour commencer
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleSelectCompany(company)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          currentCompanyName === company.name ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">{company.name}</p>
                            {company.isDefault && (
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                            {currentCompanyName === company.name && (
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                          {company.email && (
                            <p className="text-sm text-slate-500 truncate">{company.email}</p>
                          )}
                          {company.siret && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              SIRET: {company.siret}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton nouvelle société */}
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <Plus size={16} />
                  Nouvelle société
                </button>
              </div>
            </>
          ) : (
            /* Formulaire nouvelle société - using div instead of form to avoid nested forms */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Nouvelle société</h3>
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nom de la société *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ma Société SARL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={newCompany.email}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="contact@masociete.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      value={newCompany.address}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Adresse complète"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={newCompany.phone}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      SIRET
                    </label>
                    <input
                      type="text"
                      value={newCompany.siret}
                      onChange={(e) => setNewCompany(prev => ({ ...prev, siret: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="123 456 789 00012"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCompanyForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateCompany}
                  disabled={savingCompany || !newCompany.name}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {savingCompany ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Créer la société
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySelector;

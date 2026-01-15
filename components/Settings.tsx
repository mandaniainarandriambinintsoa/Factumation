import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Building2, Mail, Phone, MapPin, Image, AlertCircle, CheckCircle2, Settings as SettingsIcon, Plus, Trash2, Star, Edit3, X, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCompanies, createCompany, updateCompany, deleteCompany, setDefaultCompany, MappedCompany } from '../services/companyService';
import { CURRENCIES, PAYMENT_METHODS, FISCAL_REGIONS } from '../constants';

const Settings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState<MappedCompany[]>([]);
  const [editingCompany, setEditingCompany] = useState<MappedCompany | null>(null);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    logoUrl: '',
    fiscalRegion: 'NONE',
    siret: '',
    vatNumber: '',
    nif: '',
    stat: '',
    iban: '',
    bic: '',
    defaultCurrency: 'EUR',
    defaultPaymentMethod: 'Virement Bancaire',
    invoicePrefix: 'INV',
    quotePrefix: 'DEV',
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user]);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await getCompanies();

    if (error) {
      setError(error);
    } else {
      setCompanies(data);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      email: '',
      phone: '',
      logoUrl: '',
      fiscalRegion: 'NONE',
      siret: '',
      vatNumber: '',
      nif: '',
      stat: '',
      iban: '',
      bic: '',
      defaultCurrency: 'EUR',
      defaultPaymentMethod: 'Virement Bancaire',
      invoicePrefix: 'INV',
      quotePrefix: 'DEV',
      isDefault: false,
    });
  };

  const handleEdit = (company: MappedCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      email: company.email || '',
      phone: company.phone || '',
      logoUrl: company.logoUrl || '',
      fiscalRegion: company.fiscalRegion || 'NONE',
      siret: company.siret || '',
      vatNumber: company.vatNumber || '',
      nif: company.nif || '',
      stat: company.stat || '',
      iban: company.iban || '',
      bic: company.bic || '',
      defaultCurrency: company.defaultCurrency,
      defaultPaymentMethod: company.defaultPaymentMethod,
      invoicePrefix: company.invoicePrefix,
      quotePrefix: company.quotePrefix,
      isDefault: company.isDefault,
    });
    setShowNewCompanyForm(false);
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    resetForm();
  };

  const handleStartNew = () => {
    setEditingCompany(null);
    resetForm();
    setShowNewCompanyForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Le nom de la société est requis');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    if (editingCompany) {
      // Update existing company
      const { data, error } = await updateCompany(editingCompany.id, {
        name: formData.name,
        address: formData.address || null,
        email: formData.email || null,
        phone: formData.phone || null,
        logoUrl: formData.logoUrl || null,
        fiscalRegion: formData.fiscalRegion || 'NONE',
        siret: formData.siret || null,
        vatNumber: formData.vatNumber || null,
        nif: formData.nif || null,
        stat: formData.stat || null,
        iban: formData.iban || null,
        bic: formData.bic || null,
        defaultCurrency: formData.defaultCurrency,
        defaultPaymentMethod: formData.defaultPaymentMethod,
        invoicePrefix: formData.invoicePrefix,
        quotePrefix: formData.quotePrefix,
        isDefault: formData.isDefault,
      });

      if (error) {
        setError(error);
      } else if (data) {
        setCompanies(prev => prev.map(c => c.id === data.id ? data : (formData.isDefault ? { ...c, isDefault: false } : c)));
        setSuccess(true);
        setEditingCompany(null);
        resetForm();
        setTimeout(() => setSuccess(false), 3000);
      }
    } else {
      // Create new company
      const { data, error } = await createCompany({
        name: formData.name,
        address: formData.address || null,
        email: formData.email || null,
        phone: formData.phone || null,
        logoUrl: formData.logoUrl || null,
        fiscalRegion: formData.fiscalRegion || 'NONE',
        siret: formData.siret || null,
        vatNumber: formData.vatNumber || null,
        nif: formData.nif || null,
        stat: formData.stat || null,
        iban: formData.iban || null,
        bic: formData.bic || null,
        defaultCurrency: formData.defaultCurrency,
        defaultPaymentMethod: formData.defaultPaymentMethod,
        invoicePrefix: formData.invoicePrefix,
        quotePrefix: formData.quotePrefix,
        isDefault: companies.length === 0 || formData.isDefault,
      });

      if (error) {
        setError(error);
      } else if (data) {
        if (data.isDefault) {
          setCompanies(prev => [...prev.map(c => ({ ...c, isDefault: false })), data]);
        } else {
          setCompanies(prev => [...prev, data]);
        }
        setSuccess(true);
        setShowNewCompanyForm(false);
        resetForm();
        setTimeout(() => setSuccess(false), 3000);
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette société ?')) return;

    setDeletingId(id);
    const { error } = await deleteCompany(id);

    if (error) {
      setError(error);
    } else {
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (editingCompany?.id === id) {
        setEditingCompany(null);
        resetForm();
      }
    }

    setDeletingId(null);
  };

  const handleSetDefault = async (id: string) => {
    const { data, error } = await setDefaultCompany(id);

    if (error) {
      setError(error);
    } else if (data) {
      setCompanies(prev => prev.map(c => ({
        ...c,
        isDefault: c.id === id
      })));
    }
  };

  const inputClass = "block w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-3 px-4 bg-white border transition-shadow";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Mes Sociétés</h1>
        </div>
        <p className="text-slate-600">
          Gérez vos différentes sociétés. Chaque société peut avoir ses propres informations de facturation.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-800">Société sauvegardée avec succès !</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des sociétés */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Sociétés</h2>
              <button
                type="button"
                onClick={handleStartNew}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Ajouter une société"
              >
                <Plus size={20} />
              </button>
            </div>

            {companies.length === 0 && !showNewCompanyForm ? (
              <div className="p-8 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Aucune société enregistrée</p>
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                >
                  <Plus size={16} />
                  Créer ma première société
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {companies.map(company => (
                  <div
                    key={company.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      editingCompany?.id === company.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                    onClick={() => handleEdit(company)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{company.name}</p>
                          {company.isDefault && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        {company.email && (
                          <p className="text-sm text-slate-500 truncate">{company.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!company.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(company.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors"
                            title="Définir par défaut"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(company.id);
                          }}
                          disabled={deletingId === company.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingId === company.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'édition */}
        <div className="lg:col-span-2">
          {(editingCompany || showNewCompanyForm) ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header du formulaire */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    {editingCompany ? (
                      <>
                        <Edit3 className="w-5 h-5 text-primary-600" />
                        Modifier la société
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-primary-600" />
                        Nouvelle société
                      </>
                    )}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Nom de la société *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Ex: Ma Société SAS"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Adresse complète</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={inputClass}
                      placeholder="123 Rue de l'Innovation&#10;75001 Paris&#10;France"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>
                        <Mail className="w-4 h-4 inline mr-1.5" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="contact@masociete.com"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        <Phone className="w-4 h-4 inline mr-1.5" />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <Image className="w-4 h-4 inline mr-1.5" />
                      URL du Logo
                    </label>
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="https://example.com/logo.png"
                    />
                    {formData.logoUrl && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-2">Aperçu :</p>
                        <img
                          src={formData.logoUrl}
                          alt="Aperçu du logo"
                          className="h-16 w-auto object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations fiscales */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Informations fiscales & bancaires
                </h3>

                {/* Sélecteur de région fiscale */}
                <div className="mb-6">
                  <label className={labelClass}>Type de société / Région fiscale</label>
                  <select
                    name="fiscalRegion"
                    value={formData.fiscalRegion}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champs fiscaux conditionnels selon la région */}
                {formData.fiscalRegion === 'EU' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className={labelClass}>SIRET</label>
                      <input
                        type="text"
                        name="siret"
                        value={formData.siret}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="14 chiffres"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>N° TVA Intracommunautaire</label>
                      <input
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="FR + 11 chiffres"
                      />
                    </div>
                  </div>
                )}

                {formData.fiscalRegion === 'MG' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <label className={labelClass}>NIF (Numéro d'Identification Fiscale)</label>
                      <input
                        type="text"
                        name="nif"
                        value={formData.nif}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Numéro NIF"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>STAT (Numéro Statistique)</label>
                      <input
                        type="text"
                        name="stat"
                        value={formData.stat}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Numéro STAT"
                      />
                    </div>
                  </div>
                )}

                {/* Informations bancaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>IBAN</label>
                    <input
                      type="text"
                      name="iban"
                      value={formData.iban}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="FR76 1234 5678 9012 3456 7890 123"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>BIC</label>
                    <input
                      type="text"
                      name="bic"
                      value={formData.bic}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="BNPAFRPP"
                    />
                  </div>
                </div>
              </div>

              {/* Préférences par défaut */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-primary-600" />
                  Préférences de facturation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Devise par défaut</label>
                    <select
                      name="defaultCurrency"
                      value={formData.defaultCurrency}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.symbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Méthode de paiement</label>
                    <select
                      name="defaultPaymentMethod"
                      value={formData.defaultPaymentMethod}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Préfixe factures</label>
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="INV"
                      maxLength={10}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Ex: {formData.invoicePrefix || 'INV'}-2026-001
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Préfixe devis</label>
                    <input
                      type="text"
                      name="quotePrefix"
                      value={formData.quotePrefix}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="DEV"
                      maxLength={10}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Ex: {formData.quotePrefix || 'DEV'}-2026-001
                    </p>
                  </div>
                </div>

                {/* Checkbox par défaut */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-700">
                      <Star className="w-4 h-4 inline mr-1 text-amber-500" />
                      Définir comme société par défaut
                    </span>
                  </label>
                  <p className="mt-1.5 ml-7 text-xs text-slate-500">
                    La société par défaut sera pré-sélectionnée lors de la création de factures et devis
                  </p>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 text-slate-600 font-medium rounded-full hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 bg-primary-900 text-white font-semibold rounded-full hover:bg-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-5 w-5" />
                      {editingCompany ? 'Mettre à jour' : 'Créer la société'}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Sélectionnez une société
              </h3>
              <p className="text-slate-500 mb-6">
                Cliquez sur une société dans la liste pour modifier ses informations, ou créez-en une nouvelle.
              </p>
              <button
                type="button"
                onClick={handleStartNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-semibold rounded-full hover:bg-primary-800 transition-colors"
              >
                <Plus size={20} />
                Nouvelle société
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

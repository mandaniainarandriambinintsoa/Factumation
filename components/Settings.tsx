import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Building2, Mail, Phone, MapPin, Image, AlertCircle, CheckCircle2, Settings as SettingsIcon, Plus, Trash2, Star, Edit3, X, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useLocalizedPath } from '../hooks/useLocalizedPath';
import SEOHead from './SEOHead';
import { getCompanies, createCompany, updateCompany, deleteCompany, setDefaultCompany, MappedCompany } from '../services/companyService';
import { CURRENCIES, PAYMENT_METHODS, FISCAL_REGIONS } from '../constants';

const Settings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { path } = useLocalizedPath();
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
    defaultPaymentMethod: 'bank_transfer',
    invoicePrefix: 'INV',
    quotePrefix: 'DEV',
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(path('/'));
    }
  }, [user, authLoading, navigate, path]);

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
      defaultPaymentMethod: 'bank_transfer',
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
      setError(t('settings.companyNameRequired'));
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
      <SEOHead title={t('seo.settingsTitle')} description={t('seo.settingsDescription')} path="/settings" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{t('settings.companiesTitle')}</h1>
        </div>
        <p className="text-slate-600">
          {t('settings.subtitle')}
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
          <p className="text-sm text-green-800">{t('settings.saved')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des sociétés */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{t('settings.companiesTitle')}</h2>
              <button
                type="button"
                onClick={handleStartNew}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title={t('settings.addCompany')}
              >
                <Plus size={20} />
              </button>
            </div>

            {companies.length === 0 && !showNewCompanyForm ? (
              <div className="p-8 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">{t('settings.noCompanies')}</p>
                <button
                  type="button"
                  onClick={handleStartNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                >
                  <Plus size={16} />
                  {t('settings.addCompany')}
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
                            title={t('settings.setDefault')}
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
                          title={t('settings.delete')}
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
                        {t('settings.editCompany')}
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-primary-600" />
                        {t('settings.newCompany')}
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
                    <label className={labelClass}>{t('settings.companyName')} *</label>
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
                    <label className={labelClass}>{t('settings.address')}</label>
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
                        {t('settings.emailLabel')}
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
                        {t('settings.phoneLabel')}
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
                      {t('settings.logoUrl')}
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
                  {t('settings.bankInfo')}
                </h3>

                {/* Sélecteur de région fiscale */}
                <div className="mb-6">
                  <label className={labelClass}>{t('settings.fiscalRegion')}</label>
                  <select
                    name="fiscalRegion"
                    value={formData.fiscalRegion}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>
                        {t(region.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champs fiscaux conditionnels selon la région */}
                {formData.fiscalRegion === 'EU' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className={labelClass}>{t('constants.siret')}</label>
                      <input
                        type="text"
                        name="siret"
                        value={formData.siret}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={t('constants.siretPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('constants.tvaNumber')}</label>
                      <input
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={t('constants.tvaPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {formData.fiscalRegion === 'MG' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <label className={labelClass}>{t('constants.nif')}</label>
                      <input
                        type="text"
                        name="nif"
                        value={formData.nif}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={t('constants.nifPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('constants.stat')}</label>
                      <input
                        type="text"
                        name="stat"
                        value={formData.stat}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder={t('constants.statPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Informations bancaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{t('settings.iban')}</label>
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
                    <label className={labelClass}>{t('settings.bic')}</label>
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
                  {t('settings.defaultPayment')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>{t('settings.defaultCurrency')}</label>
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
                    <label className={labelClass}>{t('settings.defaultPayment')}</label>
                    <select
                      name="defaultPaymentMethod"
                      value={formData.defaultPaymentMethod}
                      onChange={handleInputChange}
                      className={inputClass}
                    >
                      {PAYMENT_METHODS.map(m => (
                        <option key={m.code} value={m.code}>{t(m.labelKey)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>{t('settings.invoicePrefix')}</label>
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
                    <label className={labelClass}>{t('settings.quotePrefix')}</label>
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
                      {t('settings.setDefault')}
                    </span>
                  </label>
                  <p className="mt-1.5 ml-7 text-xs text-slate-500">
                    {t('settings.setDefaultDesc')}
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
                  {t('settings.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 bg-primary-900 text-white font-semibold rounded-full hover:bg-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-5 w-5" />
                      {editingCompany ? t('settings.save') : t('settings.addCompany')}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {t('settings.selectCompany')}
              </h3>
              <p className="text-slate-500 mb-6">
                {t('settings.selectCompanyDesc')}
              </p>
              <button
                type="button"
                onClick={handleStartNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-900 text-white font-semibold rounded-full hover:bg-primary-800 transition-colors"
              >
                <Plus size={20} />
                {t('settings.newCompany')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

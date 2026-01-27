import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Loader2, CheckCircle2, FileText, Download, Pencil, Mail, Save, LogIn } from 'lucide-react';
import { InvoiceData, LineItem, FiscalInfo } from '../types';

// Import dynamique de html2pdf.js pour réduire le bundle initial
const loadHtml2Pdf = () => import('html2pdf.js').then(m => m.default);
import { CURRENCIES, PAYMENT_METHODS, FISCAL_REGIONS } from '../constants';
import { sendInvoiceEmail, isBrevoConfigured } from '../services/emailService';
import { sendInvoiceWithPdfToWebhook } from '../services/invoiceService';
import { saveInvoice } from '../services/historyService';
import { DEFAULT_WEBHOOK_URL } from '../constants';

// Email admin pour activer les fonctionnalités cachées (webhook n8n)
const ADMIN_EMAIL = 'mandaniaina.randriambinintsoa@gmail.com';
import { getDefaultCompany } from '../services/companyService';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import ClientSelector from './ClientSelector';
import CompanySelector from './CompanySelector';

const getInitialFormData = (): InvoiceData => ({
  companyName: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  logoUrl: '',
  fiscalInfo: {
    region: 'NONE',
    nif: '',
    stat: '',
    siret: '',
    tvaNumber: ''
  },
  clientName: '',
  clientAddress: '',
  clientEmail: '',
  clientPhone: '',
  clientFiscalInfo: {
    region: 'NONE',
    nif: '',
    stat: '',
    siret: '',
    tvaNumber: ''
  },
  invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  currency: 'EUR',
  paymentMethod: 'Virement Bancaire',
  items: [
    { id: Date.now().toString(), name: 'Service de consultation', quantity: 1, unitPrice: 0 }
  ]
});

const InvoiceForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<'pdf' | 'email' | 'saved' | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<'save' | 'email' | null>(null);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const [lastGeneratedPdfBase64, setLastGeneratedPdfBase64] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const [formData, setFormData] = useState<InvoiceData>(getInitialFormData());

  const { user } = useAuth();

  // Vérifie si l'utilisateur connecté est l'admin (pour afficher le webhook n8n)
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Reference pour la zone à imprimer en PDF
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Charger la société par défaut au montage ou à la connexion
  useEffect(() => {
    const loadDefaultCompany = async () => {
      if (user) {
        const { data } = await getDefaultCompany();
        if (data) {
          // Pré-remplir les infos entreprise si elles existent et que le formulaire est vide
          setFormData(prev => ({
            ...prev,
            companyName: prev.companyName || data.name || '',
            companyAddress: prev.companyAddress || data.address || '',
            companyEmail: prev.companyEmail || data.email || '',
            companyPhone: prev.companyPhone || data.phone || '',
            logoUrl: prev.logoUrl || data.logoUrl || '',
            currency: data.defaultCurrency || prev.currency,
            paymentMethod: data.defaultPaymentMethod || prev.paymentMethod,
            // Générer le numéro avec le préfixe personnalisé
            invoiceNumber: `${data.invoicePrefix || 'INV'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            // Pré-remplir les informations fiscales de la société par défaut
            fiscalInfo: {
              region: data.fiscalRegion || 'NONE',
              siret: data.siret || '',
              tvaNumber: data.vatNumber || '',
              nif: data.nif || '',
              stat: data.stat || '',
            },
          }));
        }
      }
    };
    loadDefaultCompany();
  }, [user]);

  // Exécuter l'action en attente après connexion
  useEffect(() => {
    if (user && pendingAction && !isAuthModalOpen) {
      if (pendingAction === 'email') {
        // Petite pause pour laisser le modal se fermer
        setTimeout(() => {
          handleSendEmail();
        }, 100);
      } else if (pendingAction === 'save') {
        setTimeout(() => {
          handleSaveToHistory();
        }, 100);
      }
      setPendingAction(null);
    }
  }, [user, isAuthModalOpen]);

  // Handler pour sélectionner un client depuis le carnet
  const handleSelectClient = (client: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      clientAddress: client.clientAddress,
      clientPhone: client.clientPhone,
      clientFiscalInfo: {
        region: client.fiscalRegion || 'NONE',
        siret: client.siret || '',
        tvaNumber: client.vatNumber || '',
        nif: client.nif || '',
        stat: client.stat || '',
      },
    }));
  };

  // Handler pour sélectionner une société émettrice
  const handleSelectCompany = (company: {
    companyName: string;
    companyEmail: string;
    companyAddress: string;
    companyPhone: string;
    logoUrl?: string;
    currency?: string;
    paymentMethod?: string;
    invoicePrefix?: string;
    // Informations fiscales
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      companyName: company.companyName,
      companyEmail: company.companyEmail,
      companyAddress: company.companyAddress,
      companyPhone: company.companyPhone,
      logoUrl: company.logoUrl || prev.logoUrl,
      currency: company.currency || prev.currency,
      paymentMethod: company.paymentMethod || prev.paymentMethod,
      // Générer le numéro avec le préfixe de la société
      invoiceNumber: `${company.invoicePrefix || 'INV'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      // Pré-remplir les informations fiscales de la société
      fiscalInfo: {
        region: company.fiscalRegion || 'NONE',
        siret: company.siret || '',
        tvaNumber: company.vatNumber || '',
        nif: company.nif || '',
        stat: company.stat || '',
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFiscalInfoChange = (field: keyof FiscalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      fiscalInfo: {
        ...prev.fiscalInfo!,
        [field]: value
      }
    }));
  };

  const handleClientFiscalInfoChange = (field: keyof FiscalInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      clientFiscalInfo: {
        ...prev.clientFiscalInfo!,
        [field]: value
      }
    }));
  };

  const selectedFiscalRegion = FISCAL_REGIONS.find(r => r.code === formData.fiscalInfo?.region);
  const selectedClientFiscalRegion = FISCAL_REGIONS.find(r => r.code === formData.clientFiscalInfo?.region);

  const handleItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    const newItems = formData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  // Formater un nombre avec séparateurs de milliers (espace)
  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Formater NIF: ex "10000221111" -> "10 000 221 111"
  const formatNif = (nif: string): string => {
    const digits = nif.replace(/\s/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Formater STAT: ex "2410111200010023" -> "24101 11 2000 0 10023"
  const formatStat = (stat: string): string => {
    const digits = stat.replace(/\s/g, '');
    if (digits.length >= 16) {
      return `${digits.slice(0,5)} ${digits.slice(5,7)} ${digits.slice(7,11)} ${digits.slice(11,12)} ${digits.slice(12)}`;
    }
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Triggered by the "Prévisualiser" button
  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreviewMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action: Générer PDF (Impression native)
  const handleGeneratePdf = () => {
    if (invoiceRef.current) {
      const invoiceHtml = invoiceRef.current.innerHTML;
      
      // Création d'une fenêtre popup pour l'impression
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Facture-${formData.invoiceNumber}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <script>
                tailwind.config = {
                  theme: {
                    extend: {
                      fontFamily: { sans: ['Inter', 'sans-serif'] },
                      colors: {
                        primary: {
                          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
                        }
                      }
                    }
                  }
                }
              </script>
              <style>
                body {
                  background-color: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                @media print {
                  @page { margin: 0; size: auto; }
                  body { margin: 0; }
                }
                /* Ajustements spécifiques pour l'impression */
                .invoice-container {
                  padding: 40px !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${invoiceHtml}
              </div>
              <script>
                // Attendre que Tailwind et les images soient chargés avant d'imprimer
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    // window.close(); // Optionnel: fermer après impression (peut bloquer sur mobile)
                  }, 800);
                };
              </script>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();

        setSuccessAction('pdf');
        setSuccess(true);
      } else {
        alert("Veuillez autoriser les pop-ups pour générer le PDF.");
      }
    }
  };

  // Action: Envoyer Email avec PDF (via Brevo)
  const handleSendEmail = async () => {
    if (!invoiceRef.current) return;

    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setAuthModalMessage('Pour envoyer la facture directement par email, connectez-vous à votre compte.');
      setPendingAction('email');
      setIsAuthModalOpen(true);
      return;
    }

    // Vérifier si Brevo est configuré
    if (!isBrevoConfigured()) {
      setEmailError('Service email non configuré. Contactez l\'administrateur.');
      return;
    }

    setLoading(true);
    setEmailError(null);

    try {
      // Générer le PDF avec html2pdf
      const element = invoiceRef.current;
      const opt = {
        margin: 10,
        filename: `Facture-${formData.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      // Générer le PDF en blob puis convertir en base64
      const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

      // Convertir le blob en base64
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Envoyer l'email via Brevo
      const result = await sendInvoiceEmail(formData, pdfBase64);

      if (!result.success) {
        setEmailError(result.error || 'Erreur lors de l\'envoi de l\'email');
        return;
      }

      setSuccessAction('email');
      setSuccess(true);

      // Réinitialiser le formulaire après succès de l'envoi
      setFormData(getInitialFormData());
      setIsPreviewMode(false);
      setTimeout(() => {
        setSuccess(false);
        setSuccessAction(null);
      }, 5000);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF ou de l'envoi:", error);
      setEmailError('Erreur inattendue lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  // Action: Envoyer via Webhook n8n/Gmail (admin seulement)
  const handleSendViaWebhook = async () => {
    if (!invoiceRef.current || !isAdmin) return;

    setWebhookLoading(true);
    setEmailError(null);

    try {
      // Générer le PDF avec html2pdf
      const element = invoiceRef.current;
      const opt = {
        margin: 10,
        filename: `Facture-${formData.invoiceNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

      // Convertir le blob en base64
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      // Envoyer via webhook n8n
      const response = await fetch(DEFAULT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pdfBase64,
          pdfFileName: `Facture-${formData.invoiceNumber}.pdf`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Pas de détails');
        console.error('Erreur webhook:', errorText);
        setEmailError(`Erreur webhook: ${response.status} - ${errorText}`);
        return;
      }

      setSuccessAction('email');
      setSuccess(true);

      // Réinitialiser le formulaire après succès
      setFormData(getInitialFormData());
      setIsPreviewMode(false);
      setTimeout(() => {
        setSuccess(false);
        setSuccessAction(null);
      }, 5000);
    } catch (error: any) {
      console.error("Erreur lors de l'envoi via webhook:", error);
      // Erreur réseau ou CORS
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        setEmailError('Erreur réseau/CORS - L\'instance n8n est peut-être en veille. Réessaie dans 30s.');
      } else {
        setEmailError(`Erreur: ${error.message || 'Erreur inconnue'}`);
      }
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleEdit = () => {
    setIsPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Action: Sauvegarder dans l'historique
  const handleSaveToHistory = async () => {
    if (!user) {
      setAuthModalMessage('Pour sauvegarder vos factures et y accéder plus tard, connectez-vous à votre compte.');
      setPendingAction('save');
      setIsAuthModalOpen(true);
      return;
    }

    if (!invoiceRef.current) return;

    setSavingToHistory(true);

    try {
      let pdfBase64 = lastGeneratedPdfBase64;

      // Générer le PDF si pas encore fait
      if (!pdfBase64) {
        const element = invoiceRef.current;
        const opt = {
          margin: 10,
          filename: `Facture-${formData.invoiceNumber}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const pdfBlob = await (await loadHtml2Pdf())().set(opt).from(element).outputPdf('blob');

        pdfBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });

        setLastGeneratedPdfBase64(pdfBase64);
      }

      const result = await saveInvoice(formData, pdfBase64);

      if (result.error) {
        console.error('Erreur lors de la sauvegarde:', result.error);
        alert('Erreur lors de la sauvegarde: ' + result.error);
      } else {
        setSuccessAction('saved');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSuccessAction(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setSavingToHistory(false);
    }
  };

  const inputClass = "block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2.5 px-3 bg-white border";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const sectionTitleClass = "text-lg font-semibold text-primary-900 border-b border-slate-200 pb-2 mb-6";
  const currencySymbol = CURRENCIES.find(c => c.code === formData.currency)?.symbol || '';

  if (success) {
    const getSuccessMessage = () => {
      switch (successAction) {
        case 'email':
          return {
            title: 'Facture envoyée !',
            description: "L'email avec la facture en pièce jointe a été envoyé directement au client.",
            buttonText: 'Créer une nouvelle facture'
          };
        case 'saved':
          return {
            title: 'Facture sauvegardée !',
            description: "Votre facture a été sauvegardée dans votre historique. Vous pouvez y accéder depuis votre tableau de bord.",
            buttonText: 'Retour'
          };
        default:
          return {
            title: 'Facture générée !',
            description: "La fenêtre d'impression s'est ouverte. Sélectionnez 'Enregistrer au format PDF' pour sauvegarder votre document.",
            buttonText: 'Retour'
          };
      }
    };

    const successMsg = getSuccessMessage();

    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-xl text-center border border-green-100 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          {successMsg.title}
        </h2>
        <p className="text-slate-600 mb-8 text-lg">
          {successMsg.description}
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setSuccessAction(null);
          }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary-900 hover:bg-primary-800 transition-colors"
        >
          {successMsg.buttonText}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header Section */}
      <div className="mb-8 md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-primary-950">
            {isPreviewMode ? 'Aperçu du document' : 'Nouvelle Facture'}
          </h2>
          {!isPreviewMode && (
            <p className="mt-2 text-sm text-slate-500">Remplissez les informations ci-dessous pour générer votre document.</p>
          )}
          {isPreviewMode && (
             <p className="mt-2 text-sm text-slate-500">Vérifiez les informations avant la génération définitive.</p>
          )}
        </div>
      </div>

      {/* VIEW: PREVIEW MODE */}
      {isPreviewMode ? (
        <div className="animate-fade-in">
          {/* Invoice Paper Representation */}
          <div className="bg-white shadow-2xl rounded-lg border border-slate-200 overflow-hidden mb-8">
            {/* Ce div avec la ref sera cloné. Il doit contenir tout le style nécessaire. */}
            <div ref={invoiceRef} className="bg-white p-8 md:p-12 text-slate-800">
              
              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b border-slate-100 pb-8">
                <div className="mb-6 md:mb-0">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Entreprise" className="h-16 w-auto object-contain mb-4" />
                  ) : (
                    <div className="h-16 w-16 bg-slate-100 rounded flex items-center justify-center mb-4 text-slate-400">
                      <FileText size={32} />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{formData.companyName || 'Votre Entreprise'}</h3>
                  <div className="text-slate-500 text-sm mt-2 whitespace-pre-line leading-relaxed">
                    {formData.companyAddress}<br/>
                    {formData.companyEmail}<br/>
                    {formData.companyPhone}
                  </div>
                  {/* Informations fiscales */}
                  {formData.fiscalInfo && formData.fiscalInfo.region !== 'NONE' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600">
                      {formData.fiscalInfo.region === 'MG' && (
                        <>
                          {formData.fiscalInfo.nif && <p><span className="font-medium">NIF :</span> {formatNif(formData.fiscalInfo.nif)}</p>}
                          {formData.fiscalInfo.stat && <p><span className="font-medium">STAT :</span> {formatStat(formData.fiscalInfo.stat)}</p>}
                        </>
                      )}
                      {formData.fiscalInfo.region === 'EU' && (
                        <>
                          {formData.fiscalInfo.siret && <p><span className="font-medium">SIRET :</span> {formData.fiscalInfo.siret}</p>}
                          {formData.fiscalInfo.tvaNumber && <p><span className="font-medium">TVA :</span> {formData.fiscalInfo.tvaNumber}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <h1 className="text-4xl font-light text-slate-900 mb-2">FACTURE</h1>
                  <p className="text-lg font-semibold text-primary-900">{formData.invoiceNumber}</p>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p><span className="font-medium">Date :</span> {new Date(formData.invoiceDate).toLocaleDateString()}</p>
                    {formData.dueDate && <p><span className="font-medium">Échéance :</span> {new Date(formData.dueDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-12">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Facturé à</h4>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 max-w-md">
                   <h3 className="text-lg font-bold text-slate-900">{formData.clientName || 'Nom du Client'}</h3>
                   <div className="text-slate-600 text-sm mt-2 whitespace-pre-line">
                     {formData.clientAddress}
                   </div>
                   <div className="text-slate-600 text-sm mt-4 space-y-1">
                     <p className="flex items-center"><span className="w-4 h-4 mr-2 inline-block bg-slate-200 rounded-full"></span> {formData.clientEmail}</p>
                     {formData.clientPhone && <p className="flex items-center"><span className="w-4 h-4 mr-2 inline-block bg-slate-200 rounded-full"></span> {formData.clientPhone}</p>}
                   </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider w-1/2 text-left">Description</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">Qté</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">Prix Unit.</th>
                      <th className="py-3 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 text-slate-800 font-medium">{item.name}</td>
                        <td className="py-4 text-slate-600 text-right">{item.quantity}</td>
                        <td className="py-4 text-slate-600 text-right">{formatNumber(item.unitPrice)} {currencySymbol}</td>
                        <td className="py-4 text-slate-900 font-bold text-right">{formatNumber(item.quantity * item.unitPrice)} {currencySymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payment */}
              <div className="flex flex-col md:flex-row justify-between items-start border-t border-slate-200 pt-8">
                <div className="mb-8 md:mb-0 md:w-1/2">
                   <h4 className="text-sm font-bold text-slate-900 mb-2">Informations de paiement</h4>
                   <p className="text-sm text-slate-600">
                     Méthode : <span className="font-medium text-slate-800">{formData.paymentMethod}</span><br/>
                     Devise : {formData.currency}
                   </p>
                </div>

                <div className="w-full md:w-1/3">
                  <div className="flex justify-between py-2 text-slate-600">
                    <span>Sous-total</span>
                    <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-600 border-b border-slate-100 pb-4 mb-4">
                    <span>TVA (0%)</span>
                    <span>0.00 {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-primary-900">
                    <span>Total à payer</span>
                    <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
                  </div>
                </div>
              </div>

              {/* Footer text inside PDF */}
              <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                 <p>Merci de votre confiance. Facture générée automatiquement via Factumation.</p>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col lg:flex-row justify-center items-center gap-4 mb-12 flex-wrap">

            {/* Bouton Modifier */}
            <button
              onClick={handleEdit}
              disabled={loading || savingToHistory}
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 shadow-sm text-base font-medium rounded-full text-slate-700 bg-white hover:bg-slate-50 hover:text-primary-900 transition-all duration-200 min-w-[160px]"
            >
              <Pencil className="mr-2 h-5 w-5" />
              Modifier
            </button>

            {/* Bouton Générer PDF */}
            <button
              onClick={handleGeneratePdf}
              disabled={loading || savingToHistory}
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 shadow-sm text-base font-bold rounded-full text-slate-700 bg-white hover:bg-slate-50 hover:text-primary-900 hover:shadow-md transition-all duration-200 min-w-[160px]"
            >
              <Download className="-ml-1 mr-2 h-5 w-5" />
              Générer PDF
            </button>

            {/* Bouton Sauvegarder dans l'historique */}
            <button
              onClick={handleSaveToHistory}
              disabled={loading || savingToHistory}
              className="inline-flex items-center justify-center px-6 py-3 border border-green-300 shadow-sm text-base font-bold rounded-full text-green-700 bg-green-50 hover:bg-green-100 hover:shadow-md transition-all duration-200 min-w-[200px]"
            >
              {savingToHistory ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Sauvegarde...
                </>
              ) : user ? (
                <>
                  <Save className="-ml-1 mr-2 h-5 w-5" />
                  Sauvegarder
                </>
              ) : (
                <>
                  <LogIn className="-ml-1 mr-2 h-5 w-5" />
                  Connectez-vous
                </>
              )}
            </button>

            {/* Bouton Envoyer la facture (Brevo) */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleSendEmail}
                disabled={loading || savingToHistory || webhookLoading}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full text-white bg-primary-900 shadow-lg hover:bg-primary-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="-ml-1 mr-3 h-5 w-5" />
                    Envoyer la facture
                  </>
                )}
              </button>
              <span className="text-xs text-slate-400 mt-2 font-medium italic">(envoi direct à {formData.clientEmail})</span>
              {emailError && (
                <span className="text-xs text-red-500 mt-2 font-medium bg-red-50 px-3 py-1 rounded-full">{emailError}</span>
              )}
            </div>

            {/* Bouton secret: Envoyer via Gmail/n8n (admin seulement) */}
            {isAdmin && (
              <div className="flex flex-col items-center">
                <button
                  onClick={handleSendViaWebhook}
                  disabled={loading || savingToHistory || webhookLoading}
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-amber-500 text-base font-bold rounded-full text-amber-700 bg-amber-50 shadow-lg hover:bg-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
                >
                  {webhookLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Envoi n8n...
                    </>
                  ) : (
                    <>
                      <Mail className="-ml-1 mr-3 h-5 w-5" />
                      Envoyer via Gmail
                    </>
                  )}
                </button>
                <span className="text-xs text-amber-600 mt-2 font-medium italic">(webhook n8n)</span>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* VIEW: FORM MODE */
        <form onSubmit={handlePreviewSubmit} className="animate-fade-in space-y-8 bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-slate-100">
          
          {/* Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

            {/* Client - À GAUCHE */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className={sectionTitleClass + " !mb-0"}>Informations Client</h3>
                <ClientSelector
                  onSelectClient={handleSelectClient}
                  currentClientEmail={formData.clientEmail}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nom du client *</label>
                  <input required type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className={inputClass} placeholder="Ex: Client Important" />
                </div>
                <div>
                  <label className={labelClass}>Adresse *</label>
                  <textarea required rows={2} name="clientAddress" value={formData.clientAddress} onChange={handleInputChange} className={inputClass} placeholder="456 Boulevard du Succès..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input required type="email" name="clientEmail" value={formData.clientEmail} onChange={handleInputChange} className={inputClass} placeholder="email@client.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone</label>
                    <input type="tel" name="clientPhone" value={formData.clientPhone} onChange={handleInputChange} className={inputClass} placeholder="06 98 76 54 32" />
                  </div>
                </div>

                {/* Type de société client */}
                <div className="pt-4 border-t border-slate-100">
                  <label className={labelClass}>Type de société</label>
                  <select
                    value={formData.clientFiscalInfo?.region || 'NONE'}
                    onChange={(e) => handleClientFiscalInfoChange('region', e.target.value)}
                    className={inputClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>{region.name}</option>
                    ))}
                  </select>
                </div>

                {/* Champs fiscaux conditionnels client */}
                {selectedClientFiscalRegion && selectedClientFiscalRegion.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {selectedClientFiscalRegion.fields.map(field => (
                      <div key={field.key}>
                        <label className={labelClass}>{field.label}</label>
                        <input
                          type="text"
                          value={(formData.clientFiscalInfo as any)?.[field.key] || ''}
                          onChange={(e) => handleClientFiscalInfoChange(field.key as keyof FiscalInfo, e.target.value)}
                          className={inputClass}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Entreprise (Émetteur) - À DROITE */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className={sectionTitleClass + " !mb-0"}>Informations Entreprise</h3>
                  <span className="text-xs text-slate-500 italic">Émetteur de la facture</span>
                </div>
                <CompanySelector
                  onSelectCompany={handleSelectCompany}
                  currentCompanyName={formData.companyName}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nom de l'entreprise *</label>
                  <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className={inputClass} placeholder="Ex: Ma Société SAS" />
                </div>
                <div>
                  <label className={labelClass}>Adresse *</label>
                  <textarea required rows={2} name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} className={inputClass} placeholder="123 Rue de l'Innovation..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input required type="email" name="companyEmail" value={formData.companyEmail} onChange={handleInputChange} className={inputClass} placeholder="contact@masociete.com" />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone</label>
                    <input type="tel" name="companyPhone" value={formData.companyPhone} onChange={handleInputChange} className={inputClass} placeholder="01 23 45 67 89" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} className={inputClass} placeholder="https://example.com/logo.png" />
                </div>

                {/* Région fiscale */}
                <div className="pt-4 border-t border-slate-100">
                  <label className={labelClass}>Type de société</label>
                  <select
                    value={formData.fiscalInfo?.region || 'NONE'}
                    onChange={(e) => handleFiscalInfoChange('region', e.target.value)}
                    className={inputClass}
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>{region.name}</option>
                    ))}
                  </select>
                </div>

                {/* Champs fiscaux conditionnels */}
                {selectedFiscalRegion && selectedFiscalRegion.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {selectedFiscalRegion.fields.map(field => (
                      <div key={field.key}>
                        <label className={labelClass}>{field.label}</label>
                        <input
                          type="text"
                          value={(formData.fiscalInfo as any)?.[field.key] || ''}
                          onChange={(e) => handleFiscalInfoChange(field.key as keyof FiscalInfo, e.target.value)}
                          className={inputClass}
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Détails Facture */}
          <div className="pt-4">
            <h3 className={sectionTitleClass}>Détails de la Facture</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className={labelClass}>Numéro Facture *</label>
                <input required type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date d'émission *</label>
                <input required type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date d'échéance</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Devise</label>
                <select name="currency" value={formData.currency} onChange={handleInputChange} className={inputClass}>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Méthode de Paiement</label>
                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} className={inputClass}>
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="pt-4">
            <h3 className={sectionTitleClass}>Articles et Services</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/2">Description</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Qté</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Prix Unit.</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Total</th>
                    <th scope="col" className="relative px-3 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {formData.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input 
                          type="text" 
                          required
                          value={item.name} 
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          placeholder="Nom de l'article"
                          className={`${inputClass} border-transparent focus:border-primary-500 hover:bg-slate-50`}
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input 
                          type="number" 
                          min="1"
                          required
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className={`${inputClass} border-transparent focus:border-primary-500 hover:bg-slate-50`}
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice} 
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`${inputClass} border-transparent focus:border-primary-500 hover:bg-slate-50`}
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {formatNumber(item.quantity * item.unitPrice)} {currencySymbol}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          type="button" 
                          onClick={() => removeItem(item.id)}
                          disabled={formData.items.length === 1}
                          className={`text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 ${formData.items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              type="button" 
              onClick={addItem}
              className="mt-4 inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Ajouter une ligne
            </button>
          </div>

          {/* Totaux */}
          <div className="border-t border-slate-200 pt-6 flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
               <div className="flex justify-between items-center text-lg font-bold text-primary-900">
                 <span>Total à payer</span>
                 <span>{formatNumber(calculateTotal())} {currencySymbol}</span>
               </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-primary-900 shadow-lg hover:bg-primary-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FileText className="-ml-1 mr-3 h-5 w-5" />
              Prévisualiser la facture
            </button>
          </div>

        </form>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalMessage(undefined);
          // Ne pas effacer pendingAction ici pour permettre l'exécution après connexion
        }}
        initialMode="login"
        customMessage={authModalMessage}
      />
    </div>
  );
};

export default InvoiceForm;
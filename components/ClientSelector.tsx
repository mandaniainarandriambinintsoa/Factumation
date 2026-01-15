import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building2, Mail, Phone, MapPin, X, Check, Loader2, FileText } from 'lucide-react';
import { getClients, createClient, MappedClient } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { FISCAL_REGIONS } from '../constants';

interface ClientSelectorProps {
  onSelectClient: (client: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
  }) => void;
  currentClientEmail?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient, currentClientEmail }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<MappedClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<MappedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    fiscalRegion: 'NONE',
    siret: '',
    vatNumber: '',
    nif: '',
    stat: '',
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les clients au montage
  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  // Filtrer les clients selon la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(
          client =>
            client.name.toLowerCase().includes(query) ||
            client.email.toLowerCase().includes(query) ||
            (client.companyName && client.companyName.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, clients]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowNewClientForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await getClients();
    if (!error) {
      setClients(data);
      setFilteredClients(data);
    }
    setLoading(false);
  };

  const handleSelectClient = (client: MappedClient) => {
    onSelectClient({
      clientName: client.name,
      clientEmail: client.email,
      clientAddress: client.address || '',
      clientPhone: client.phone || '',
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) return;

    setSavingClient(true);

    const { data, error } = await createClient({
      name: newClient.name,
      email: newClient.email,
      address: newClient.address || null,
      phone: newClient.phone || null,
      fiscal_region: newClient.fiscalRegion || null,
      siret: newClient.siret || null,
      vat_number: newClient.vatNumber || null,
      nif: newClient.nif || null,
      stat: newClient.stat || null,
    });

    if (error) {
      console.error('Erreur lors de la création du client:', error);
      alert('Erreur lors de la création du client: ' + error);
      setSavingClient(false);
      return;
    }

    if (data) {
      // Ajouter le nouveau client à la liste
      setClients(prev => [data, ...prev]);

      // Sélectionner automatiquement le nouveau client
      onSelectClient({
        clientName: data.name,
        clientEmail: data.email,
        clientAddress: data.address || '',
        clientPhone: data.phone || '',
      });

      // Réinitialiser le formulaire
      setNewClient({ name: '', email: '', address: '', phone: '', fiscalRegion: 'NONE', siret: '', vatNumber: '', nif: '', stat: '' });
      setShowNewClientForm(false);
      setIsOpen(false);
    }

    setSavingClient(false);
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
          setShowNewClientForm(false);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <User size={16} />
        Carnet de clients
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-[calc(100vw-2rem)] sm:w-96 right-0 sm:right-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
          {!showNewClientForm ? (
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
                    placeholder="Rechercher un client..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Liste des clients */}
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 text-primary-600" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="py-8 text-center">
                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          currentClientEmail === client.email ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 truncate">{client.name}</p>
                            {currentClientEmail === client.email && (
                              <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate">{client.email}</p>
                          {client.companyName && (
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              {client.companyName}
                            </p>
                          )}
                          {/* Afficher les infos fiscales si disponibles */}
                          {client.fiscalRegion && client.fiscalRegion !== 'NONE' && (
                            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <FileText className="w-3 h-3" />
                              {client.fiscalRegion === 'EU' && client.siret && `SIRET: ${client.siret}`}
                              {client.fiscalRegion === 'EU' && client.vatNumber && ` | TVA: ${client.vatNumber}`}
                              {client.fiscalRegion === 'MG' && client.nif && `NIF: ${client.nif}`}
                              {client.fiscalRegion === 'MG' && client.stat && ` | STAT: ${client.stat}`}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton nouveau client */}
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-700 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Plus size={16} />
                  Nouveau client
                </button>
              </div>
            </>
          ) : (
            /* Formulaire nouveau client - using div instead of form to avoid nested forms */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Nouveau client</h3>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nom du client"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="email@client.com"
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
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Adresse complète"
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Région fiscale */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    <FileText className="w-3 h-3 inline mr-1" />
                    Type de client
                  </label>
                  <select
                    value={newClient.fiscalRegion}
                    onChange={(e) => setNewClient(prev => ({ ...prev, fiscalRegion: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champs Europe */}
                {newClient.fiscalRegion === 'EU' && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">SIRET</label>
                      <input
                        type="text"
                        value={newClient.siret}
                        onChange={(e) => setNewClient(prev => ({ ...prev, siret: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="14 chiffres"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">N° TVA</label>
                      <input
                        type="text"
                        value={newClient.vatNumber}
                        onChange={(e) => setNewClient(prev => ({ ...prev, vatNumber: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="FR..."
                      />
                    </div>
                  </div>
                )}

                {/* Champs Madagascar */}
                {newClient.fiscalRegion === 'MG' && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">NIF</label>
                      <input
                        type="text"
                        value={newClient.nif}
                        onChange={(e) => setNewClient(prev => ({ ...prev, nif: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Numéro NIF"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">STAT</label>
                      <input
                        type="text"
                        value={newClient.stat}
                        onChange={(e) => setNewClient(prev => ({ ...prev, stat: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Numéro STAT"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={savingClient || !newClient.name || !newClient.email}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-900 rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {savingClient ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Ajouter le client
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

export default ClientSelector;

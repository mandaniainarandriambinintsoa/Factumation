import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, Building2, Mail, Phone, MapPin, X, Check, Loader2, FileText, Trash2 } from 'lucide-react';
import { getClients, createClient, deleteClient, MappedClient } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { FISCAL_REGIONS } from '../constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ClientSelectorProps {
  onSelectClient: (client: {
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    clientPhone: string;
    fiscalRegion?: string;
    siret?: string;
    vatNumber?: string;
    nif?: string;
    stat?: string;
  }) => void;
  currentClientEmail?: string;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient, currentClientEmail }) => {
  const { user } = useAuth();
  const { t } = useI18n();
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

  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

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
      fiscalRegion: client.fiscalRegion,
      siret: client.siret,
      vatNumber: client.vatNumber,
      nif: client.nif,
      stat: client.stat,
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
      setClients(prev => [data, ...prev]);

      onSelectClient({
        clientName: data.name,
        clientEmail: data.email,
        clientAddress: data.address || '',
        clientPhone: data.phone || '',
        fiscalRegion: data.fiscalRegion,
        siret: data.siret,
        vatNumber: data.vatNumber,
        nif: data.nif,
        stat: data.stat,
      });

      setNewClient({ name: '', email: '', address: '', phone: '', fiscalRegion: 'NONE', siret: '', vatNumber: '', nif: '', stat: '' });
      setShowNewClientForm(false);
      setIsOpen(false);
    }

    setSavingClient(false);
  };

  const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    const { error } = await deleteClient(clientId);
    if (error) {
      alert('Erreur lors de la suppression: ' + error);
      return;
    }
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNewClientForm(false);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className="text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100 hover:text-primary-800"
      >
        <User size={16} />
        Carnet de clients
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-[calc(100vw-2rem)] sm:w-96 right-0 sm:right-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
          {!showNewClientForm ? (
            <>
              <div className="p-3 border-b border-slate-100">
                <Input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un client..."
                  startIcon={<Search />}
                  className="bg-slate-50"
                />
              </div>

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
                      <div
                        key={client.id}
                        className={`w-full px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                          currentClientEmail === client.email ? 'bg-primary-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="flex items-start gap-3 flex-1 text-left"
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClient(e, client.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          title="Supprimer ce client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientForm(true)}
                  className="w-full text-primary-700 border-primary-200 bg-white hover:bg-primary-50"
                >
                  <Plus size={16} />
                  Nouveau client
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Nouveau client</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewClientForm(false)}
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Nom *</Label>
                  <Input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    startIcon={<User />}
                    placeholder="Nom du client"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Email *</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    startIcon={<Mail />}
                    placeholder="email@client.com"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Textarea
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      className="pl-9"
                      placeholder="Adresse complète"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600">Téléphone</Label>
                  <Input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    startIcon={<Phone />}
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    Type de client
                  </Label>
                  <select
                    value={newClient.fiscalRegion}
                    onChange={(e) => setNewClient(prev => ({ ...prev, fiscalRegion: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {FISCAL_REGIONS.map(region => (
                      <option key={region.code} value={region.code}>
                        {t(region.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {newClient.fiscalRegion === 'EU' && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">SIRET</Label>
                      <Input
                        type="text"
                        value={newClient.siret}
                        onChange={(e) => setNewClient(prev => ({ ...prev, siret: e.target.value }))}
                        placeholder="14 chiffres"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">N° TVA</Label>
                      <Input
                        type="text"
                        value={newClient.vatNumber}
                        onChange={(e) => setNewClient(prev => ({ ...prev, vatNumber: e.target.value }))}
                        placeholder="FR..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}

                {newClient.fiscalRegion === 'MG' && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">NIF</Label>
                      <Input
                        type="text"
                        value={newClient.nif}
                        onChange={(e) => setNewClient(prev => ({ ...prev, nif: e.target.value }))}
                        placeholder="Numéro NIF"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">STAT</Label>
                      <Input
                        type="text"
                        value={newClient.stat}
                        onChange={(e) => setNewClient(prev => ({ ...prev, stat: e.target.value }))}
                        placeholder="Numéro STAT"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowNewClientForm(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={savingClient || !newClient.name || !newClient.email}
                  className="flex-1"
                >
                  {savingClient ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Ajouter le client
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;

import React, { useState, useEffect } from 'react';
import {
  X,
  HardHat,
  UserCheck,
  Check,
  Building2,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  UserX,
  Sparkles,
} from 'lucide-react';
import { ClientRecord } from '../../types';
import { SiteEngineerItem } from '../../types/rbac';
import { rbacService } from '../../services/rbac.service';
import leadService from '../../services/lead.service';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface AssignSiteEngineerModalProps {
  isOpen: boolean;
  client: ClientRecord | null;
  onClose: () => void;
  onSuccess: (updatedClient: ClientRecord) => void;
}

export const AssignSiteEngineerModal: React.FC<AssignSiteEngineerModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
}) => {
  useEscapeKey(onClose, isOpen);

  const [engineers, setEngineers] = useState<SiteEngineerItem[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      loadEngineers();
    }
  }, [isOpen, client]);

  const loadEngineers = async () => {
    setIsLoading(true);
    try {
      const data = await rbacService.getSiteEngineers();
      setEngineers(data || []);

      if (client) {
        // Pre-select if already assigned
        const currentEngId =
          typeof client.siteEngineerId === 'object' && client.siteEngineerId?._id
            ? client.siteEngineerId._id
            : client.siteEngineerId;

        if (currentEngId) {
          setSelectedEngineerId(String(currentEngId));
        } else if (client.handlerName) {
          // Attempt match by handler name
          const cleanHandler = client.handlerName.replace(/^ER\.?\s*/i, '').trim().toLowerCase();
          const match = data.find((e) => e.name.toLowerCase().includes(cleanHandler));
          if (match) {
            setSelectedEngineerId(match._id);
          } else {
            setSelectedEngineerId('');
          }
        } else {
          setSelectedEngineerId('');
        }
      }
    } catch (err: any) {
      setError('Failed to load site engineers: ' + (err.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const selectedEngineer = engineers.find((e) => e._id === selectedEngineerId);
      const newHandlerName = selectedEngineer
        ? (selectedEngineer.name.toUpperCase().startsWith('ER')
            ? selectedEngineer.name
            : `ER. ${selectedEngineer.name}`)
        : '';

      const updated = await leadService.updateClient(client._id, {
        siteEngineerId: selectedEngineerId || null,
        handlerName: newHandlerName,
      });

      setSuccessMsg(
        selectedEngineer
          ? `Successfully assigned ${newHandlerName} to ${client.name}!`
          : `Unassigned site engineer from ${client.name}`
      );

      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Failed to update site engineer assignment'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSelectedEngineerId('');
  };

  const selectedEngineer = engineers.find((e) => e._id === selectedEngineerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0E131F] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-gradient-to-r from-[#111726] to-[#0E131F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Assign Site Engineer
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  {client.clientCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Link an authorized engineer to this client site</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Client Site Summary Card */}
          <div className="p-4 rounded-xl bg-[#131A2B] border border-[#1E273A] space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Client & Site Name
                </span>
                <span className="text-sm font-bold text-white">{client.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {client.status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C2538] text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{client.siteLocation || 'Location not specified'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono">{client.phone || '-'}</span>
              </div>
            </div>

            {client.handlerName && (
              <div className="pt-2 border-t border-[#1C2538] flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Current Assigned Engineer:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                  <UserCheck className="w-3 h-3 text-amber-400" />
                  <span>{client.handlerName}</span>
                </span>
              </div>
            )}
          </div>

          {/* Site Engineer Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 uppercase tracking-wider text-[10.5px]">
                Select Site Engineer
              </label>
              {selectedEngineerId && (
                <button
                  type="button"
                  onClick={handleUnassign}
                  className="text-[10.5px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <UserX className="w-3 h-3" />
                  <span>Remove Assignment</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-slate-400 bg-[#101625] rounded-xl border border-[#1E293B]">
                Loading site engineers...
              </div>
            ) : engineers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-[#101625] rounded-xl border border-[#1E293B]">
                No site engineers found. Add a Site Engineer first in the Site Engineer menu.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {engineers.map((eng) => {
                  const isSelected = selectedEngineerId === eng._id;
                  const isActive = eng.status === 'Active';

                  return (
                    <div
                      key={eng._id}
                      onClick={() => setSelectedEngineerId(eng._id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                          : 'bg-[#121828] hover:bg-[#162035] border-[#1E293B] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-amber-400 border border-slate-700'
                          }`}
                        >
                          {eng.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                            <span>{eng.name}</span>
                            {!isActive && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{eng.mobile || eng.loginId}</span>
                            {eng.expertise && <span>• {eng.expertise}</span>}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'border border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedEngineer && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300/90">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{selectedEngineer.name}</strong> will receive an assignment notification and will be able to submit daily site reports and view project specs.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1E293B] bg-[#0C101A] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm Assignment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

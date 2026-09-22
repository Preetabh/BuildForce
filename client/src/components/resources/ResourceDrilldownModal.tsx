import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Users2,
  Truck,
  Sparkles,
  Ruler,
  Calendar,
  Layers,
  MapPin,
  ChevronRight,
  Info,
  Scale,
  Calculator,
} from 'lucide-react';
import api from '../../services/api';
import { BomItem, ManpowerItem, MachineryItem, Measurement } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface ResourceDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'MATERIAL' | 'LABOUR' | 'MACHINERY';
  item: BomItem | ManpowerItem | MachineryItem | null;
  projectId: string;
}

export const ResourceDrilldownModal: React.FC<ResourceDrilldownModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  item,
  projectId,
}) => {
  if (!item) return null;

  const boqItem = item.boqItemId;
  const boqItemId = typeof boqItem === 'object' ? boqItem._id : boqItem;
  const resourceName =
    (item as BomItem).materialName ||
    (item as ManpowerItem).labourType ||
    (item as MachineryItem).machineryType;
  const resourceUnit =
    (item as any).unit ||
    (resourceType === 'MACHINERY' ? 'Hours' : 'Days');

  // Fetch contributing measurements for this BOQ item
  const { data: measurements = [], isLoading } = useQuery<Measurement[]>({
    queryKey: ['resourceMeasurements', projectId, boqItemId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/measurements?boqItemId=${boqItemId}`);
      return res.data?.data || [];
    },
    enabled: isOpen && !!boqItemId,
  });

  const getIcon = () => {
    switch (resourceType) {
      case 'MATERIAL':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'LABOUR':
        return <Users2 className="w-5 h-5 text-purple-400" />;
      case 'MACHINERY':
        return <Truck className="w-5 h-5 text-amber-400" />;
    }
  };

  const getThemeColor = () => {
    switch (resourceType) {
      case 'MATERIAL':
        return 'border-blue-500/30 bg-blue-950/20 text-blue-400';
      case 'LABOUR':
        return 'border-purple-500/30 bg-purple-950/20 text-purple-400';
      case 'MACHINERY':
        return 'border-amber-500/30 bg-amber-950/20 text-amber-400';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-850 border border-erp-border flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <h2 className="text-base font-bold text-erp-text">{resourceName}</h2>
            <p className="text-[11px] text-erp-text-muted">
              Execution Drill-down & Mathematical Traceability
            </p>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Resource Overview Card */}
        <div className={cn('p-4 rounded-xl border space-y-3', getThemeColor())}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">
              {resourceType} REQUIREMENT SUMMARY
            </span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
              Coefficient: {item.coefficient} {resourceUnit}/{typeof boqItem === 'object' ? boqItem.unit : 'unit'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
            <div className="p-2 bg-slate-950/60 rounded-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Executed Qty</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {((item as any).executedQuantity ?? (item as any).executedManpower ?? (item as any).executedHours ?? 0).toLocaleString('en-IN')} {resourceUnit}
              </span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Unit Rate</span>
              <span className="text-sm font-bold text-erp-text font-mono">
                ₹{item.unitRate.toLocaleString('en-IN')}/{resourceUnit}
              </span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Executed Amount</span>
              <span className="text-sm font-bold text-blue-400 font-mono">
                ₹{((item as any).executedAmount ?? item.amount ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded-lg">
              <span className="text-[10px] text-slate-400 block uppercase">Source Standard</span>
              <span className="text-xs font-bold text-emerald-400">
                {item.source === 'RATE_ANALYSIS' ? 'CPWD DAR Standard' : 'Manual / Custom'}
              </span>
            </div>
          </div>
        </div>

        {/* Traceability Formula Banner */}
        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-erp-border space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-erp-text">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Mathematical Derivation Trace:</span>
          </div>
          <p className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            {item.calculationTrace?.formulaText ||
              `Executed Quantity = Measured BOQ Qty × Coefficient (${item.coefficient}) = ${(item as any).executedQuantity ?? (item as any).executedManpower ?? (item as any).executedHours ?? 0} ${resourceUnit} @ ₹${item.unitRate}/${resourceUnit}`}
          </p>
        </div>

        {/* Source DSR/SOR & BOQ Item Reference */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-erp-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-erp-text uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Source Work Item Reference
          </div>
          {typeof boqItem === 'object' && boqItem ? (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  {boqItem.itemCode}
                </span>
                <span className="font-medium text-erp-text">{boqItem.description}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                <span>BOQ Total: <strong className="text-slate-200">{boqItem.quantity} {boqItem.unit}</strong></span>
                <span>Executed Total: <strong className="text-emerald-400">{boqItem.executedQuantity} {boqItem.unit}</strong></span>
                {boqItem.sorReference?.scheduleName && (
                  <span>Schedule: <strong className="text-slate-200">{boqItem.sorReference.scheduleName} ({boqItem.sorReference.version})</strong></span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">BOQ Item #{item.calculationTrace?.boqItemCode || '-'}</p>
          )}
        </div>

        {/* Contributing Measurements List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-erp-text uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-blue-400" />
              Contributing Measurement Book (MB) Entries ({measurements.length})
            </span>
          </div>

          <div className="glass-panel rounded-xl border border-erp-border overflow-hidden max-h-60 overflow-y-auto">
            {measurements.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No measurement entries recorded for this work item yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-erp-text-muted border-b border-erp-border">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Location / Floor</th>
                    <th className="py-2.5 px-2 text-center">Formula</th>
                    <th className="py-2.5 px-3 text-right">Measured Qty</th>
                    <th className="py-2.5 px-3 text-right">Resource Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-erp-border/60">
                  {measurements.map((m) => {
                    const entry = m.entries[0] || {};
                    const contribQty = Number((m.totalQuantity * item.coefficient).toFixed(3));
                    const contribCost = Number((contribQty * item.unitRate).toFixed(2));

                    return (
                      <tr key={m._id} className="hover:bg-slate-850/50">
                        <td className="py-2.5 px-3 font-mono text-erp-text-muted">{formatDate(m.measurementDate)}</td>
                        <td className="py-2.5 px-3 text-erp-text">
                          <p className="font-medium">{entry.description || 'Measurement'}</p>
                          {entry.location && (
                            <p className="text-[10px] text-slate-400">{entry.location} - {entry.levelFloor}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                          {entry.formulaExpression || entry.formula}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400 font-mono">
                          {m.totalQuantity} {entry.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-300 font-semibold">
                          {contribQty} {resourceUnit} (₹{contribCost.toLocaleString('en-IN')})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-erp-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

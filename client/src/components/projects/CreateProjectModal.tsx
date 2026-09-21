import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import api from '../../services/api';
import { X, Calendar, Ruler, ShieldCheck, AlertCircle, Check, FolderKanban } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useQuery } from '@tanstack/react-query';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: Project | null;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit,
}) => {
  const isEditing = !!projectToEdit;

  // Form Fields matching screenshot
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('Residential Building');
  const [parentId, setParentId] = useState<string>('main');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState('Metres (m)');
  const [defaultQcLevel, setDefaultQcLevel] = useState('Standard — recommended site checks');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing parent projects for "Project Folder / Parent" dropdown
  const { data: existingProjectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['parentProjectsList'],
    queryFn: async () => {
      const res = await api.get('/projects?limit=50');
      return res.data;
    },
    enabled: isOpen,
  });

  const availableParentProjects = existingProjectsData?.data || [];

  // Reset or initialize state
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setProjectType(projectToEdit.projectType || 'Residential Building');
      setParentId(projectToEdit.parentId ? String(projectToEdit.parentId) : 'main');
      setClientName(projectToEdit.clientName || '');
      setLocation(projectToEdit.location || '');
      setDepartment(projectToEdit.department || '');
      setPreparedBy(projectToEdit.preparedBy || '');
      setStartDate(
        projectToEdit.startDate ? new Date(projectToEdit.startDate).toISOString().slice(0, 10) : ''
      );
      setEndDate(
        projectToEdit.endDate ? new Date(projectToEdit.endDate).toISOString().slice(0, 10) : ''
      );
      setDescription(projectToEdit.description || '');
      setMeasurementUnit(projectToEdit.measurementUnit || 'Metres (m)');
      setDefaultQcLevel(projectToEdit.defaultQcLevel || 'Standard — recommended site checks');
    } else {
      setName('');
      setProjectType('Residential Building');
      setParentId('main');
      setClientName('');
      setLocation('');
      setDepartment('');
      setPreparedBy('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      setMeasurementUnit('Metres (m)');
      setDefaultQcLevel('Standard — recommended site checks');
    }
    setErrors({});
    setServerError(null);
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Project Name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Project Name must be at least 2 characters';
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'Expected completion must be after start date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        projectType,
        parentId: parentId === 'main' ? null : parentId,
        clientName: clientName.trim(),
        location: location.trim(),
        department: department.trim(),
        preparedBy: preparedBy.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        description: description.trim(),
        measurementUnit,
        defaultQcLevel,
      };

      if (isEditing && projectToEdit) {
        await api.patch(`/projects/${projectToEdit._id}`, payload);
      } else {
        await api.post('/projects', payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setServerError(
        errorObj.response?.data?.message || 'Failed to save project. Please check your inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#10141E] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#131926]">
          <h2 className="text-base sm:text-lg font-semibold text-white tracking-wide">
            {isEditing ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto custom-scrollbar">
          {serverError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Row 1: Project Name & Project Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sainik School Project"
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Project Type
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="Residential Building">Residential Building</option>
                <option value="Commercial Building">Commercial Building</option>
                <option value="Infrastructure / Road">Infrastructure / Road</option>
                <option value="Industrial Plant">Industrial Plant</option>
                <option value="Institutional / School">Institutional / School</option>
                <option value="Hospital / Healthcare">Hospital / Healthcare</option>
                <option value="Bridge / Flyover">Bridge / Flyover</option>
                <option value="Renovation / Interior">Renovation / Interior</option>
                <option value="Other">Other Civil Works</option>
              </select>
            </div>
          </div>

          {/* Row 2: Project Folder / Parent */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Folder / Parent
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="main">Main Project</option>
              {availableParentProjects
                .filter((p) => !projectToEdit || p._id !== projectToEdit._id)
                .map((proj) => (
                  <option key={proj._id} value={proj._id}>
                    Folder: {proj.name} ({proj.code})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Select a main project to create this as a phase/sub-project.
            </p>
          </div>

          {/* Row 3: Client / Owner, Location, Department */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Client / Owner
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. DLF / CPWD"
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Noida Sector 62"
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Civil / PWD"
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Prepared By, Start Date, Expected Completion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prepared By
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="e.g. Er. Pratyush Dixit"
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Start Date</span>
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Expected Completion</span>
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {errors.endDate && <p className="text-[11px] text-red-400 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Row 5: Description / Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project details..."
              className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Row 6: Measurement Unit */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs inline-block" />
              <span>Measurement Unit</span>
              <span className="text-red-400">*</span>
            </label>
            <select
              value={measurementUnit}
              onChange={(e) => setMeasurementUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="Metres (m)">Metres (m)</option>
              <option value="Millimetres (mm)">Millimetres (mm)</option>
              <option value="Feet & Inches (ft-in)">Feet & Inches (ft-in)</option>
              <option value="Centimetres (cm)">Centimetres (cm)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Every dimension in this project — Measurement Book, Input Data Sheet and drawing take-off — is entered in this unit. Sub-projects use the same unit. You can change it later in Project Settings.
            </p>
          </div>

          {/* Row 7: Default Quality (QC) Level */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Default Quality (QC) Level</span>
            </label>
            <select
              value={defaultQcLevel}
              onChange={(e) => setDefaultQcLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="Standard — recommended site checks">Standard — recommended site checks</option>
              <option value="Strict — government / PWD audit grade">Strict — government / PWD audit grade</option>
              <option value="Basic — quick preliminary estimate">Basic — quick preliminary estimate</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Sets how deep a QC checklist every measurement item uses by default. You can still override it per item.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

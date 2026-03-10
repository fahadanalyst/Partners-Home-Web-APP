import React from 'react';
import { 
  FileText, 
  ClipboardList, 
  Stethoscope, 
  UserRound, 
  FilePlus,
  ArrowRight,
  Pill,
  Activity,
  ClipboardCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const forms = [
  {
    id: 'gafc-progress-note',
    title: 'GAFC Progress Note',
    description: 'Monthly clinical progress note for GAFC participants.',
    icon: FileText,
    path: '/progress-note',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'gafc-care-plan',
    title: 'GAFC Care Plan',
    description: 'Comprehensive MassHealth GAFC Program Care Plan.',
    icon: ClipboardList,
    path: '/care-plan',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'physician-summary',
    title: 'Physician Summary (PSF-1)',
    description: 'Physician verification and validation of medical information.',
    icon: FilePlus,
    path: '/physician-summary',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    id: 'request-for-services',
    title: 'Request for Services (RFS-1)',
    description: 'Clinical eligibility determination for requested services.',
    icon: ClipboardList,
    path: '/request-for-services',
    color: 'bg-rose-100 text-rose-600'
  },
  {
    id: 'patient-resource-data',
    title: 'Patient Resource Data',
    description: 'Demographic information and health/community resources.',
    icon: UserRound,
    path: '/patient-resource-data',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    id: 'physician-orders',
    title: 'Physician Orders',
    description: 'Physician orders and plan of care documentation.',
    icon: Stethoscope,
    path: '/physician-orders',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'mds-assessment',
    title: 'MDS Assessment',
    description: 'Minimum Data Set assessment for care planning.',
    icon: ClipboardCheck,
    path: '/mds-assessment',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    id: 'nursing-assessment',
    title: 'Nursing Assessment',
    description: 'Comprehensive head-to-toe nursing evaluation.',
    icon: Activity,
    path: '/nursing-assessment',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'mar',
    title: 'Medication Administration Record (MAR)',
    description: 'Monthly tracking of medication administration.',
    icon: Pill,
    path: '/mar',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 'tar',
    title: 'Treatment Administration Record (TAR)',
    description: 'Monthly tracking of non-medication treatments.',
    icon: Activity,
    path: '/tar',
    color: 'bg-lime-100 text-lime-600'
  },
  {
    id: 'clinical-note',
    title: 'Clinical Note',
    description: 'General clinical observations and documentation.',
    icon: FileText,
    path: '/clinical-note-form',
    color: 'bg-zinc-100 text-zinc-600'
  },
  {
    id: 'admission-assessment',
    title: 'Admission Assessment',
    description: 'Initial patient admission evaluation and documentation.',
    icon: FilePlus,
    path: '/admission-assessment',
    color: 'bg-emerald-50 text-emerald-700'
  },
  {
    id: 'discharge-summary',
    title: 'Discharge Summary',
    description: 'Final documentation upon patient discharge from services.',
    icon: ClipboardCheck,
    path: '/discharge-summary',
    color: 'bg-red-50 text-red-700'
  }
];

export const ClinicalForms: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Clinical Forms</h1>
        <p className="text-sm md:text-base text-zinc-500">Access and complete clinical documentation and assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Link 
            key={form.id} 
            to={form.path}
            className="group bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all hover:border-partners-blue-dark"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${form.color}`}>
                <form.icon size={24} />
              </div>
              <div className="p-2 rounded-full bg-zinc-50 text-zinc-400 group-hover:text-partners-blue-dark group-hover:bg-partners-blue-dark/10 transition-colors">
                <ArrowRight size={20} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{form.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {form.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

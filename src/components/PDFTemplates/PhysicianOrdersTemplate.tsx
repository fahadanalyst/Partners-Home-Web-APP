import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface PhysicianOrdersTemplateProps {
  data: any;
}

export const PhysicianOrdersTemplate: React.FC<PhysicianOrdersTemplateProps> = ({ data }) => {
  const {
    patient = {},
    diagnosis = {},
    medications = [],
    orders,
    physician = {}
  } = data;

  return (
    <BasePDFTemplate title="Physician Orders / Plan of Care" date={physician.date}>
      <div className="space-y-6">
        {/* Patient Info & Diagnosis */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Patient Information</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Patient Name</p>
                <p className="font-semibold text-zinc-900">{patient.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Date of Birth</p>
                  <p className="font-medium">{patient.dob || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">M.R. #</p>
                  <p className="font-medium">{patient.mrNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Diagnosis</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Primary Diagnosis</p>
                <p className="font-medium">{diagnosis.primary || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Secondary Diagnosis</p>
                <p className="font-medium">{diagnosis.secondary || 'N/A'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Medications Table */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Medications</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Medication Name</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Dose</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Frequency</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {medications.length > 0 ? medications.map((med: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-2 px-3 text-sm font-medium text-zinc-900">{med.name}</td>
                  <td className="py-2 px-3 text-sm text-zinc-700">{med.dose}</td>
                  <td className="py-2 px-3 text-sm text-zinc-700">{med.frequency}</td>
                  <td className="py-2 px-3 text-sm text-zinc-700">{med.route}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-zinc-400 italic">No medications listed</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Orders / Plan of Care */}
        <section className="space-y-2 page-break">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Orders / Plan of Care</h3>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 min-h-[200px]">
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {orders || 'No specific orders provided.'}
            </p>
          </div>
        </section>

        {/* Physician Info & Signature */}
        <section className="mt-12 pt-8 border-t border-zinc-200">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-center p-4 border border-zinc-100 rounded-lg bg-zinc-50/30">
                {physician.signature ? (
                  <img src={physician.signature} alt="Physician Signature" className="max-h-20 mx-auto mb-2" />
                ) : (
                  <div className="h-20 w-full border-b border-zinc-300 mb-2 flex items-center justify-center text-zinc-300 text-xs italic">
                    Signature required
                  </div>
                )}
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Physician Signature</p>
                <p className="text-[9px] text-zinc-400 italic mt-1">Date: {physician.date || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Physician Name</p>
                <p className="font-semibold text-zinc-900">{physician.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">NPI #</p>
                  <p className="font-medium">{physician.npi || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Phone</p>
                  <p className="font-medium">{physician.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

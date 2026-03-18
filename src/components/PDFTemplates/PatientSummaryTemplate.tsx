import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';
import { format } from 'date-fns';

interface PatientSummaryTemplateProps {
  data: any;
}

export const PatientSummaryTemplate: React.FC<PatientSummaryTemplateProps> = ({ data }) => {
  const { patient, visits } = data;

  return (
    <BasePDFTemplate title="Patient Summary Profile">
      {/* Top Section: Patient Header - CLEAN & PRO */}
      <div className="pdf-section p-10 rounded-[2rem] border-2 border-partners-blue-dark/20 bg-partners-blue-dark/[0.02] mb-10 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="w-28 h-28 rounded-[1.5rem] text-white flex items-center justify-center text-5xl font-bold shadow-md" style={{ backgroundColor: '#005696' }}>
            {patient.first_name?.[0] || 'P'}{patient.last_name?.[0] || 'T'}
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black text-zinc-900 tracking-tight" style={{ color: '#18181b' }}>
                {patient.last_name || 'Patient'}, {patient.first_name || ''}
              </h2>
              <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {patient.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-zinc-500 font-bold" style={{ color: '#71717a' }}>
              <span className="flex items-center gap-2">
                <span className="text-zinc-400 uppercase text-[10px] tracking-widest">DOB</span> {patient.dob ? format(new Date(patient.dob), 'MMMM d, yyyy') : 'N/A'}
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-2 capitalize">
                <span className="text-zinc-400 uppercase text-[10px] tracking-widest">Gender</span> {patient.gender || 'N/A'}
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-2">
                <span className="text-zinc-400 uppercase text-[10px] tracking-widest">ID</span> {patient.id?.slice(0, 8) || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Contact Info */}
        <div className="space-y-4 p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <h3 className="text-[11px] font-black text-partners-blue-dark uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Contact Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Primary Phone</p>
                <p className="text-sm font-bold text-zinc-800">{patient.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Email Address</p>
                <p className="text-sm font-bold text-zinc-800">{patient.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Residential Address</p>
                <div className="text-sm text-zinc-700 leading-relaxed font-medium">
                  {patient.street ? (
                    <>
                      <p>{patient.street}</p>
                      {patient.apt && <p>{patient.apt}</p>}
                      <p>{patient.city}, {patient.state} {patient.zip}</p>
                    </>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="space-y-4 p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm">
          <h3 className="text-[11px] font-black text-partners-blue-dark uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Insurance & Billing</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Insurance ID</p>
                <p className="text-sm font-bold text-zinc-800">{patient.insurance_id || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">SSN (Last 4)</p>
                <p className="text-sm font-bold text-zinc-800">***-**-{patient.ssn_encrypted || '****'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Primary Payer</p>
                <p className="text-sm font-bold text-zinc-800">{patient.primary_payer || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="space-y-4 mb-8 page-break">
        <h3 className="text-[11px] font-black text-partners-blue-dark uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Compliance & Tracking</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Annual Physical</p>
            <p className="text-sm font-bold text-zinc-900">{(patient.last_annual_physical && patient.last_annual_physical !== 'Never' && !isNaN(new Date(patient.last_annual_physical).getTime())) ? format(new Date(patient.last_annual_physical), 'MMM d, yyyy') : 'Never'}</p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Health Status Report</p>
            <p className="text-sm font-bold text-zinc-900">{(patient.last_semi_annual_report && patient.last_semi_annual_report !== 'Never' && !isNaN(new Date(patient.last_semi_annual_report).getTime())) ? format(new Date(patient.last_semi_annual_report), 'MMM d, yyyy') : 'Never'}</p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Monthly Visit</p>
            <p className="text-sm font-bold text-zinc-900">{(patient.last_monthly_visit && patient.last_monthly_visit !== 'Never' && !isNaN(new Date(patient.last_monthly_visit).getTime())) ? format(new Date(patient.last_monthly_visit), 'MMM d, yyyy') : 'Never'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">MLOA Days Used</p>
            <p className={`text-sm font-bold ${patient.mloa_days > 30 ? 'text-red-600' : 'text-zinc-900'}`}>{patient.mloa_days}/30</p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">NMLOA Days Used</p>
            <p className={`text-sm font-bold ${patient.nmloa_days > 45 ? 'text-red-600' : 'text-zinc-900'}`}>{patient.nmloa_days}/45</p>
          </div>
        </div>
      </div>

      {/* Last Section: Recent Visits - CLEAN & PRO */}
      <div className="space-y-6 page-break pt-8">
        <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-4">
          <h3 className="text-[13px] font-black text-partners-blue-dark uppercase tracking-[0.25em]">Clinical Visit History</h3>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing last 15 records</span>
        </div>
        {visits && visits.length > 0 ? (
          <div className="rounded-[1.5rem] border border-zinc-200 overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200">
                  <th className="py-4 px-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Scheduled Date</th>
                  <th className="py-4 px-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Service Type</th>
                  <th className="py-4 px-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Clinical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visits.slice(0, 15).map((visit: any) => (
                  <tr key={visit.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="py-4 px-6 text-xs font-bold text-zinc-700">
                      {visit.scheduled_at ? format(new Date(visit.scheduled_at), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-xs font-black text-partners-blue-dark uppercase tracking-wider">
                      {visit.type || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-zinc-50 rounded-[1.5rem] border-2 border-zinc-100 border-dashed">
            <p className="text-sm text-zinc-400 font-bold italic">No clinical visits recorded in the system for this patient.</p>
          </div>
        )}
      </div>
    </BasePDFTemplate>
  );
};

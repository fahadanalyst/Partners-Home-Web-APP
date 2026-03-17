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
      {/* Patient Header */}
      <div className="flex items-center gap-8 bg-partners-blue-dark/5 p-6 rounded-2xl border border-partners-blue-dark/10">
        <div className="w-20 h-20 rounded-2xl bg-partners-blue-dark text-white flex items-center justify-center text-3xl font-bold">
          {patient.first_name?.[0] || 'P'}{patient.last_name?.[0] || 'T'}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-900">{patient.last_name || 'Patient'}, {patient.first_name || ''}</h2>
          <div className="flex gap-4 text-sm text-zinc-500">
            <span>DOB: {patient.dob ? format(new Date(patient.dob), 'MMMM d, yyyy') : 'N/A'}</span>
            <span>•</span>
            <span className="capitalize">{patient.gender || 'N/A'}</span>
            <span>•</span>
            <span>ID: {patient.id?.slice(0, 8) || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Phone</p>
              <p className="text-sm text-zinc-700">{patient.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Email</p>
              <p className="text-sm text-zinc-700">{patient.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Address</p>
              <div className="text-sm text-zinc-700 leading-relaxed">
                {patient.address_line1 ? (
                  <>
                    <p>{patient.address_line1}</p>
                    {patient.address_line2 && <p>{patient.address_line2}</p>}
                    <p>{patient.city}, {patient.state} {patient.zip_code}</p>
                  </>
                ) : (
                  'Not provided'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Insurance & Billing</h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Insurance ID</p>
              <p className="text-sm text-zinc-700">{patient.insurance_id || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">SSN (Last 4)</p>
              <p className="text-sm text-zinc-700">***-**-{patient.ssn_encrypted || '****'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {patient.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Compliance & Tracking</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Annual Physical</p>
            <p className="text-xs font-bold text-zinc-900">{patient.last_annual_physical && patient.last_annual_physical !== 'Never' ? format(new Date(patient.last_annual_physical), 'MMM d, yyyy') : 'Never'}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Health Status Report</p>
            <p className="text-xs font-bold text-zinc-900">{patient.last_semi_annual_report && patient.last_semi_annual_report !== 'Never' ? format(new Date(patient.last_semi_annual_report), 'MMM d, yyyy') : 'Never'}</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Monthly Visit</p>
            <p className="text-xs font-bold text-zinc-900">{patient.last_monthly_visit && patient.last_monthly_visit !== 'Never' ? format(new Date(patient.last_monthly_visit), 'MMM d, yyyy') : 'Never'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">MLOA Days Used</p>
            <p className={`text-xs font-bold ${patient.mloa_days > 30 ? 'text-red-600' : 'text-zinc-900'}`}>{patient.mloa_days}/30</p>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex justify-between items-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">NMLOA Days Used</p>
            <p className={`text-xs font-bold ${patient.nmloa_days > 45 ? 'text-red-600' : 'text-zinc-900'}`}>{patient.nmloa_days}/45</p>
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Recent Visit History</h3>
        {visits && visits.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Date</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Type</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(0, 10).map((visit: any) => (
                <tr key={visit.id} className="border-b border-zinc-100">
                  <td className="py-2 px-3 text-xs text-zinc-700">{visit.scheduled_at ? format(new Date(visit.scheduled_at), 'MMM d, yyyy') : 'N/A'}</td>
                  <td className="py-2 px-3 text-xs font-bold text-zinc-900">{visit.type || 'N/A'}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {visit.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-500 italic">No visits recorded.</p>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-6 border-t border-zinc-200 text-center">
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
          Generated on {format(new Date(), 'MMMM d, yyyy')} • Partners Home and Nursing Services
        </p>
      </div>
    </BasePDFTemplate>
  );
};

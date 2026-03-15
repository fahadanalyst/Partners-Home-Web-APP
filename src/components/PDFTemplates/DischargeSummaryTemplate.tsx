import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface DischargeSummaryTemplateProps {
  data: any;
}

export const DischargeSummaryTemplate: React.FC<DischargeSummaryTemplateProps> = ({ data }) => {
  const {
    date,
    patientName,
    dischargeReason,
    summary,
    signature
  } = data;

  return (
    <BasePDFTemplate title="Discharge Summary" date={date}>
      <div className="space-y-8">
        {/* Patient Info */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Patient Information</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Patient Name</p>
              <p className="font-semibold text-zinc-900">{patientName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Discharge Date</p>
              <p className="font-medium">{date || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Discharge Reason */}
        <section className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Reason for Discharge</p>
          <p className="text-sm font-medium text-zinc-900">{dischargeReason || 'N/A'}</p>
        </section>

        {/* Summary of Care */}
        <section className="space-y-3 page-break">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Summary of Care</h3>
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-100 min-h-[400px]">
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {summary || 'No summary provided.'}
            </p>
          </div>
        </section>

        {/* Signature */}
        {signature && (
          <section className="mt-12 pt-8 border-t border-zinc-100">
            <div className="flex flex-col items-start gap-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Clinician Signature</p>
              <img src={signature} alt="Signature" className="max-h-24 object-contain" />
              <div className="w-64 border-b border-zinc-300" />
              <p className="text-xs text-zinc-500 italic">Signed on: {date}</p>
            </div>
          </section>
        )}
      </div>
    </BasePDFTemplate>
  );
};

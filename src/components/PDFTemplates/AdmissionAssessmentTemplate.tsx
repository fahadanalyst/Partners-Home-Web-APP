import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface AdmissionAssessmentTemplateProps {
  data: any;
}

export const AdmissionAssessmentTemplate: React.FC<AdmissionAssessmentTemplateProps> = ({ data }) => {
  const {
    date,
    patientName,
    dob,
    assessment,
    signature
  } = data;

  return (
    <BasePDFTemplate title="Admission Assessment" date={date}>
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
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Date of Birth</p>
              <p className="font-medium">{dob || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Assessment Details */}
        <section className="space-y-3 page-break">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Assessment Details</h3>
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-100 min-h-[400px]">
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {assessment || 'No assessment details provided.'}
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

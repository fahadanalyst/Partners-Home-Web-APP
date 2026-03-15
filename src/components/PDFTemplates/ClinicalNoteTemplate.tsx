import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface ClinicalNoteTemplateProps {
  data: any;
}

export const ClinicalNoteTemplate: React.FC<ClinicalNoteTemplateProps> = ({ data }) => {
  const {
    date,
    time,
    patient = {},
    noteType,
    soap = {},
    narrative,
    signature
  } = data;

  return (
    <BasePDFTemplate title="Clinical Note" date={date}>
      <div className="space-y-8">
        {/* Header Metadata */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Patient Name</p>
            <p className="font-bold text-zinc-900 border-b border-zinc-100 pb-1">{patient.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Note Type</p>
            <p className="font-bold text-partners-blue-dark border-b border-zinc-100 pb-1">{noteType || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Time of Note</p>
            <p className="font-medium border-b border-zinc-100 pb-1">{time || 'N/A'}</p>
          </div>
        </div>

        {/* SOAP Section */}
        {(soap.subjective || soap.objective || soap.assessment || soap.plan) && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-1">SOAP Documentation</h3>
            <div className="grid grid-cols-1 gap-4">
              {soap.subjective && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Subjective</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{soap.subjective}</p>
                </div>
              )}
              {soap.objective && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Objective</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{soap.objective}</p>
                </div>
              )}
              {soap.assessment && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Assessment</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{soap.assessment}</p>
                </div>
              )}
              {soap.plan && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Plan</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{soap.plan}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Narrative Section */}
        {narrative && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-1">Narrative Note</h3>
            <div className="p-4 bg-white border border-zinc-200 rounded-xl min-h-[200px]">
              <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">{narrative}</p>
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="pt-8 border-t border-zinc-200">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">Clinician Signature</p>
              <div className="h-20 border border-zinc-200 rounded-lg flex items-center justify-center bg-zinc-50 overflow-hidden">
                {signature ? (
                  <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-zinc-300 italic text-xs">No signature provided</span>
                )}
              </div>
              <div className="border-t border-zinc-900 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </BasePDFTemplate>
  );
};

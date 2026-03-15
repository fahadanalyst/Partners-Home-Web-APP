import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface TAR_TemplateProps {
  data: any;
}

export const TAR_Template: React.FC<TAR_TemplateProps> = ({ data }) => {
  const {
    month,
    year,
    patient = {},
    treatments = [],
    staffSignatures = []
  } = data;

  const daysInMonth = 31;

  return (
    <BasePDFTemplate title="Treatment Administration Record (TAR)" date={`${month} ${year}`}>
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Patient Name</p>
            <p className="font-bold text-zinc-900 border-b border-zinc-100 pb-1">{patient.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date of Birth</p>
            <p className="font-medium border-b border-zinc-100 pb-1">{patient.dob || 'N/A'}</p>
          </div>
        </div>

        {/* TAR Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-1 border-r border-zinc-200 w-40 text-left uppercase font-bold text-zinc-500">Treatment Description / Frequency</th>
                <th className="p-1 border-r border-zinc-200 w-8 text-center uppercase font-bold text-zinc-500">Time</th>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <th key={i} className="p-0.5 border-r border-zinc-200 text-center w-5 font-bold text-zinc-600">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {treatments.map((treat: any, idx: number) => (
                <tr key={idx} className="h-8">
                  <td className="p-1 border-r border-zinc-200 leading-tight">
                    <p className="font-bold text-zinc-900 uppercase">{treat.description || '---'}</p>
                    <p className="text-[7px] text-zinc-500 italic">
                      {treat.frequency}
                    </p>
                  </td>
                  <td className="p-1 border-r border-zinc-200 text-center font-bold text-zinc-700">
                    {treat.times || '---'}
                  </td>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <td key={i} className="p-0 border-r border-zinc-200 text-center align-middle font-bold text-partners-green">
                      {treat.administrations?.[i + 1] || ''}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Fill empty rows if needed to maintain layout */}
              {treatments.length < 10 && Array.from({ length: 10 - treatments.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-8">
                  <td className="p-1 border-r border-zinc-200"></td>
                  <td className="p-1 border-r border-zinc-200"></td>
                  {Array.from({ length: daysInMonth }).map((_, j) => (
                    <td key={j} className="p-0 border-r border-zinc-200"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend & Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Initials Legend</h4>
            <div className="grid grid-cols-2 gap-2">
              {staffSignatures.filter((s: any) => s.initials).map((sig: any, i: number) => (
                <div key={i} className="flex items-center gap-2 border-b border-zinc-100 pb-1">
                  <span className="w-6 font-bold text-partners-green">{sig.initials}</span>
                  <span className="text-[9px] text-zinc-600">{sig.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Notes / Observations</h4>
            <div className="h-20 border-b border-zinc-200 border-dashed" />
          </div>
        </div>
      </div>
    </BasePDFTemplate>
  );
};

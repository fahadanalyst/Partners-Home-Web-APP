import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface MAR_TemplateProps {
  data: any;
}

export const MAR_Template: React.FC<MAR_TemplateProps> = ({ data }) => {
  const {
    month,
    year,
    patient = {},
    medications = [],
    staffSignatures = []
  } = data;

  const daysInMonth = 31;

  return (
    <BasePDFTemplate title="Medication Administration Record (MAR)" date={`${month} ${year}`}>
      <div className="space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="col-span-2 space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Patient Name</p>
            <p className="font-bold text-zinc-900 border-b border-zinc-100 pb-1">{patient.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Allergies</p>
            <p className="font-bold text-red-600 border-b border-red-100 pb-1">{patient.allergies || 'NKA'}</p>
          </div>
        </div>

        {/* MAR Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[7px]" style={{ tableLayout: 'fixed', width: '100%', minWidth: '600px' }}>
            <thead>
              <tr className="border-b" style={{ backgroundColor: '#f9fafb', borderBottomColor: '#e4e4e7' }}>
                <th className="p-1 border-r text-left uppercase font-bold text-zinc-500" style={{ width: '100px', borderRightColor: '#e4e4e7' }}>Medication / Dose / Route / Freq</th>
                <th className="p-1 border-r text-center uppercase font-bold text-zinc-500" style={{ width: '35px', borderRightColor: '#e4e4e7' }}>Time</th>
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <th key={i} className="p-0.5 border-r text-center font-bold text-zinc-600" style={{ width: '16px', borderRightColor: '#e4e4e7' }}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderTopColor: '#e4e4e7' }}>
              {medications.map((med: any, idx: number) => (
                <tr key={idx} className="h-8 border-b" style={{ borderBottomColor: '#e4e4e7' }}>
                  <td className="p-1 border-r leading-tight" style={{ width: '100px', borderRightColor: '#e4e4e7' }}>
                    <p className="font-bold text-zinc-900 uppercase truncate">{med.name || '---'}</p>
                    <p className="text-[6px] text-zinc-500 italic truncate">
                      {med.dose} {med.route} {med.frequency}
                    </p>
                  </td>
                  <td className="p-1 border-r text-center font-bold text-zinc-700" style={{ width: '35px', borderRightColor: '#e4e4e7' }}>
                    {med.times || '---'}
                  </td>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <td key={i} className="p-0 border-r text-center align-middle font-bold text-partners-blue-dark" style={{ width: '16px', borderRightColor: '#e4e4e7' }}>
                      {med.administrations?.[i + 1] || ''}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Fill empty rows if needed to maintain layout */}
              {medications.length < 10 && Array.from({ length: 10 - medications.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-8 border-b" style={{ borderBottomColor: '#e4e4e7' }}>
                  <td className="p-1 border-r" style={{ width: '100px', borderRightColor: '#e4e4e7' }}></td>
                  <td className="p-1 border-r" style={{ width: '35px', borderRightColor: '#e4e4e7' }}></td>
                  {Array.from({ length: daysInMonth }).map((_, j) => (
                    <td key={j} className="p-0 border-r" style={{ width: '16px', borderRightColor: '#e4e4e7' }}></td>
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
                  <span className="w-6 font-bold text-partners-blue-dark">{sig.initials}</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-600">{sig.name}</span>
                    {sig.signature && (
                      <img 
                        src={sig.signature} 
                        alt="Signature" 
                        className="h-6 object-contain mt-1" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Notes / Exceptions</h4>
            <div className="h-20 border-b border-zinc-200 border-dashed" />
          </div>
        </div>
      </div>
    </BasePDFTemplate>
  );
};

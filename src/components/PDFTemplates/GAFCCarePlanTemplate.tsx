import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface GAFCCarePlanTemplateProps {
  data: any;
}

export const GAFCCarePlanTemplate: React.FC<GAFCCarePlanTemplateProps> = ({ data }) => {
  return (
    <BasePDFTemplate title="GAFC Care Plan">
      {/* Member Info */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Member Information</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Member Name</p>
            <p className="text-sm font-semibold text-zinc-900">{data.memberInfo?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">MassHealth ID</p>
            <p className="text-sm font-semibold text-zinc-900">{data.memberInfo?.massHealthId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">DOB</p>
            <p className="text-sm font-semibold text-zinc-900">{data.memberInfo?.dob || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Primary Language</p>
            <p className="text-sm font-semibold text-zinc-900">{data.memberInfo?.primaryLanguage || 'English'}</p>
          </div>
        </div>
      </div>

      {/* Emergency & PCP */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase">Emergency Contact</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-bold">Name:</span> {data.emergencyContact?.name || 'N/A'}</p>
            <p><span className="font-bold">Relationship:</span> {data.emergencyContact?.relationship || 'N/A'}</p>
            <p><span className="font-bold">Phone:</span> {data.emergencyContact?.phone || 'N/A'}</p>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase">Primary Care Provider</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-bold">Name:</span> {data.primaryCareProvider?.name || 'N/A'}</p>
            <p><span className="font-bold">Phone:</span> {data.primaryCareProvider?.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Medical Conditions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Medical Conditions / Diagnoses</h3>
        <p className="text-sm text-zinc-700 leading-relaxed">{data.medicalConditions || 'No conditions recorded'}</p>
      </div>

      {/* Functional Assessment */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Functional Assessment</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          {['bathing', 'dressing', 'toileting', 'ambulation', 'transfers', 'eating'].map(adl => (
            <div key={adl} className="flex justify-between border-b border-zinc-50 py-1">
              <span className="text-xs font-bold text-zinc-500 uppercase">{adl}</span>
              <span className="text-xs font-semibold">{data.functionalAssessment?.[adl] || 'Independent'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Member Centered Goals</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Member's Own Goals</p>
            <p className="text-sm text-zinc-700 italic">"{data.goals?.memberGoals || 'N/A'}"</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Provider Goals</p>
            <p className="text-sm text-zinc-700">{data.goals?.providerGoals || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Interventions Table */}
      <div className="space-y-2 page-break">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Interventions & Services</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Need / Goal</th>
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Intervention</th>
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {data.interventions?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-zinc-100">
                <td className="py-2 px-3 text-xs text-zinc-700">{item.needGoal}</td>
                <td className="py-2 px-3 text-xs text-zinc-700">{item.intervention}</td>
                <td className="py-2 px-3 text-xs text-zinc-700">{item.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t border-zinc-200">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Member Signature</p>
          {data.signatures?.memberSignature ? (
            <div className="border-b border-zinc-300 pb-2">
              <img src={data.signatures.memberSignature} alt="Member Signature" className="h-12 object-contain" />
            </div>
          ) : (
            <div className="h-12 border-b border-zinc-300 border-dashed"></div>
          )}
          <p className="text-xs font-medium text-zinc-900">{data.memberInfo?.name}</p>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Care Manager Signature</p>
          {data.signatures?.careManagerSignature ? (
            <div className="border-b border-zinc-300 pb-2">
              <img src={data.signatures.careManagerSignature} alt="CM Signature" className="h-12 object-contain" />
            </div>
          ) : (
            <div className="h-12 border-b border-zinc-300 border-dashed"></div>
          )}
          <p className="text-xs font-medium text-zinc-900">Care Manager</p>
        </div>
      </div>
    </BasePDFTemplate>
  );
};

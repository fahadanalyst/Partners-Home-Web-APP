import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface GAFCProgressNoteTemplateProps {
  data: any;
}

export const GAFCProgressNoteTemplate: React.FC<GAFCProgressNoteTemplateProps> = ({ data }) => {
  const adlLevels = ['Independent', 'Needs Cueing', 'Needs Assistance', 'Dependent'];
  const ADL_TASKS = [
    'Bathing', 'Dressing', 'Grooming', 'Toileting', 'Mobility', 'Meal Prep', 'Housekeeping', 'Medication Mgmt'
  ];

  return (
    <BasePDFTemplate title="GAFC Progress Note">
      {/* Header Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Participant Name</p>
          <p className="text-sm font-semibold text-zinc-900">{data.participantName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">DOB</p>
          <p className="text-sm font-semibold text-zinc-900">{data.dob || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">GAFC Provider</p>
          <p className="text-sm font-semibold text-zinc-900">{data.gafcProvider || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visit Date/Time</p>
          <p className="text-sm font-semibold text-zinc-900">{data.visitDate} at {data.visitTime}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Location</p>
          <p className="text-sm font-semibold text-zinc-900">{data.location || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Staff Name & Title</p>
          <p className="text-sm font-semibold text-zinc-900">{data.staffNameTitle || 'N/A'}</p>
        </div>
      </div>

      {/* Reason for Visit */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Reason for Visit</h3>
        <p className="text-sm text-zinc-700 leading-relaxed">{data.reasonForVisit || 'N/A'}</p>
      </div>

      {/* Subjective */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Participant Report (Subjective)</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Current Concerns</p>
            <p className="text-sm text-zinc-700">{data.subjective?.currentConcerns || 'None reported'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Changes Since Last Visit</p>
            <p className="text-sm text-zinc-700">{data.subjective?.changesSinceLastVisit || 'None reported'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Pain, Symptoms, or New Issues</p>
            <p className="text-sm text-zinc-700">{data.subjective?.painSymptoms || 'None reported'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Mood / Mental Status</p>
            <p className="text-sm text-zinc-700">{data.subjective?.moodMentalStatus || 'Stable'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Participant Comments</p>
            <p className="text-sm text-zinc-700 italic">"{data.subjective?.participantComments || 'No comments'}"</p>
          </div>
        </div>
      </div>

      {/* Objective */}
      <div className="space-y-4 page-break">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Observations (Objective)</h3>
        
        <div className="grid grid-cols-5 gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
          <div className="text-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase">BP</p>
            <p className="text-xs font-bold">{data.objective?.vitals?.bp || '--'}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase">HR</p>
            <p className="text-xs font-bold">{data.objective?.vitals?.hr || '--'}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase">RR</p>
            <p className="text-xs font-bold">{data.objective?.vitals?.rr || '--'}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase">Temp</p>
            <p className="text-xs font-bold">{data.objective?.vitals?.temp || '--'}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-zinc-400 uppercase">SpO₂</p>
            <p className="text-xs font-bold">{data.objective?.vitals?.spo2 || '--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">General Appearance</p>
            <p className="text-zinc-700">{data.objective?.generalAppearance || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Respiratory</p>
            <p className="text-zinc-700">{data.objective?.physicalAssessment?.respiratory || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Cardiac</p>
            <p className="text-zinc-700">{data.objective?.physicalAssessment?.cardiac || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Skin Integrity</p>
            <p className="text-zinc-700">{data.objective?.physicalAssessment?.skinIntegrity || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Mobility / Gait</p>
            <p className="text-zinc-700">{data.objective?.physicalAssessment?.mobilityGait || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Nutrition / Appetite</p>
            <p className="text-zinc-700">{data.objective?.physicalAssessment?.nutritionAppetite || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* ADLs Table */}
      <div className="space-y-2 page-break">
        <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">ADLs / IADLs Review</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Task</th>
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Level of Assistance</th>
              <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ADL_TASKS.map(task => (
              <tr key={task} className="border-b border-zinc-100">
                <td className="py-2 px-3 text-xs font-bold text-zinc-700">{task}</td>
                <td className="py-2 px-3 text-xs text-zinc-600">{data.adls?.[task]?.level || 'Independent'}</td>
                <td className="py-2 px-3 text-xs text-zinc-600 italic">{data.adls?.[task]?.notes || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assessment & Plan */}
      <div className="grid grid-cols-1 gap-6 page-break">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Clinical Assessment</h3>
          <p className="text-sm text-zinc-700 leading-relaxed">{data.assessment || 'N/A'}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-partners-blue-dark uppercase tracking-wider border-b border-zinc-100 pb-1">Interventions & Education</h3>
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">Interventions Provided</p>
            <ul className="list-disc ml-5 text-sm text-zinc-700">
              {data.interventions?.filter((i: string) => i.trim()).map((i: string, idx: number) => (
                <li key={idx}>{i}</li>
              )) || <li>None recorded</li>}
            </ul>
            <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2">Education Provided</p>
            <p className="text-sm text-zinc-700">{data.education || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 grid grid-cols-2 gap-12 pt-8 border-t border-zinc-200 page-break">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Staff Signature</p>
          {data.staffSignature ? (
            <div className="border-b border-zinc-300 pb-2">
              <img src={data.staffSignature} alt="Signature" className="h-12 object-contain" />
            </div>
          ) : (
            <div className="h-12 border-b border-zinc-300 border-dashed"></div>
          )}
          <p className="text-xs font-medium text-zinc-900">{data.staffNameTitle}</p>
        </div>
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase">Date</p>
          <div className="h-12 border-b border-zinc-300 flex items-end pb-2">
            <p className="text-sm font-medium">{data.signatureDate}</p>
          </div>
        </div>
      </div>
    </BasePDFTemplate>
  );
};

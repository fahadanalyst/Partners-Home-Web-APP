import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface MDSAssessmentTemplateProps {
  data: any;
}

export const MDSAssessmentTemplate: React.FC<MDSAssessmentTemplateProps> = ({ data }) => {
  const {
    assessmentDate,
    patient = {},
    cognitive = {},
    mood = {},
    physical = {},
    diagnoses = [],
    diagnosesOther,
    medications = {},
    summary
  } = data;

  return (
    <BasePDFTemplate title="Minimum Data Set (MDS) Assessment" date={assessmentDate}>
      <div className="space-y-6">
        {/* Patient Info */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Identification Information</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Patient Name</p>
              <p className="font-semibold text-zinc-900">{patient.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Date of Birth</p>
              <p className="font-medium">{patient.dob || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Gender</p>
              <p className="font-medium">{patient.gender || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Cognitive & Mood */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Cognitive Patterns</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Short-term Memory</p>
                <p className="font-medium">{cognitive.memory || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Decision Making</p>
                <p className="font-medium">{cognitive.decisionMaking || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Orientation</p>
                <p className="font-medium">{cognitive.orientation?.length > 0 ? cognitive.orientation.join(', ') : 'None specified'}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Mood and Behavior</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${mood.depression ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[10px] font-medium uppercase text-zinc-500">Depression</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${mood.anxiety ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[10px] font-medium uppercase text-zinc-500">Anxiety</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Behavioral Symptoms</p>
                <p className="font-medium">{mood.behavioralSymptoms || 'None reported.'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Physical Functioning */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Physical Functioning</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">ADL Assistance</p>
              <p className="font-medium">{physical.adlAssistance || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Mobility</p>
              <p className="font-medium">{physical.mobility || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Falls (90 days)</p>
              <p className="font-medium">{physical.falls || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Diagnoses & Medications */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Active Diagnoses</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {diagnoses.map((d: string) => (
                <div key={d} className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-partners-green rounded-full" />
                  <span className="text-xs text-zinc-700">{d}</span>
                </div>
              ))}
              {diagnosesOther && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-partners-green rounded-full" />
                  <span className="text-xs text-zinc-700">{diagnosesOther}</span>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Medications (Last 7 Days)</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(medications).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${value ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[10px] font-medium uppercase text-zinc-500">{key}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Assessment Summary</h3>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 min-h-[150px]">
            <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
              {summary || 'No clinical summary provided.'}
            </p>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

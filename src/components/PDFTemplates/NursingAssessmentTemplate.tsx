import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface NursingAssessmentTemplateProps {
  data: any;
}

export const NursingAssessmentTemplate: React.FC<NursingAssessmentTemplateProps> = ({ data }) => {
  const {
    date,
    time,
    patient = {},
    vitals = {},
    neurological = {},
    respiratory = {},
    cardiovascular = {},
    gi = {},
    gu = {},
    skin = {},
    psychosocial,
    nursingDiagnosis,
    plan,
    signature
  } = data;

  return (
    <BasePDFTemplate title="Comprehensive Nursing Assessment" date={date}>
      <div className="space-y-6">
        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Patient Name</p>
            <p className="text-sm font-semibold text-zinc-900">{patient.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date / Time of Assessment</p>
            <p className="text-sm font-semibold text-zinc-900">{date} {time ? `@ ${time}` : ''}</p>
          </div>
        </div>

        {/* Vital Signs */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Vital Signs</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Temp</p>
              <p className="text-sm font-medium">{vitals.temp || '--'} °F</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Pulse</p>
              <p className="text-sm font-medium">{vitals.pulse || '--'} bpm</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Resp</p>
              <p className="text-sm font-medium">{vitals.resp || '--'} /min</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">BP</p>
              <p className="text-sm font-medium">{vitals.bp || '--'} mmHg</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">SpO2</p>
              <p className="text-sm font-medium">{vitals.spo2 || '--'} %</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Weight</p>
              <p className="text-sm font-medium">{vitals.weight || '--'} lbs</p>
            </div>
            <div className="p-2 border border-zinc-100 rounded bg-white">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Pain</p>
              <p className="text-sm font-medium">{vitals.pain || '--'} / 10</p>
            </div>
          </div>
        </section>

        {/* Systems Review */}
        <div className="grid grid-cols-2 gap-6">
          {/* Neurological */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Neurological</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Orientation</p>
                <p className="font-medium">{neurological.orientation?.length > 0 ? neurological.orientation.join(', ') : 'None specified'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Pupils</p>
                  <p className="font-medium">{neurological.pupils || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Speech</p>
                  <p className="font-medium">{neurological.speech || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Respiratory */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Respiratory</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Breath Sounds</p>
                <p className="font-medium">{respiratory.breathSounds || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Cough</p>
                  <p className="font-medium">{respiratory.cough || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Oxygen</p>
                  <p className="font-medium">{respiratory.oxygen || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Cardiovascular */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Cardiovascular</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Rhythm</p>
                <p className="font-medium">{cardiovascular.rhythm || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Edema</p>
                  <p className="font-medium">{cardiovascular.edema || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Capillary Refill</p>
                  <p className="font-medium">{cardiovascular.capRefill || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* GI / GU */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">GI / GU</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Bowel Sounds</p>
                <p className="font-medium">{gi.bowelSounds || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Last BM</p>
                <p className="font-medium">{gi.lastBm || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Voiding</p>
                <p className="font-medium">{gu.voiding || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Urine Color</p>
                <p className="font-medium">{gu.urineColor || 'N/A'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Skin & Psychosocial */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Integumentary (Skin)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Condition</p>
                <p className="font-medium">{skin.condition || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Wounds / Incisions</p>
                <p className="font-medium">{skin.wounds || 'N/A'}</p>
              </div>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Psychosocial</h3>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 min-h-[60px]">
              <p className="text-sm text-zinc-800 italic">{psychosocial || 'No psychosocial notes provided.'}</p>
            </div>
          </section>
        </div>

        {/* Diagnosis & Plan */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Nursing Diagnosis</h3>
            <div className="p-4 bg-zinc-50 rounded border border-zinc-100 min-h-[80px]">
              <p className="text-sm text-zinc-800">{nursingDiagnosis || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Plan of Care / Interventions</h3>
            <div className="p-4 bg-zinc-50 rounded border border-zinc-100 min-h-[100px]">
              <p className="text-sm text-zinc-800 whitespace-pre-wrap">{plan || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Signature */}
        <section className="mt-8 pt-6 border-t border-zinc-200">
          <div className="flex justify-end">
            <div className="text-center">
              {signature ? (
                <img src={signature} alt="Nurse Signature" className="max-h-16 mx-auto mb-2" />
              ) : (
                <div className="h-16 w-48 border-b border-zinc-400 mb-2 mx-auto flex items-center justify-center text-zinc-300 text-xs italic">
                  No signature provided
                </div>
              )}
              <p className="text-xs font-bold text-zinc-500 uppercase">Nurse Signature</p>
              <p className="text-[10px] text-zinc-400 italic">Electronically signed on {date}</p>
            </div>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

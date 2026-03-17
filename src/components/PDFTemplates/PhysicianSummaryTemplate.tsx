import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface PhysicianSummaryTemplateProps {
  data: any;
}

export const PhysicianSummaryTemplate: React.FC<PhysicianSummaryTemplateProps> = ({ data }) => {
  const {
    patient = {},
    diagnosis = {},
    treatments,
    medications,
    skilledTherapy,
    vitals = {},
    allergies = {},
    physical = {},
    continence = {},
    mentalStatus,
    mentalStatusOther,
    recentLabWork,
    diet,
    lastPhysicalExam,
    lastOfficeVisit,
    additionalComments,
    recommendedServices = [],
    providerSignature,
    providerName,
    providerTitle,
    dateCompleted,
    providerAddress
  } = data;

  return (
    <BasePDFTemplate title="Physician Summary Form (PSF-1)" date={dateCompleted}>
      <div className="space-y-6">
        {/* Patient Info */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Patient Information</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Last Name</p>
              <p className="font-semibold text-zinc-900">{patient.lastName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">First Name</p>
              <p className="font-semibold text-zinc-900">{patient.firstName || 'N/A'}</p>
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

        {/* Diagnosis */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Diagnosis</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Diagnosis(es)</p>
              <p className="font-medium">{diagnosis.diagnoses || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Mental Illness</p>
                <p className="font-medium">{diagnosis.mentalIllness || 'None'}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${diagnosis.intellectualDisability ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[10px] font-medium uppercase text-zinc-500">Intellectual Disability</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${diagnosis.developmentalDisability ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[10px] font-medium uppercase text-zinc-500">Developmental Disability</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Treatments & Medications */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Treatments</h3>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 min-h-[80px]">
              <p className="text-sm text-zinc-800 whitespace-pre-wrap">{treatments || 'None listed.'}</p>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Medications</h3>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 min-h-[80px]">
              <p className="text-sm text-zinc-800 whitespace-pre-wrap">{medications || 'None listed.'}</p>
            </div>
          </section>
        </div>

        {/* Vitals & Allergies */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Recent Vital Signs</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-2 border border-zinc-100 rounded">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">Date</p>
                <p className="font-medium">{vitals.date || 'N/A'}</p>
              </div>
              <div className="p-2 border border-zinc-100 rounded">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">T</p>
                <p className="font-medium">{vitals.t || '--'}</p>
              </div>
              <div className="p-2 border border-zinc-100 rounded">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">P</p>
                <p className="font-medium">{vitals.p || '--'}</p>
              </div>
              <div className="p-2 border border-zinc-100 rounded">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">R</p>
                <p className="font-medium">{vitals.r || '--'}</p>
              </div>
              <div className="p-2 border border-zinc-100 rounded col-span-2">
                <p className="text-[9px] font-bold text-zinc-400 uppercase">BP</p>
                <p className="font-medium">{vitals.bp || '--'}</p>
              </div>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Allergies</h3>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-100 min-h-[80px]">
              <div className="flex gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${allergies.noKnownAllergies ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[9px] font-medium uppercase text-zinc-500">NKA</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${allergies.noKnownDrugAllergies ? 'bg-zinc-800' : ''}`} />
                  <span className="text-[9px] font-medium uppercase text-zinc-500">NKDA</span>
                </div>
              </div>
              <p className="text-sm text-zinc-800">{allergies.list || 'No specific allergies listed.'}</p>
            </div>
          </section>
        </div>

        {/* Physical */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Physical</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Height</p>
              <p className="font-medium">{physical.height || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Weight</p>
              <p className="font-medium">{physical.weight || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Continence & Mental Status */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Continence</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Bowel</p>
                <p className="font-medium">{continence.bowel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Bladder</p>
                <p className="font-medium">{continence.bladder || 'N/A'}</p>
              </div>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Mental Status</h3>
            <p className="font-medium">{mentalStatus === 'Other' ? mentalStatusOther : mentalStatus || 'N/A'}</p>
          </section>
        </div>

        {/* Recommended Services */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Recommended Services</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Adult day health (ADH)',
              'Group adult foster care (GAFC)',
              'Adult foster care (AFC)',
              'Program for All-inclusive Care for the Elderly (PACE)',
              'Nursing facility (NF)'
            ].map(service => (
              <div key={service} className="flex items-center gap-2">
                <div className={`w-3 h-3 border border-zinc-400 rounded-sm ${recommendedServices.includes(service) ? 'bg-zinc-800' : ''}`} />
                <span className="text-xs text-zinc-700">{service}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Provider Signature */}
        <section className="mt-12 pt-8 border-t border-zinc-200">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-center p-4 border border-zinc-100 rounded-lg bg-zinc-50/30">
                {providerSignature ? (
                  <img src={providerSignature} alt="Provider Signature" className="max-h-20 mx-auto mb-2" />
                ) : (
                  <div className="h-20 w-full border-b border-zinc-300 mb-2 flex items-center justify-center text-zinc-300 text-xs italic">
                    Signature required
                  </div>
                )}
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Provider Signature</p>
                <p className="text-[9px] text-zinc-400 italic mt-1">Date: {dateCompleted || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Provider Name & Title</p>
                <p className="font-semibold text-zinc-900">{providerName}, {providerTitle}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Address</p>
                <p className="text-xs text-zinc-700 whitespace-pre-wrap">{providerAddress || 'N/A'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

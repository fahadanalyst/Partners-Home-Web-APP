import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface PatientResourceDataTemplateProps {
  data: any;
}

export const PatientResourceDataTemplate: React.FC<PatientResourceDataTemplateProps> = ({ data }) => {
  const {
    patient = {},
    demographics = {},
    emergencyContact = {},
    resources = {},
    insurance = {},
    specialInstructions
  } = data;

  const RESOURCE_FIELDS = [
    'Primary MD',
    'Clinical Contact Person',
    'Hospital of Preference',
    'Social Worker',
    'Pharmacy Name',
    'Home Care/Case Manager',
    'Meals on Wheels',
    'Transportation',
    'Adult Day Care',
    'Laboratory',
    'DME Company',
    'Homemaker Name',
    'Caregiver Support System'
  ];

  return (
    <BasePDFTemplate title="Patient Resource Data Form" date={patient.admissionDate}>
      <div className="space-y-6">
        {/* Patient Info */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Patient Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Patient Name</p>
              <p className="font-semibold text-zinc-900">{patient.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Gender</p>
              <p className="font-medium">{patient.gender || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Address</p>
              <p className="font-medium">{patient.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Telephone</p>
              <p className="font-medium">{patient.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">M.R.#</p>
              <p className="font-medium">{patient.mrNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Admission Date</p>
              <p className="font-medium">{patient.admissionDate || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Special Instructions */}
        {specialInstructions && (
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Directions / Special Instructions</h3>
            <p className="text-xs text-zinc-700 italic">{specialInstructions}</p>
          </section>
        )}

        {/* Demographics */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Demographic Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Date of Birth</p>
              <p className="font-medium">{demographics.dob || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Primary Language</p>
              <p className="font-medium">{demographics.primaryLanguage || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Religion</p>
              <p className="font-medium">{demographics.religion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Marital Status</p>
              <p className="font-medium">{demographics.maritalStatus || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Race / Ethnicity</p>
              <p className="font-medium">
                {demographics.raceEthnicity?.join(', ')}
                {demographics.raceOther ? ` (${demographics.raceOther})` : ''}
              </p>
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Emergency Contact</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Name</p>
              <p className="font-semibold text-zinc-900">{emergencyContact.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Relationship</p>
              <p className="font-medium">{emergencyContact.relationship || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Address</p>
              <p className="font-medium">{emergencyContact.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Telephone (Home)</p>
              <p className="font-medium">{emergencyContact.telephoneHome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Telephone (Business)</p>
              <p className="font-medium">{emergencyContact.telephoneBusiness || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Resources Table */}
        <section className="space-y-2 page-break">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Health and Community Resources</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Resource</th>
                <th className="py-2 px-3 text-[10px] font-bold text-zinc-500 uppercase">Name / Agency / Telephone</th>
              </tr>
            </thead>
            <tbody>
              {RESOURCE_FIELDS.map(field => (
                <tr key={field} className="border-b border-zinc-100">
                  <td className="py-2 px-3 text-xs font-bold text-zinc-700 bg-zinc-50/30">{field}</td>
                  <td className="py-2 px-3 text-xs text-zinc-600">{resources[field] || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Insurance */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Insurance Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Medicare Number</p>
              <p className="font-medium">{insurance.medicareNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Medicaid Number</p>
              <p className="font-medium">{insurance.medicaidNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Other Insurance</p>
              <p className="font-medium">{insurance.other || 'N/A'}</p>
            </div>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

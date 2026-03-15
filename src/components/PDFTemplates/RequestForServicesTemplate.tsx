import React from 'react';
import { BasePDFTemplate } from './BasePDFTemplate';

interface RequestForServicesTemplateProps {
  data: any;
}

export const RequestForServicesTemplate: React.FC<RequestForServicesTemplateProps> = ({ data }) => {
  const {
    date,
    servicesRequested = [],
    otherService,
    nursingFacilityUseOnly = [],
    memberInfo = {},
    nextOfKin = {},
    physician = {},
    screening = {},
    communityServices = [],
    communityServicesOther,
    additionalInfo = {},
    nursingFacilityRequests = {},
    referralSource = {}
  } = data;

  return (
    <BasePDFTemplate title="Request for Services (RFS-1)" date={date}>
      <div className="space-y-6">
        {/* Services Requested */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Service(s) Requested</h3>
            <div className="grid grid-cols-1 gap-1">
              {servicesRequested.map((s: string) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-partners-green rounded-full" />
                  <span className="text-[11px] text-zinc-700">{s === 'Other' ? `Other: ${otherService || ''}` : s}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Nursing Facility Use Only</h3>
            <div className="grid grid-cols-1 gap-1">
              {nursingFacilityUseOnly.map((s: string) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full" />
                  <span className="text-[11px] text-zinc-700">{s}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Member Information */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Member Information</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Member Name</p>
              <p className="font-semibold text-zinc-900">{memberInfo.firstName} {memberInfo.lastName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Telephone</p>
              <p className="font-medium">{memberInfo.telephone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">MassHealth ID</p>
              <p className="font-medium">{memberInfo.masshealthId || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Address</p>
              <p className="font-medium">{memberInfo.address}, {memberInfo.city}, {memberInfo.zip}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Status</p>
              <p className="font-medium">{memberInfo.status || 'N/A'}</p>
            </div>
          </div>
        </section>

        {/* Next of Kin & Physician */}
        <div className="grid grid-cols-2 gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Next of Kin</h3>
            <div className="text-xs space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Name:</span> {nextOfKin.firstName} {nextOfKin.lastName}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Phone:</span> {nextOfKin.telephone}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Address:</span> {nextOfKin.address}, {nextOfKin.city}, {nextOfKin.zip}</p>
            </div>
          </section>
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Physician</h3>
            <div className="text-xs space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Name:</span> {physician.firstName} {physician.lastName}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Phone:</span> {physician.telephone}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Address:</span> {physician.address}, {physician.city}, {physician.zip}</p>
            </div>
          </section>
        </div>

        {/* Screening */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Screening</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Mental Illness:</span> {screening.mentalIllness ? `Yes (${screening.mentalIllnessSpecify || 'N/A'})` : 'No'}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Mental Retardation:</span> {screening.mentalRetardation ? 'Yes' : 'No'}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Developmental Disability:</span> {screening.developmentalDisability ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-zinc-400 uppercase">Related Conditions:</p>
              <p className="text-zinc-600">{screening.conditions?.length > 0 ? screening.conditions.join(', ') : 'None'}</p>
            </div>
          </div>
        </section>

        {/* Community Services */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Community Services Recommended</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {communityServices.map((s: string) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-partners-blue rounded-full" />
                <span className="text-[10px] text-zinc-700">{s === 'Other' ? `Other: ${communityServicesOther || ''}` : s}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Info */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-partners-blue-dark border-b border-partners-blue-dark/20 pb-1 uppercase tracking-tight">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Home Available:</span> {additionalInfo.homeAvailable}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Caregiver Available:</span> {additionalInfo.caregiverAvailable}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Weight Gain:</span> {additionalInfo.weightGain}</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Personal Care Services:</span> {additionalInfo.personalCareServices === 'yes' ? `Yes (${additionalInfo.daysPerWeek} days/wk, ${additionalInfo.hoursPerWeek} hrs/wk)` : 'No'}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Change in Condition:</span> {additionalInfo.changeInCondition === 'yes' ? `Yes (${additionalInfo.changeType}: ${additionalInfo.changeDetails})` : 'No'}</p>
            </div>
          </div>
        </section>

        {/* Referral Source */}
        <section className="mt-8 pt-6 border-t border-zinc-200">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Referral Signature</p>
              {referralSource.signature && (
                <img src={referralSource.signature} alt="Signature" className="max-h-16 object-contain" />
              )}
              <div className="w-full border-b border-zinc-300" />
              <p className="text-[10px] text-zinc-500 italic">Signed by: {referralSource.printName}, {referralSource.title}</p>
            </div>
            <div className="text-[10px] space-y-1">
              <p><span className="font-bold text-zinc-400 uppercase">Organization:</span> {referralSource.organization}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Telephone:</span> {referralSource.telephone}</p>
              <p><span className="font-bold text-zinc-400 uppercase">Address:</span> {referralSource.address}, {referralSource.city}, {referralSource.zip}</p>
            </div>
          </div>
        </section>
      </div>
    </BasePDFTemplate>
  );
};

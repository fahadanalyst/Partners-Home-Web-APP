import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { FileText, Printer, Send, ArrowLeft, Loader2, Download } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { exportToPDF } from '../utils/pdfExport';

import { useAuth } from '../context/AuthContext';

const adlLevels = ['Independent', 'Needs Cueing', 'Needs Assistance', 'Dependent'] as const;

const FORM_NAME = 'GAFC Progress Note';

const gafcSchema = z.object({
  participantName: z.string().min(1, 'Required'),
  dob: z.string().min(1, 'Required'),
  gafcProvider: z.string().min(1, 'Required'),
  visitDate: z.string().min(1, 'Required'),
  visitTime: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  staffNameTitle: z.string().min(1, 'Required'),
  reasonForVisit: z.string().min(1, 'Required'),
  
  subjective: z.object({
    currentConcerns: z.string().optional(),
    changesSinceLastVisit: z.string().optional(),
    painSymptoms: z.string().optional(),
    moodMentalStatus: z.string().optional(),
    participantComments: z.string().optional(),
  }),
  
  objective: z.object({
    generalAppearance: z.string().optional(),
    vitals: z.object({
      bp: z.string().optional(),
      hr: z.string().optional(),
      rr: z.string().optional(),
      temp: z.string().optional(),
      spo2: z.string().optional(),
    }),
    physicalAssessment: z.object({
      respiratory: z.string().optional(),
      cardiac: z.string().optional(),
      skinIntegrity: z.string().optional(),
      mobilityGait: z.string().optional(),
      nutritionAppetite: z.string().optional(),
    }),
  }),
  
  environmentSafety: z.object({
    cleanliness: z.string().optional(),
    clutterHazards: z.string().optional(),
    functioningUtilities: z.string().optional(),
    emergencyPlanAwareness: z.string().optional(),
  }),
  
  medicationReview: z.object({
    presentAndLabeled: z.enum(['Yes', 'No']).optional(),
    ableToSelfAdminister: z.enum(['Yes', 'No']).optional(),
    issuesNoted: z.string().optional(),
  }),
  
  adls: z.record(z.string(), z.object({
    level: z.enum(adlLevels).optional(),
    notes: z.string().optional(),
  })),
  
  assessment: z.string().optional(),
  interventions: z.array(z.string()).optional(),
  education: z.string().optional(),
  
  plan: z.object({
    followUpActions: z.string().optional(),
    referralsCoordination: z.string().optional(),
    nextScheduledVisit: z.string().optional(),
    participantInstructedToReport: z.string().optional(),
  }),
  
  staffSignature: z.string().min(1, 'Signature required'),
  signatureDate: z.string().min(1, 'Required'),
});

type GAFCFormValues = z.infer<typeof gafcSchema>;

const ADL_TASKS = [
  'Bathing', 'Dressing', 'Grooming', 'Toileting', 'Mobility', 'Meal Prep', 'Housekeeping', 'Medication Mgmt'
];

export const GAFCProgressNote: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<GAFCFormValues>({
    resolver: zodResolver(gafcSchema),
    defaultValues: {
      visitDate: new Date().toISOString().split('T')[0],
      signatureDate: new Date().toISOString().split('T')[0],
      medicationReview: {
        presentAndLabeled: 'Yes',
        ableToSelfAdminister: 'Yes',
      },
      adls: ADL_TASKS.reduce((acc, task) => ({
        ...acc,
        [task]: { level: 'Independent', notes: '' }
      }), {}),
      interventions: ['', '', ''],
    }
  });

  const [formId, setFormId] = useState<string | null>(null);
  const [isFetchingForm, setIsFetchingForm] = useState(true);

  useEffect(() => {
    const fetchFormId = async () => {
      try {
        const id = await getFormIdByName(FORM_NAME);
        setFormId(id);
      } finally {
        setIsFetchingForm(false);
      }
    };
    fetchFormId();
  }, []);

  useEffect(() => {
    if (patientId) {
      const fetchPatient = async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('participantName', `${data.first_name} ${data.last_name}`);
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const submitForm = async (data: GAFCFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      alert('You must be logged in to submit notes.');
      return;
    }

    console.log(`GAFC Note: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`GAFC Note: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`GAFC Note: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists to prevent foreign key errors
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle(), 60000)) as any;
      
      if (patientCheckError) {
        console.error('GAFC Note: Patient check error:', patientCheckError);
      }
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist in the database.`);
      }

      // 2. Insert into form_responses
      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: currentFormId,
          patient_id: patientId,
          staff_id: profile.id,
          data: data,
          status: status
        }])
        .select()
        .single();
      
      if (responseError) {
        console.error('GAFC Note: Response insertion error:', responseError);
        throw responseError;
      }
      
      if (!responseData) {
        throw new Error('No data returned from form submission. This might be due to database permissions (RLS).');
      }

      console.log('GAFC Note: Response inserted successfully, ID:', responseData.id);

      // 3. Insert signature if present
      if (data.staffSignature) {
        console.log('GAFC Note: Inserting signature...');
        const { error: sigError } = await supabase
          .from('signatures')
          .insert([{
            parent_id: responseData.id,
            parent_type: 'form_response',
            signer_id: profile.id,
            signature_data: data.staffSignature
          }]);
        
        if (sigError) {
          console.error('GAFC Note: Signature insertion error:', sigError);
          throw sigError;
        }
        console.log('GAFC Note: Signature inserted successfully');
      }
      
      alert(status === 'draft' ? 'Draft saved successfully!' : 'Progress note submitted successfully!');
      if (status === 'submitted') {
        reset();
      }
    } catch (error: any) {
      console.error('GAFC Note: Caught error during submission:', error);
      alert(`Error submitting form: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSavingDraft(false);
      console.log('GAFC Note: Submission process finished.');
    }
  };

  const onSubmit = async (data: GAFCFormValues) => await submitForm(data, 'submitted');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handlePrint = async () => {
    if (!formRef.current) return;
    try {
      setIsGeneratingPDF(true);
      await exportToPDF(formRef.current, `GAFC_Progress_Note_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF. Please try again or use the browser print feature.');
      if (formRef.current) formRef.current.classList.remove('pdf-mode');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
            <FileText className="text-partners-green" />
            GAFC Progress Note Form
          </h2>
          <p className="text-partners-gray">Complete the monthly clinical progress note.</p>
        </div>
        <div className="flex flex-wrap gap-3 no-print w-full md:w-auto">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="flex-1 md:flex-none"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 md:flex-none"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Note'}
          </Button>
        </div>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600 font-bold mb-1">Please fix the following errors:</p>
            <ul className="list-disc ml-5 text-xs text-red-500">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{(error as any).message || `${key} is invalid`}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Header Information */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Participant Name</label>
            <input {...register('participantName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            {errors.participantName && <p className="text-xs text-red-500">{errors.participantName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">DOB</label>
            <input type="date" {...register('dob')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">GAFC Provider</label>
            <input {...register('gafcProvider')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date of Visit</label>
            <input type="date" {...register('visitDate')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Time of Visit</label>
            <input type="time" {...register('visitTime')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Location</label>
            <input {...register('location')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
          <div className="space-y-1 col-span-full">
            <label className="text-sm font-medium text-zinc-700">Staff Name & Title</label>
            <input {...register('staffNameTitle')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
        </section>

        {/* Reason for Visit */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Reason for Visit</label>
          <textarea {...register('reasonForVisit')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" placeholder="Example: Monthly GAFC nursing visit, follow up after medication change, safety check, etc." />
        </section>

        {/* Subjective */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Participant Report (Subjective)</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Current concerns</label>
              <input {...register('subjective.currentConcerns')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Changes since last visit</label>
              <input {...register('subjective.changesSinceLastVisit')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Pain, symptoms, or new issues</label>
              <input {...register('subjective.painSymptoms')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Mood/mental status as reported</label>
              <input {...register('subjective.moodMentalStatus')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Participant comments</label>
              <textarea {...register('subjective.participantComments')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </section>

        {/* Objective */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Observations (Objective)</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">General Appearance & Behavior</label>
              <input {...register('objective.generalAppearance')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase">BP</label>
                <input {...register('objective.vitals.bp')} className="w-full px-3 py-2 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase">HR</label>
                <input {...register('objective.vitals.hr')} className="w-full px-3 py-2 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase">RR</label>
                <input {...register('objective.vitals.rr')} className="w-full px-3 py-2 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase">Temp</label>
                <input {...register('objective.vitals.temp')} className="w-full px-3 py-2 rounded-lg border border-zinc-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase">SpO₂</label>
                <input {...register('objective.vitals.spo2')} className="w-full px-3 py-2 rounded-lg border border-zinc-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Respiratory</label>
                <input {...register('objective.physicalAssessment.respiratory')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Cardiac</label>
                <input {...register('objective.physicalAssessment.cardiac')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Skin integrity</label>
                <input {...register('objective.physicalAssessment.skinIntegrity')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Mobility/gait</label>
                <input {...register('objective.physicalAssessment.mobilityGait')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-sm font-medium text-zinc-700">Nutrition/appetite</label>
                <input {...register('objective.physicalAssessment.nutritionAppetite')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Environment / Safety */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Environment / Safety Check</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Cleanliness</label>
              <input {...register('environmentSafety.cleanliness')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Clutter/hazards</label>
              <input {...register('environmentSafety.clutterHazards')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Functioning utilities</label>
              <input {...register('environmentSafety.functioningUtilities')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Emergency plan awareness</label>
              <input {...register('environmentSafety.emergencyPlanAwareness')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </section>

        {/* Medication Review */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Medication Review</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Medications present and labeled</label>
              <div className="flex gap-4">
                {['Yes', 'No'].map(val => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={val} {...register('medicationReview.presentAndLabeled')} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">{val}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Participant able to self administer</label>
              <div className="flex gap-4">
                {['Yes', 'No'].map(val => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={val} {...register('medicationReview.ableToSelfAdminister')} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">{val}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-sm font-medium text-zinc-700">Issues noted</label>
              <textarea {...register('medicationReview.issuesNoted')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </section>

        {/* ADLs / IADLs Review */}
        <section className="space-y-4 overflow-x-auto">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">ADLs / IADLs Review</h3>
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-3 px-4 text-sm font-bold text-zinc-900">Task</th>
                {adlLevels.map(level => (
                  <th key={level} className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase text-center">{level}</th>
                ))}
                <th className="py-3 px-4 text-sm font-bold text-zinc-900">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ADL_TASKS.map(task => (
                <tr key={task} className="border-b border-zinc-100">
                  <td className="py-3 px-4 text-sm font-medium text-zinc-700">{task}</td>
                  {adlLevels.map(level => (
                    <td key={level} className="py-3 px-4 text-center">
                      <input 
                        type="radio" 
                        value={level} 
                        {...register(`adls.${task}.level`)} 
                        className="w-4 h-4 text-partners-blue-dark"
                      />
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <input {...register(`adls.${task}.notes`)} className="w-full px-3 py-1 text-sm rounded-lg border border-zinc-200" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Assessment & Interventions */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Assessment</h3>
            <p className="text-xs text-zinc-500 mb-2">(Clinical impressions, stability, risks, changes in condition, GAFC eligibility indicators.)</p>
            <textarea {...register('assessment')} rows={4} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Interventions Provided Today</h3>
            {[0, 1, 2].map(i => (
              <input key={i} {...register(`interventions.${i}`)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" placeholder={`Intervention ${i + 1}`} />
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Education Provided</h3>
            <p className="text-xs text-zinc-500 mb-2">(Examples: medication adherence, fall prevention, chronic disease management.)</p>
            <textarea {...register('education')} rows={2} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
        </section>

        {/* Plan */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b pb-2">Plan</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Follow up actions</label>
              <input {...register('plan.followUpActions')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Referrals/coordination</label>
              <input {...register('plan.referralsCoordination')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Next scheduled visit</label>
              <input {...register('plan.nextScheduledVisit')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">• Participant instructed to report</label>
              <input {...register('plan.participantInstructedToReport')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </section>

        {/* Signature */}
        <section className="space-y-6 pt-6 border-t border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SignaturePad 
                label="Staff Signature" 
                onSave={(sig) => setValue('staffSignature', sig, { shouldValidate: true })} 
              />
              {errors.staffSignature && <p className="text-xs text-red-500">{errors.staffSignature.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Date</label>
              <input type="date" {...register('signatureDate')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};


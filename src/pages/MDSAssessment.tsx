import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { ClipboardCheck, Send, User, Brain, HeartPulse, Activity, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Notification, NotificationType } from '../components/Notification';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'MDS Assessment';

const mdsSchema = z.object({
  assessmentDate: z.string().min(1, 'Required'),
  patient: z.object({
    name: z.string().min(1, 'Required'),
    dob: z.string().optional(),
    gender: z.enum(['Male', 'Female']).optional(),
    medicareId: z.string().optional(),
  }),
  cognitive: z.object({
    memory: z.enum(['Intact', 'Impaired']).optional(),
    decisionMaking: z.enum(['Independent', 'Modified Independent', 'Moderately Impaired', 'Severely Impaired']).optional(),
    orientation: z.array(z.string()),
  }),
  mood: z.object({
    depression: z.boolean(),
    anxiety: z.boolean(),
    behavioralSymptoms: z.string().optional(),
  }),
  physical: z.object({
    adlAssistance: z.enum(['Independent', 'Supervision', 'Limited Assistance', 'Extensive Assistance', 'Total Dependence']).optional(),
    mobility: z.enum(['Independent', 'Supervision', 'Limited Assistance', 'Extensive Assistance', 'Total Dependence']).optional(),
    falls: z.enum(['None', 'One', 'Two or more']).optional(),
  }),
  diagnoses: z.array(z.string()),
  diagnosesOther: z.string().optional(),
  medications: z.object({
    antipsychotic: z.boolean(),
    antianxiety: z.boolean(),
    antidepressant: z.boolean(),
    hypnotic: z.boolean(),
    anticoagulant: z.boolean(),
    antibiotic: z.boolean(),
    diuretic: z.boolean(),
  }),
  summary: z.string().optional(),
});

type MDSFormValues = z.infer<typeof mdsSchema>;

export const MDSAssessment: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<MDSFormValues>({
    resolver: zodResolver(mdsSchema),
    defaultValues: {
      assessmentDate: new Date().toISOString().split('T')[0],
      cognitive: { orientation: [] },
      mood: { depression: false, anxiety: false },
      physical: {},
      diagnoses: [],
      medications: {
        antipsychotic: false,
        antianxiety: false,
        antidepressant: false,
        hypnotic: false,
        anticoagulant: false,
        antibiotic: false,
        diuretic: false
      },
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
    if (patientId && patientId !== DUMMY_PATIENT_ID) {
      const fetchPatient = async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name, dob, gender')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('patient.name', `${data.first_name} ${data.last_name}`);
          setValue('patient.dob', data.dob);
          setValue('patient.gender', data.gender === 'female' ? 'Female' : 'Male');
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const submitForm = async (data: MDSFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      setNotification({ type: 'error', message: 'You must be logged in to submit forms.' });
      return;
    }

    console.log(`MDS Form: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`MDS Form: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`MDS Form: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle(), 60000)) as any;
      
      if (patientCheckError) {
        console.error('MDS Form: Patient check error:', patientCheckError);
      }
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist in the database. Please go to the Dashboard and click "Setup Now" to create the test patient.`);
      }

      // 2. Insert into form_responses
      const { error: responseError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: currentFormId,
          patient_id: patientId,
          staff_id: profile.id,
          data: data,
          status: status
        }]);
      
      if (responseError) {
        console.error('MDS Form: Response insertion error:', responseError);
        throw responseError;
      }
      
      setNotification({ 
        type: 'success', 
        message: status === 'draft' ? 'Draft saved successfully!' : 'MDS Assessment submitted successfully!' 
      });
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error('MDS Form: Caught error during submission:', error);
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSavingDraft(false);
      console.log('MDS Form: Submission process finished.');
    }
  };

  const onSubmit = async (data: MDSFormValues) => await submitForm(data, 'submitted');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      const success = await generateFormPDF(FORM_NAME, formData);
      
      if (!success && formRef.current) {
        // Fallback to old method if no template exists
        const { exportToPDF } = await import('../utils/pdfExport');
        await exportToPDF(formRef.current, `MDS_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <ClipboardCheck className="text-partners-green" />
              Minimum Data Set (MDS) Assessment
            </h2>
            <p className="text-partners-gray">Comprehensive clinical assessment for care planning.</p>
          </div>
        </div>
        <div className="flex gap-3 no-print">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="h-11 px-6 rounded-xl shadow-sm"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-11 px-8 rounded-xl shadow-md"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="flex justify-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Assessment Date <span className="text-red-500">*</span></label>
            <input type="date" {...register('assessmentDate')} className="px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
          </div>
        </div>

        {/* Identification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <User size={20} />
            <h3>Identification Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Patient Name <span className="text-red-500">*</span></label>
              <input {...register('patient.name')} placeholder="Enter patient name" className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Date of Birth</label>
                <input type="date" {...register('patient.dob')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Gender</label>
                <select {...register('patient.gender')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Cognitive & Mood */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Brain size={20} />
              <h3>Cognitive Patterns</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Short-term Memory</label>
                <div className="flex gap-4">
                  {['Intact', 'Impaired'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={v} {...register('cognitive.memory')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Cognitive Skills for Decision Making</label>
                <div className="space-y-1">
                  {['Independent', 'Modified Independent', 'Moderately Impaired', 'Severely Impaired'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={v} {...register('cognitive.decisionMaking')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Activity size={20} />
              <h3>Mood and Behavior</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('mood.depression')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">Depression</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('mood.anxiety')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">Anxiety</span>
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Behavioral Symptoms</label>
                <textarea {...register('mood.behavioralSymptoms')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" placeholder="Describe any behavioral symptoms..." />
              </div>
            </div>
          </div>
        </section>

        {/* Physical Functioning */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <Activity size={20} />
            <h3>Physical Functioning</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">ADL Self-Performance (Eating, Bathing, Dressing)</label>
              <div className="space-y-1">
                {['Independent', 'Supervision', 'Limited Assistance', 'Extensive Assistance', 'Total Dependence'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={v} {...register('physical.adlAssistance')} className="w-4 h-4 text-partners-blue-dark" />
                    <span className="text-sm">{v}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Mobility</label>
                <div className="space-y-1">
                  {['Independent', 'Supervision', 'Limited Assistance', 'Extensive Assistance', 'Total Dependence'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={v} {...register('physical.mobility')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Number of Falls in last 90 days</label>
                <div className="flex gap-4">
                  {['None', 'One', 'Two or more'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={v} {...register('physical.falls')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">{v}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diagnoses & Medications */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <HeartPulse size={20} />
              <h3>Active Diagnoses</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Hypertension', 'Diabetes', 'CHF', 'COPD', 'Dementia', 'Alzheimer\'s', 'CVA', 'Arthritis', 'Anemia', 'Renal Failure'
              ].map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" value={d} {...register('diagnoses')} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-xs">{d}</span>
                </label>
              ))}
            </div>
            <input {...register('diagnosesOther')} className="w-full border-b border-zinc-200 outline-none text-sm py-1" placeholder="Other diagnoses..." />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Activity size={20} />
              <h3>Medications (Received in last 7 days)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'antipsychotic', label: 'Antipsychotic' },
                { id: 'antianxiety', label: 'Antianxiety' },
                { id: 'antidepressant', label: 'Antidepressant' },
                { id: 'hypnotic', label: 'Hypnotic' },
                { id: 'anticoagulant', label: 'Anticoagulant' },
                { id: 'antibiotic', label: 'Antibiotic' },
                { id: 'diuretic', label: 'Diuretic' },
              ].map(m => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register(`medications.${m.id}` as any)} className="w-4 h-4 rounded border-zinc-300" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="space-y-2">
          <h3 className="font-bold text-zinc-900 border-b pb-2">Assessment Summary</h3>
          <textarea {...register('summary')} rows={6} className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue/20 outline-none transition-all" placeholder="Provide a clinical summary of the assessment findings..." />
        </section>
      </form>
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

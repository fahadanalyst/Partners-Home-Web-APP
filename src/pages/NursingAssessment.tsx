import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { ClipboardList, Send, User, Activity, Heart, Wind, Brain, Info, ArrowLeft, Loader2, Download } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { exportToPDF } from '../utils/pdfExport';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Nursing Assessment';

const nursingSchema = z.object({
  date: z.string().min(1, 'Required'),
  time: z.string().optional(),
  patient: z.object({
    name: z.string().min(1, 'Required'),
    dob: z.string().optional(),
  }),
  vitals: z.object({
    temp: z.string().optional(),
    pulse: z.string().optional(),
    resp: z.string().optional(),
    bp: z.string().optional(),
    spo2: z.string().optional(),
    weight: z.string().optional(),
    pain: z.string().optional(),
  }),
  neurological: z.object({
    orientation: z.array(z.string()),
    pupils: z.string().optional(),
    speech: z.string().optional(),
  }),
  respiratory: z.object({
    breathSounds: z.string().optional(),
    cough: z.string().optional(),
    oxygen: z.string().optional(),
  }),
  cardiovascular: z.object({
    rhythm: z.string().optional(),
    edema: z.string().optional(),
    capRefill: z.string().optional(),
  }),
  gi: z.object({
    bowelSounds: z.string().optional(),
    lastBm: z.string().optional(),
    diet: z.string().optional(),
  }),
  gu: z.object({
    voiding: z.string().optional(),
    urineColor: z.string().optional(),
  }),
  skin: z.object({
    condition: z.string().optional(),
    turgor: z.string().optional(),
    wounds: z.string().optional(),
  }),
  psychosocial: z.string().optional(),
  nursingDiagnosis: z.string().optional(),
  plan: z.string().optional(),
  signature: z.string().min(1, 'Signature required'),
});

type NursingFormValues = z.infer<typeof nursingSchema>;

export const NursingAssessment: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<NursingFormValues>({
    resolver: zodResolver(nursingSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      neurological: { orientation: [] },
      vitals: {},
      respiratory: {},
      cardiovascular: {},
      gi: {},
      gu: {},
      skin: {},
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
          .select('first_name, last_name, dob')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('patient.name', `${data.first_name} ${data.last_name}`);
          setValue('patient.dob', data.dob);
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const submitForm = async (data: NursingFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      alert('You must be logged in to submit forms.');
      return;
    }

    console.log(`Nursing Assessment: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`Nursing Assessment: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`Nursing Assessment: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle(), 60000)) as any;
      
      if (patientCheckError) {
        console.error('Nursing Assessment: Patient check error:', patientCheckError);
      }
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist in the database. Please go to the Dashboard and click "Setup Now" to create the test patient.`);
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
        console.error('Nursing Assessment: Response insertion error:', responseError);
        throw responseError;
      }

      if (!responseData) {
        throw new Error('No data returned from form submission. This might be due to database permissions (RLS).');
      }

      console.log('Nursing Assessment: Response inserted successfully, ID:', responseData.id);

      // 3. Insert signature if present
      if (data.signature) {
        console.log('Nursing Assessment: Inserting signature...');
        const { error: sigError } = await supabase
          .from('signatures')
          .insert([{
            parent_id: responseData.id,
            parent_type: 'form_response',
            signer_id: profile.id,
            signature_data: data.signature
          }]);
        
        if (sigError) {
          console.error('Nursing Assessment: Signature insertion error:', sigError);
          throw sigError;
        }
        console.log('Nursing Assessment: Signature inserted successfully');
      }
      
      alert(status === 'draft' ? 'Draft saved successfully!' : 'Nursing Assessment submitted successfully!');
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error('Nursing Assessment: Caught error during submission:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSavingDraft(false);
      console.log('Nursing Assessment: Submission process finished.');
    }
  };

  const onSubmit = async (data: NursingFormValues) => await submitForm(data, 'submitted');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handlePrint = async () => {
    if (!formRef.current) return;
    try {
      setIsGeneratingPDF(true);
      await exportToPDF(formRef.current, `Nursing_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
            <ClipboardList className="text-partners-green" />
            Comprehensive Nursing Assessment
          </h2>
          <p className="text-partners-gray">Detailed head-to-toe nursing evaluation.</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
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
        <div className="flex justify-between items-start">
          <div className="space-y-4 flex-1 max-w-md">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Patient Name</label>
              <input {...register('patient.name')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Date</label>
              <input type="date" {...register('date')} className="px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Time</label>
              <input type="time" {...register('time')} className="px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
          </div>
        </div>

        {/* Vitals */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
            <Activity size={20} />
            <h3>Vital Signs</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { id: 'temp', label: 'Temp', unit: '°F' },
              { id: 'pulse', label: 'Pulse', unit: 'bpm' },
              { id: 'resp', label: 'Resp', unit: '/min' },
              { id: 'bp', label: 'BP', unit: 'mmHg' },
              { id: 'spo2', label: 'SpO2', unit: '%' },
              { id: 'weight', label: 'Weight', unit: 'lbs' },
              { id: 'pain', label: 'Pain', unit: '/10' },
            ].map(v => (
              <div key={v.id} className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">{v.label} ({v.unit})</label>
                <input {...register(`vitals.${v.id}` as any)} className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              </div>
            ))}
          </div>
        </section>

        {/* Systems Review */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Neurological */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Brain size={18} />
              <h3>Neurological</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Orientation</label>
                <div className="flex flex-wrap gap-3">
                  {['Person', 'Place', 'Time', 'Situation'].map(o => (
                    <label key={o} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={o} {...register('neurological.orientation')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">Pupils / Speech</label>
                <input {...register('neurological.pupils')} placeholder="Pupils (PERRLA?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm mb-2" />
                <input {...register('neurological.speech')} placeholder="Speech (Clear, Slurred?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              </div>
            </div>
          </section>

          {/* Respiratory */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Wind size={18} />
              <h3>Respiratory</h3>
            </div>
            <div className="space-y-3">
              <input {...register('respiratory.breathSounds')} placeholder="Breath Sounds (Clear, Crackles, Wheezes?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              <input {...register('respiratory.cough')} placeholder="Cough (Productive, Non-productive?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              <input {...register('respiratory.oxygen')} placeholder="Oxygen (Room Air, 2L NC?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
            </div>
          </section>

          {/* Cardiovascular */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Heart size={18} />
              <h3>Cardiovascular</h3>
            </div>
            <div className="space-y-3">
              <input {...register('cardiovascular.rhythm')} placeholder="Rhythm (Regular, Irregular?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              <input {...register('cardiovascular.edema')} placeholder="Edema (Location, Grade?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              <input {...register('cardiovascular.capRefill')} placeholder="Capillary Refill (< 3s?)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
            </div>
          </section>

          {/* GI / GU */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Info size={18} />
              <h3>GI / GU</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input {...register('gi.bowelSounds')} placeholder="Bowel Sounds" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('gi.lastBm')} placeholder="Last BM" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('gu.voiding')} placeholder="Voiding" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              <input {...register('gu.urineColor')} placeholder="Urine Color" className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
            </div>
          </section>
        </div>

        {/* Skin & Psychosocial */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Integumentary (Skin)</h3>
            <div className="space-y-3">
              <input {...register('skin.condition')} placeholder="Color, Temp, Moisture" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
              <input {...register('skin.wounds')} placeholder="Wounds, Incisions, Pressure Ulcers" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Psychosocial</h3>
            <textarea {...register('psychosocial')} rows={3} placeholder="Mood, Affect, Coping..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
          </div>
        </section>

        {/* Diagnosis & Plan */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Nursing Diagnosis</h3>
            <textarea {...register('nursingDiagnosis')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-zinc-900 border-b pb-2">Plan of Care / Interventions</h3>
            <textarea {...register('plan')} rows={4} className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm" />
          </div>
        </section>

        {/* Signature */}
        <section className="pt-8 border-t border-zinc-200">
          <div className="max-w-md">
            <SignaturePad 
              label="Nurse Signature" 
              onSave={(sig) => setValue('signature', sig, { shouldValidate: true })} 
            />
            {errors.signature && <p className="text-xs text-red-500 mt-1">{errors.signature.message}</p>}
          </div>
        </section>
      </form>
    </div>
  );
};

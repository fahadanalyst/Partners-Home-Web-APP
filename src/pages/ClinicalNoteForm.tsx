import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { FileText, Send, User, Clock, Tag, ArrowLeft, Loader2, Download } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Logo } from '../components/Logo';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Clinical Note';

const clinicalNoteSchema = z.object({
  date: z.string().min(1, 'Required'),
  time: z.string().optional(),
  patient: z.object({
    name: z.string().min(1, 'Required'),
  }),
  noteType: z.enum(['Nursing', 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Social Work', 'Other']),
  soap: z.object({
    subjective: z.string().optional(),
    objective: z.string().optional(),
    assessment: z.string().optional(),
    plan: z.string().optional(),
  }),
  narrative: z.string().optional(),
  signature: z.string().min(1, 'Signature required'),
});

type ClinicalNoteFormValues = z.infer<typeof clinicalNoteSchema>;

export const ClinicalNoteForm: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const patientIdFromUrl = searchParams.get('patientId');
  const visitIdFromUrl = searchParams.get('visitId');
  const patientId = patientIdFromUrl || DUMMY_PATIENT_ID;

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<ClinicalNoteFormValues>({
    resolver: zodResolver(clinicalNoteSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      noteType: 'Nursing',
      soap: {}
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
    if (editId) {
      fetchSubmission();
    }
  }, [editId]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('id', editId)
        .single();
      
      if (data && !error) {
        reset(data.data);
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  useEffect(() => {
    if (patientId && patientId !== DUMMY_PATIENT_ID) {
      const fetchPatient = async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('first_name, last_name')
          .eq('id', patientId)
          .single();
        
        if (data && !error) {
          setValue('patient.name', `${data.first_name} ${data.last_name}`);
        }
      };
      fetchPatient();
    }
  }, [patientId, setValue]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const submitForm = async (data: ClinicalNoteFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      alert('You must be logged in to submit forms.');
      return;
    }

    console.log(`Clinical Note: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`Clinical Note: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`Clinical Note: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle())) as any;
      
      if (patientCheckError) {
        console.error('Clinical Note: Patient check error:', patientCheckError);
      }
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist in the database. Please go to the Dashboard and click "Setup Now" to create the test patient.`);
      }

      // 2. Insert or Update form_responses
      let responseData;
      if (editId) {
        const { data: updateResult, error: responseError } = await supabase
          .from('form_responses')
          .update({
            data: data,
            status: status,
            visit_id: visitIdFromUrl || undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .select()
          .single();
        
        if (responseError) throw responseError;
        responseData = updateResult;
      } else {
        const { data: insertResult, error: responseError } = await supabase
          .from('form_responses')
          .insert([{
            form_id: currentFormId,
            patient_id: patientId,
            staff_id: profile.id,
            visit_id: visitIdFromUrl || null,
            data: data,
            status: status
          }])
          .select()
          .single();
        
        if (responseError) throw responseError;
        responseData = insertResult;
      }

      if (!responseData) {
        throw new Error('No data returned from form submission. This might be due to database permissions (RLS).');
      }

      console.log('Clinical Note: Response inserted successfully, ID:', responseData.id);

      // 3. Insert signature if present
      if (data.signature) {
        console.log('Clinical Note: Inserting signature...');
        const { error: sigError } = await supabase
          .from('signatures')
          .insert([{
            parent_id: responseData.id,
            parent_type: 'form_response',
            signer_id: profile.id,
            signature_data: data.signature
          }]);
        
        if (sigError) {
          console.error('Clinical Note: Signature insertion error:', sigError);
          throw sigError;
        }
        console.log('Clinical Note: Signature inserted successfully');
      }
      
      alert(status === 'draft' ? 'Draft saved successfully!' : 'Clinical note submitted successfully!');
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error('Clinical Note: Caught error during submission:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSavingDraft(false);
      console.log('Clinical Note: Submission process finished.');
    }
  };

  const onSubmit = async (data: ClinicalNoteFormValues) => await submitForm(data, 'submitted');
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
        await exportToPDF(formRef.current, `Clinical_Note_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <Logo className="h-16 w-auto" />
          <div>
            <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <FileText className="text-partners-green" />
              Clinical Note
            </h2>
            <p className="text-partners-gray">General clinical observations and documentation.</p>
          </div>
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
            {isSubmitting ? 'Submitting...' : 'Submit Note'}
          </Button>
        </div>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <User size={16} className="text-zinc-400" />
                Patient Name
              </label>
              <input {...register('patient.name')} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <Tag size={16} className="text-zinc-400" />
                Note Type
              </label>
              <select {...register('noteType')} className="w-full px-4 py-2 rounded-xl border border-zinc-200">
                <option value="Nursing">Nursing</option>
                <option value="Physical Therapy">Physical Therapy</option>
                <option value="Occupational Therapy">Occupational Therapy</option>
                <option value="Speech Therapy">Speech Therapy</option>
                <option value="Social Work">Social Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 items-start justify-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                <Clock size={16} className="text-zinc-400" />
                Date / Time
              </label>
              <div className="flex gap-2">
                <input type="date" {...register('date')} className="px-4 py-2 rounded-xl border border-zinc-200" />
                <input type="time" {...register('time')} className="px-4 py-2 rounded-xl border border-zinc-200" />
              </div>
            </div>
          </div>
        </div>

        {/* SOAP Note Section */}
        <section className="space-y-6">
          <h3 className="font-bold text-zinc-900 border-b pb-2 uppercase tracking-widest text-xs">SOAP Format</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Subjective <span className="text-xs text-zinc-400 font-normal">(Patient's report, symptoms)</span></label>
              <textarea {...register('soap.subjective')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Objective <span className="text-xs text-zinc-400 font-normal">(Measurable data, vitals, exam)</span></label>
              <textarea {...register('soap.objective')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Assessment <span className="text-xs text-zinc-400 font-normal">(Clinical impression, diagnosis)</span></label>
              <textarea {...register('soap.assessment')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Plan <span className="text-xs text-zinc-400 font-normal">(Next steps, interventions)</span></label>
              <textarea {...register('soap.plan')} rows={3} className="w-full px-4 py-2 rounded-xl border border-zinc-200" />
            </div>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="space-y-2">
          <h3 className="font-bold text-zinc-900 border-b pb-2 uppercase tracking-widest text-xs">Narrative Note</h3>
          <textarea {...register('narrative')} rows={6} placeholder="Enter narrative notes here if not using SOAP format..." className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue/20 outline-none transition-all" />
        </section>

        {/* Signature */}
        <section className="pt-8 border-t border-zinc-200">
          <div className="max-w-md">
            <SignaturePad 
              label="Staff Signature" 
              onSave={(sig) => setValue('signature', sig, { shouldValidate: true })} 
            />
            {errors.signature && <p className="text-xs text-red-500 mt-1">{errors.signature.message}</p>}
          </div>
        </section>
      </form>
    </div>
  );
};

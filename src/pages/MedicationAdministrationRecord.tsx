import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { Pill, Save, Send, Plus, Trash2, Calendar, Clock, User, ArrowLeft, Loader2, FileText, Download } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { exportToPDF } from '../utils/pdfExport';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Medication Administration Record (MAR)';

const marSchema = z.object({
  month: z.string().min(1, 'Required'),
  year: z.string().min(1, 'Required'),
  patient: z.object({
    name: z.string().min(1, 'Required'),
    dob: z.string().optional(),
    allergies: z.string().optional(),
  }),
  medications: z.array(z.object({
    name: z.string().min(1, 'Required'),
    dose: z.string().optional(),
    route: z.string().optional(),
    frequency: z.string().optional(),
    times: z.string().optional(),
    administrations: z.record(z.string(), z.string()), // day: initial
  })),
  staffSignatures: z.array(z.object({
    initials: z.string().optional(),
    name: z.string().optional(),
    signature: z.string().optional(),
  })),
});

type MARFormValues = z.infer<typeof marSchema>;

export const MedicationAdministrationRecord: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors, isSubmitting } } = useForm<MARFormValues>({
    resolver: zodResolver(marSchema),
    defaultValues: {
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      medications: [{ name: '', dose: '', route: '', frequency: '', times: '', administrations: {} }],
      staffSignatures: [{ initials: '', name: '', signature: '' }]
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

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control,
    name: 'medications'
  });

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handlePrint = async () => {
    if (!formRef.current) return;
    try {
      setIsGeneratingPDF(true);
      await exportToPDF(formRef.current, `MAR_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF. Please try again or use the browser print feature.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const submitForm = async (data: MARFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      alert('You must be logged in to submit forms.');
      return;
    }

    console.log(`${FORM_NAME}: Starting submission (status: ${status})...`);
    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      // 1. Get Form ID if not already fetched
      let currentFormId = formId;
      if (!currentFormId) {
        console.log(`${FORM_NAME}: Form ID missing, fetching for "${FORM_NAME}"...`);
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database. Please go to the Dashboard to run the Database Setup.`);
        }
        setFormId(currentFormId);
      }
      
      console.log(`${FORM_NAME}: Using Form ID: ${currentFormId}, Patient ID: ${patientId}`);

      // 1.5 Verify patient exists
      const { data: patientExists, error: patientCheckError } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle())) as any;
      
      if (patientCheckError) {
        console.error(`${FORM_NAME}: Patient check error:`, patientCheckError);
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
        console.error(`${FORM_NAME}: Response insertion error:`, responseError);
        throw responseError;
      }

      if (!responseData) {
        throw new Error('No data returned from form submission. This might be due to database permissions (RLS).');
      }

      console.log(`${FORM_NAME}: Response inserted successfully, ID:`, responseData.id);
      
      alert(status === 'draft' ? 'Draft saved successfully!' : 'MAR submitted successfully!');
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error(`${FORM_NAME}: Caught error during submission:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSavingDraft(false);
      console.log(`${FORM_NAME}: Submission process finished.`);
    }
  };

  const onSubmit = async (data: MARFormValues) => await submitForm(data, 'submitted');
  const onSaveDraft = async () => {
    const data = watch();
    await submitForm(data, 'draft');
  };

  const daysInMonth = 31; // Simplified for UI

  return (
    <div className="max-w-full mx-auto p-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
            <Pill className="text-partners-green" />
            Medication Administration Record (MAR)
          </h2>
          <p className="text-partners-gray">Monthly tracking of medication administration.</p>
        </div>
        <div className="flex gap-3 no-print">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            PDF
          </Button>
          <Button 
            variant="secondary" 
            type="button" 
            onClick={onSaveDraft}
            disabled={isSubmitting || isSavingDraft}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isSavingDraft}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <form ref={formRef} className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 min-w-[1000px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <User size={20} />
              <h3>Patient Info</h3>
            </div>
            <div className="space-y-2">
              <input {...register('patient.name')} placeholder="Patient Name *" className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              <input {...register('patient.allergies')} placeholder="Allergies (NKA if none)" className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-red-600 font-bold focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <Calendar size={20} />
              <h3>Period</h3>
            </div>
            <div className="flex gap-4">
              <input {...register('month')} placeholder="Month *" className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
              <input type="number" {...register('year')} placeholder="Year *" className="w-24 px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
            </div>
          </div>
        </div>

        {/* MAR Table */}
        <div className="min-w-[1200px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={20} />
              Medication Log
            </h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => appendMed({ name: '', dose: '', route: '', frequency: '', times: '', administrations: {} })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>
          
          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="p-2 border-r border-zinc-200 w-48">Medication / Dose / Route / Freq</th>
                  <th className="p-2 border-r border-zinc-200 w-16">Time</th>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <th key={i} className="p-1 border-r border-zinc-200 text-center w-8">{i + 1}</th>
                  ))}
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {medFields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-2 border-r border-zinc-200">
                      <div className="space-y-1">
                        <input {...register(`medications.${index}.name`)} placeholder="Medication" className="w-full bg-transparent font-bold outline-none" />
                        <div className="flex gap-1 text-[10px] text-zinc-500">
                          <input {...register(`medications.${index}.dose`)} placeholder="Dose" className="w-1/3 bg-transparent outline-none" />
                          <input {...register(`medications.${index}.route`)} placeholder="Route" className="w-1/3 bg-transparent outline-none" />
                          <input {...register(`medications.${index}.frequency`)} placeholder="Freq" className="w-1/3 bg-transparent outline-none" />
                        </div>
                      </div>
                    </td>
                    <td className="p-2 border-r border-zinc-200">
                      <input {...register(`medications.${index}.times`)} placeholder="08:00" className="w-full bg-transparent text-center outline-none font-medium" />
                    </td>
                    {Array.from({ length: daysInMonth }).map((_, i) => (
                      <td key={i} className="p-0 border-r border-zinc-200 h-10">
                        <input 
                          {...register(`medications.${index}.administrations.${i + 1}`)} 
                          className="w-full h-full text-center bg-transparent outline-none focus:bg-partners-blue/5 uppercase"
                          maxLength={2}
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button type="button" onClick={() => removeMed(index)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Initials */}
        <section className="pt-8 border-t border-zinc-200 min-w-[1000px]">
          <h3 className="font-bold text-zinc-900 mb-4">Staff Signatures & Initials</h3>
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
                <div className="flex gap-2">
                  <input {...register(`staffSignatures.${i}.initials`)} placeholder="Initials" className="w-16 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
                  <input {...register(`staffSignatures.${i}.name`)} placeholder="Full Name" className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
                </div>
                <div className="h-16 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-[10px] text-zinc-400 italic">
                  Signature Space
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>
    </div>
  );
};

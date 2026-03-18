import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { Notification, NotificationType } from '../components/Notification';
import { Activity, Save, Send, Plus, Trash2, Calendar, Clock, User, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase, getFormIdByName, withTimeout } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const DUMMY_PATIENT_ID = '00000000-0000-0000-0000-000000000000';
const FORM_NAME = 'Treatment Administration Record (TAR)';

const tarSchema = z.object({
  month: z.string().min(1, 'Required'),
  year: z.string().min(1, 'Required'),
  patient: z.object({
    name: z.string().min(1, 'Required'),
    dob: z.string().optional(),
  }),
  treatments: z.array(z.object({
    description: z.string().min(1, 'Required'),
    frequency: z.string().optional(),
    times: z.string().optional(),
    administrations: z.record(z.string(), z.string()), // day: initial
  })),
  staffSignatures: z.array(z.object({
    initials: z.string().optional(),
    name: z.string().optional(),
  })),
});

type TARFormValues = z.infer<typeof tarSchema>;

export const TreatmentAdministrationRecord: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || DUMMY_PATIENT_ID;
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);

  const { register, handleSubmit, setValue, watch, control, reset, getValues, formState: { errors, isSubmitting } } = useForm<TARFormValues>({
    resolver: zodResolver(tarSchema),
    defaultValues: {
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      treatments: [{ description: '', frequency: '', times: '', administrations: {} }],
      staffSignatures: [{ initials: '', name: '' }]
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

  const { fields: treatFields, append: appendTreat, remove: removeTreat } = useFieldArray({
    control,
    name: 'treatments'
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
    console.log('Treatment Administration Record: Starting PDF generation...');
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      console.log('Treatment Administration Record: Form data for PDF:', formData);
      const success = await generateFormPDF(FORM_NAME, formData);
      
      if (!success && formRef.current) {
        console.log('Treatment Administration Record: Template PDF failed or not found, falling back to exportToPDF...');
        const { exportToPDF } = await import('../utils/pdfExport');
        await exportToPDF(formRef.current, `TAR_${new Date().toISOString().split('T')[0]}.pdf`);
      }
      console.log('Treatment Administration Record: PDF generation successful.');
    } catch (error) {
      console.error('Treatment Administration Record: PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const submitForm = async (data: TARFormValues, status: 'draft' | 'submitted') => {
    if (!profile) {
      setNotification({ type: 'error', message: 'You must be logged in to submit forms.' });
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
      
      setNotification({ 
        type: 'success', 
        message: status === 'draft' ? 'Draft saved successfully!' : 'TAR submitted successfully!' 
      });
      if (status === 'submitted') reset();
    } catch (error: any) {
      console.error(`${FORM_NAME}: Caught error during submission:`, error);
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSavingDraft(false);
      console.log(`${FORM_NAME}: Submission process finished.`);
    }
  };

  const onSubmit = (data: TARFormValues) => submitForm(data, 'submitted');

  const daysInMonth = 31;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <Logo className="h-16 w-auto" />
          <div>
            <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <Activity className="text-partners-green" />
              Treatment Administration Record (TAR)
            </h2>
            <p className="text-partners-gray">Monthly tracking of non-medication treatments and vitals.</p>
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
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isSavingDraft}
            className="h-11 px-8 rounded-xl shadow-md"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <form ref={formRef} className="space-y-8 bg-white p-4 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
              <User size={20} />
              <h3>Patient Info</h3>
            </div>
            <div className="space-y-2">
              <input {...register('patient.name')} placeholder="Patient Name *" className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
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

        {/* TAR Table */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={20} />
              Treatment Log
            </h3>
            <Button type="button" variant="secondary" size="sm" onClick={() => appendTreat({ description: '', frequency: '', times: '', administrations: {} })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Treatment
            </Button>
          </div>
          
          <div className="border border-zinc-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="p-2 border-r border-zinc-200 w-64">Treatment Description / Frequency</th>
                  <th className="p-2 border-r border-zinc-200 w-16">Time</th>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <th key={i} className="p-1 border-r border-zinc-200 text-center w-8">{i + 1}</th>
                  ))}
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {treatFields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="p-2 border-r border-zinc-200">
                      <div className="space-y-1">
                        <input {...register(`treatments.${index}.description`)} placeholder="Treatment Description" className="w-full bg-transparent font-bold outline-none" />
                        <input {...register(`treatments.${index}.frequency`)} placeholder="Frequency" className="w-full bg-transparent text-[10px] text-zinc-500 outline-none" />
                      </div>
                    </td>
                    <td className="p-2 border-r border-zinc-200">
                      <input {...register(`treatments.${index}.times`)} placeholder="09:00" className="w-full bg-transparent text-center outline-none font-medium" />
                    </td>
                    {Array.from({ length: daysInMonth }).map((_, i) => (
                      <td key={i} className="p-0 border-r border-zinc-200 h-10">
                        <input 
                          {...register(`treatments.${index}.administrations.${i + 1}`)} 
                          className="w-full h-full text-center bg-transparent outline-none focus:bg-partners-blue/5 uppercase"
                          maxLength={2}
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      <button type="button" onClick={() => removeTreat(index)} className="text-red-400 hover:text-red-600">
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
        <section className="pt-8 border-t border-zinc-200">
          <h3 className="font-bold text-zinc-900 mb-4">Staff Initials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-2">
                <input {...register(`staffSignatures.${i}.initials`)} placeholder="Initials" className="w-16 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
                <input {...register(`staffSignatures.${i}.name`)} placeholder="Full Name" className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm" />
              </div>
            ))}
          </div>
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

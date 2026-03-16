import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { FilePlus, Send, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Logo } from '../components/Logo';
import { Notification, NotificationType } from '../components/Notification';
import { supabase, getFormIdByName } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const admissionSchema = z.object({
  date: z.string().min(1, 'Required'),
  patientName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
  assessment: z.string().min(1, 'Required'),
  signature: z.string().optional()
});

type AdmissionValues = z.infer<typeof admissionSchema>;

export const AdmissionAssessment: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType, message: string } | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = useForm<AdmissionValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

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

  const onSubmit = async (data: AdmissionValues) => {
    if (!profile) return;
    setIsSubmitting(true);
    try {
      const formId = await getFormIdByName('Admission Assessment');
      
      if (editId) {
        const { error } = await supabase
          .from('form_responses')
          .update({
            data: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Admission Assessment updated successfully!' });
      } else {
        const { error } = await supabase.from('form_responses').insert([{
          form_id: formId,
          patient_id: '00000000-0000-0000-0000-000000000000',
          staff_id: profile.id,
          data: data,
          status: 'submitted'
        }]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Admission Assessment submitted successfully!' });
        reset();
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      const success = await generateFormPDF('Admission Assessment', formData);
      
      if (!success && formRef.current) {
        // Fallback to old method if no template exists
        const { exportToPDF } = await import('../utils/pdfExport');
        await exportToPDF(formRef.current, `Admission_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('PDF error:', error);
      setNotification({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
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
        <div className="flex items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <FilePlus className="text-partners-green" />
              Admission Assessment
            </h2>
            <p className="text-partners-gray">Initial patient admission evaluation.</p>
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

      <form ref={formRef} className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date <span className="text-red-500">*</span></label>
            <input type="date" {...register('date')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-partners-blue-dark" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Patient Name <span className="text-red-500">*</span></label>
            <input {...register('patientName')} placeholder="Enter full name" className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-partners-blue-dark" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Assessment Details <span className="text-red-500">*</span></label>
          <textarea {...register('assessment')} rows={10} placeholder="Provide detailed admission assessment..." className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-partners-blue-dark" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-700">Signature</label>
          <SignaturePad onSave={(sig) => setValue('signature', sig)} />
        </div>
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

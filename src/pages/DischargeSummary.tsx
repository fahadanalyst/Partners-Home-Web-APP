import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { Button } from '../components/Button';
import { ClipboardCheck, Send, ArrowLeft, Loader2, Download } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { Logo } from '../components/Logo';
import { supabase, getFormIdByName } from '../services/supabase';
import { generateFormPDF } from '../services/pdfService';
import { useAuth } from '../context/AuthContext';

const dischargeSchema = z.object({
  date: z.string().min(1, 'Required'),
  patientName: z.string().min(1, 'Required'),
  dischargeReason: z.string().min(1, 'Required'),
  summary: z.string().min(1, 'Required'),
  signature: z.string().optional()
});

type DischargeValues = z.infer<typeof dischargeSchema>;

export const DischargeSummary: React.FC = () => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<DischargeValues>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: DischargeValues) => {
    if (!profile) return;
    setIsSubmitting(true);
    try {
      const formId = await getFormIdByName('Discharge Summary');
      const { error } = await supabase.from('form_responses').insert([{
        form_id: formId,
        patient_id: '00000000-0000-0000-0000-000000000000',
        submitted_by: profile.id,
        data: data,
        status: 'submitted'
      }]);
      if (error) throw error;
      alert('Discharge Summary submitted successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const formData = getValues();
      const success = await generateFormPDF('Discharge Summary', formData);
      
      if (!success && formRef.current) {
        // Fallback to old method if no template exists
        const { exportToPDF } = await import('../utils/pdfExport');
        await exportToPDF(formRef.current, `Discharge_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
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
        <div className="flex items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-2xl font-bold text-partners-blue-dark flex items-center gap-2">
              <ClipboardCheck className="text-partners-green" />
              Discharge Summary
            </h2>
            <p className="text-partners-gray">Final documentation for patient discharge.</p>
          </div>
        </div>
        <div className="flex gap-3 no-print">
          <Button variant="secondary" type="button" onClick={handlePrint} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          <Button type="button" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <form ref={formRef} className="space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Date</label>
            <input type="date" {...register('date')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Patient Name</label>
            <input {...register('patientName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Reason for Discharge</label>
          <input {...register('dischargeReason')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Summary of Care</label>
          <textarea {...register('summary')} rows={10} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-medium text-zinc-700">Signature</label>
          <SignaturePad onSave={(sig) => setValue('signature', sig)} />
        </div>
      </form>
    </div>
  );
};

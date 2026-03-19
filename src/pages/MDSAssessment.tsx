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
  // Section AA
  sectionAA: z.object({
    lastName: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    middleInitial: z.string().optional(),
    caseRecordNo: z.string().optional(),
    ssn: z.string().optional(),
    healthInsuranceNo: z.string().optional(),
  }),
  // Section BB
  sectionBB: z.object({
    gender: z.string().optional(),
    birthdate: z.string().optional(),
    race: z.array(z.string()).optional(),
    ethnicity: z.string().optional(),
    maritalStatus: z.string().optional(),
    language: z.string().optional(),
    education: z.string().optional(),
    legalGuardian: z.boolean().optional(),
    advancedDirectives: z.boolean().optional(),
  }),
  // Section CC
  sectionCC: z.object({
    dateOpened: z.string().optional(),
    reasonForReferral: z.string().optional(),
    goalsOfCare: z.array(z.string()).optional(),
    timeSinceLastHospital: z.string().optional(),
    whereLivedAtReferral: z.string().optional(),
    whoLivedWithAtReferral: z.string().optional(),
    priorNHPlacement: z.boolean().optional(),
    residentialHistory: z.boolean().optional(),
  }),
  // Section A
  sectionA: z.object({
    assessmentReferenceDate: z.string().optional(),
    reasonForAssessment: z.string().optional(),
  }),
  // Section B
  sectionB: z.object({
    memoryRecall: z.string().optional(),
    shortTermMemory: z.boolean().optional(),
    proceduralMemory: z.boolean().optional(),
    cognitiveSkills: z.string().optional(),
    decisionMakingDecline: z.boolean().optional(),
    deliriumSuddenOnset: z.boolean().optional(),
    deliriumAgitated: z.boolean().optional(),
  }),
  // Section C
  sectionC: z.object({
    hearing: z.string().optional(),
    makingSelfUnderstood: z.string().optional(),
    abilityToUnderstandOthers: z.string().optional(),
    communicationDecline: z.boolean().optional(),
  }),
  // Section D
  sectionD: z.object({
    vision: z.string().optional(),
    visualLimitations: z.boolean().optional(),
    visionDecline: z.boolean().optional(),
  }),
  // Section E
  sectionE: z.object({
    sadness: z.string().optional(),
    anger: z.string().optional(),
    unrealisticFears: z.string().optional(),
    repetitiveHealthComplaints: z.string().optional(),
    repetitiveAnxiousComplaints: z.string().optional(),
    sadPainedWorriedFacial: z.string().optional(),
    recurrentCrying: z.string().optional(),
    withdrawalFromActivities: z.string().optional(),
    reducedSocialInteraction: z.string().optional(),
    moodDecline: z.boolean().optional(),
    behavioralSymptoms: z.object({
      wandering: z.string().optional(),
      verballyAbusive: z.string().optional(),
      physicallyAbusive: z.string().optional(),
      sociallyInappropriate: z.string().optional(),
      resistsCare: z.string().optional(),
    }),
    behavioralSymptomsDecline: z.boolean().optional(),
  }),
  // Section F
  sectionF: z.object({
    atEaseWithOthers: z.string().optional(),
    expressesConflict: z.string().optional(),
    changeInSocialActivities: z.string().optional(),
    isolationLength: z.string().optional(),
    feelsLonely: z.boolean().optional(),
  }),
  // Section G
  sectionG: z.object({
    primaryHelper: z.object({
      name: z.string().optional(),
      livesWithClient: z.boolean().optional(),
      relationship: z.string().optional(),
      areasOfHelp: z.array(z.string()).optional(),
      willingnessToIncreaseHelp: z.object({
        advice: z.string().optional(),
        iadl: z.string().optional(),
        adl: z.string().optional(),
      }),
    }),
    caregiverStatus: z.array(z.string()).optional(),
    extentOfInformalHelp: z.object({
      weekdays: z.string().optional(),
      weekends: z.string().optional(),
    }),
  }),
  // Section H
  sectionH: z.object({
    iadl: z.object({
      mealPreparation: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      ordinaryHousework: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      managingFinance: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      managingMedications: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      phoneUse: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      shopping: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
      transportation: z.object({ perf: z.string().optional(), diff: z.string().optional() }),
    }),
    adl: z.object({
      mobilityInBed: z.string().optional(),
      transfer: z.string().optional(),
      locomotionInHome: z.string().optional(),
      locomotionOutside: z.string().optional(),
      dressingUpperBody: z.string().optional(),
      dressingLowerBody: z.string().optional(),
      eating: z.string().optional(),
      toiletUse: z.string().optional(),
      personalHygiene: z.string().optional(),
      bathing: z.string().optional(),
    }),
    adlDecline: z.boolean().optional(),
    primaryModesOfLocomotion: z.object({
      indoors: z.string().optional(),
      outdoors: z.string().optional(),
    }),
    stairClimbing: z.string().optional(),
    stamina: z.object({
      daysWentOut: z.string().optional(),
      hoursOfPhysicalActivity: z.string().optional(),
    }),
    functionalPotential: z.array(z.string()).optional(),
  }),
  // Section I
  sectionI: z.object({
    bladderContinence: z.string().optional(),
    bladderDecline: z.boolean().optional(),
    bladderDevices: z.array(z.string()).optional(),
    bowelContinence: z.string().optional(),
  }),
  // Section J
  sectionJ: z.object({
    diseases: z.array(z.string()).optional(),
    otherDiagnoses: z.string().optional(),
  }),
  // Section K
  sectionK: z.object({
    preventiveHealth: z.array(z.string()).optional(),
    problemConditions: z.array(z.string()).optional(),
    physicalConditions: z.array(z.string()).optional(),
    mentalHealthConditions: z.array(z.string()).optional(),
  }),
  // Section L
  sectionL: z.object({
    weight: z.array(z.string()).optional(),
    consumption: z.array(z.string()).optional(),
    swallowing: z.string().optional(),
  }),
  // Section M
  sectionM: z.object({
    oralStatus: z.array(z.string()).optional(),
  }),
  // Section N
  sectionN: z.object({
    skinProblems: z.boolean().optional(),
    ulcers: z.object({
      highestStage: z.string().optional(),
      pressureUlcer: z.boolean().optional(),
      stasisUlcer: z.boolean().optional(),
    }),
    otherSkinProblems: z.array(z.string()).optional(),
    historyOfResolvedUlcers: z.boolean().optional(),
    woundCare: z.array(z.string()).optional(),
  }),
  // Section O
  sectionO: z.object({
    homeEnvironment: z.array(z.string()).optional(),
    livingArrangement: z.object({
      livesWithOthers: z.boolean().optional(),
      betterOffElsewhere: z.string().optional(),
    }),
  }),
  // Section P
  sectionP: z.object({
    formalCare: z.object({
      homeHealthAides: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      visitingNurses: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      homemakingServices: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      meals: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      volunteerServices: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      physicalTherapy: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      occupationalTherapy: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      speechTherapy: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      dayCare: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
      socialWorker: z.object({ days: z.string().optional(), hours: z.string().optional(), mins: z.string().optional() }),
    }),
  }),
  // Section Q
  sectionQ: z.object({
    numberOfMedications: z.string().optional(),
    psychotropicMedication: z.array(z.string()).optional(),
    medicalOversight: z.string().optional(),
    medicationAdherence: z.string().optional(),
  }),
  // Section R
  sectionR: z.object({
    coordinatorSignature: z.string().optional(),
    coordinatorTitle: z.string().optional(),
    completionDate: z.string().optional(),
  }),
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
      sectionBB: { race: [] },
      sectionCC: { goalsOfCare: [] },
      sectionG: { primaryHelper: { areasOfHelp: [] }, caregiverStatus: [] },
      sectionH: { functionalPotential: [] },
      sectionI: { bladderDevices: [] },
      sectionJ: { diseases: [] },
      sectionK: { preventiveHealth: [], problemConditions: [], physicalConditions: [], mentalHealthConditions: [] },
      sectionL: { weight: [], consumption: [] },
      sectionM: { oralStatus: [] },
      sectionN: { otherSkinProblems: [], woundCare: [] },
      sectionO: { homeEnvironment: [] },
      sectionQ: { psychotropicMedication: [] },
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
          setValue('sectionAA.firstName', data.first_name);
          setValue('sectionAA.lastName', data.last_name);
          setValue('sectionBB.birthdate', data.dob);
          setValue('sectionBB.gender', data.gender === 'female' ? '2' : '1');
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

    try {
      if (status === 'draft') setIsSavingDraft(true);
      
      let currentFormId = formId;
      if (!currentFormId) {
        currentFormId = (await withTimeout(getFormIdByName(FORM_NAME))) as any;
        if (!currentFormId) {
          throw new Error(`The "${FORM_NAME}" form is missing from the database.`);
        }
        setFormId(currentFormId);
      }
      
      const { data: patientExists } = (await withTimeout(supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle(), 60000)) as any;
      
      if (!patientExists) {
        throw new Error(`The patient (ID: ${patientId}) does not exist.`);
      }

      const { error: responseError } = await supabase
        .from('form_responses')
        .insert([{
          form_id: currentFormId,
          patient_id: patientId,
          staff_id: profile.id,
          data: data,
          status: status
        }]);
      
      if (responseError) throw responseError;
      
      setNotification({ 
        type: 'success', 
        message: status === 'draft' ? 'Draft saved successfully!' : 'MDS Assessment submitted successfully!' 
      });
      if (status === 'submitted') reset();
    } catch (error: any) {
      setNotification({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setIsSavingDraft(false);
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
        const { exportToPDF } = await import('../utils/pdfExport');
        await exportToPDF(formRef.current, `MDS_Assessment_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to generate PDF.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const [activeSection, setActiveSection] = useState('AA');

  const sections = [
    { id: 'AA', title: 'AA. Name & ID' },
    { id: 'BB', title: 'BB. Personal Items' },
    { id: 'CC', title: 'CC. Referral Items' },
    { id: 'A', title: 'A. Assessment Info' },
    { id: 'B', title: 'B. Cognitive Patterns' },
    { id: 'C', title: 'C. Communication' },
    { id: 'D', title: 'D. Vision Patterns' },
    { id: 'E', title: 'E. Mood & Behavior' },
    { id: 'F', title: 'F. Social Functioning' },
    { id: 'G', title: 'G. Informal Support' },
    { id: 'H', title: 'H. Physical Functioning' },
    { id: 'I', title: 'I. Continence' },
    { id: 'J', title: 'J. Disease Diagnoses' },
    { id: 'K', title: 'K. Health Conditions' },
    { id: 'L', title: 'L. Nutrition/Hydration' },
    { id: 'M', title: 'M. Dental Status' },
    { id: 'N', title: 'N. Skin Condition' },
    { id: 'O', title: 'O. Environmental' },
    { id: 'P', title: 'P. Service Utilization' },
    { id: 'Q', title: 'Q. Medications' },
    { id: 'R', title: 'R. Signatures' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <Link to="/clinical-forms" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors mb-6 group no-print">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Forms</span>
      </Link>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Logo showText size={48} />
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-partners-blue-dark flex items-center gap-2 whitespace-nowrap">
              <ClipboardCheck className="text-partners-green shrink-0" />
              Minimum Data Set - Home Care (MDS-HC)
            </h2>
            <p className="text-sm md:text-base text-partners-gray">Comprehensive assessment for home care services.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 no-print w-full md:w-auto md:justify-end">
          <Button 
            variant="secondary" 
            type="button" 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="h-11 px-4 md:px-6 rounded-xl shadow-sm flex-1 md:flex-none"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-11 px-6 md:px-8 rounded-xl shadow-md flex-1 md:flex-none"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0 no-print">
          <nav className="sticky top-8 space-y-1 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-2">Form Sections</p>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === section.id 
                    ? 'bg-partners-blue-dark text-white shadow-md' 
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-8 bg-white p-4 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden"
        >
          {Object.keys(errors).length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <p className="font-bold mb-1">Please correct the following errors before submitting:</p>
              <ul className="list-disc list-inside">
                {Object.entries(errors).map(([key, error]: [string, any]) => (
                  <li key={key}>{error.message || `Error in ${key}`}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section AA */}
          {activeSection === 'AA' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <User size={20} />
                <h3>SECTION AA. NAME AND IDENTIFICATION NUMBERS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Last Name</label>
                  <input {...register('sectionAA.lastName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
                  <input {...register('sectionAA.firstName')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Middle Initial</label>
                  <input {...register('sectionAA.middleInitial')} maxLength={1} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Case Record No.</label>
                  <input {...register('sectionAA.caseRecordNo')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Social Security Number</label>
                  <input {...register('sectionAA.ssn')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Health Insurance No.</label>
                  <input {...register('sectionAA.healthInsuranceNo')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
              </div>
            </section>
          )}

          {/* Section BB */}
          {activeSection === 'BB' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <User size={20} />
                <h3>SECTION BB. PERSONAL ITEMS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Gender</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="1" {...register('sectionBB.gender')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">1. Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="2" {...register('sectionBB.gender')} className="w-4 h-4 text-partners-blue-dark" />
                      <span className="text-sm">2. Female</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Birthdate</label>
                  <input type="date" {...register('sectionBB.birthdate')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">3. Race/Ethnicity (Check all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['American Indian/Alaskan Native', 'Asian', 'Black or African American', 'Native Hawaiian or other Pacific Islander', 'White'].map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={r} {...register('sectionBB.race')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Marital Status</label>
                  <select {...register('sectionBB.maritalStatus')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="">Select...</option>
                    <option value="1">1. Never married</option>
                    <option value="2">2. Married</option>
                    <option value="3">3. Widowed</option>
                    <option value="4">4. Separated</option>
                    <option value="5">5. Divorced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Education</label>
                  <select {...register('sectionBB.education')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="">Select...</option>
                    <option value="1">1. No schooling</option>
                    <option value="4">4. High school</option>
                    <option value="7">7. Bachelor's degree</option>
                    <option value="8">8. Graduate degree</option>
                  </select>
                </div>
                <div className="space-y-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionBB.legalGuardian')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-xs">Legal Guardian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionBB.advancedDirectives')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-xs">Advanced Directives</span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Section CC - Referral Items */}
          {activeSection === 'CC' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <FileText size={20} />
                <h3>SECTION CC. REFERRAL ITEMS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Date Case Opened</label>
                  <input type="date" {...register('sectionCC.dateOpened')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Reason for Referral</label>
                  <select {...register('sectionCC.reasonForReferral')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="">Select...</option>
                    <option value="1">1. Post-hospitalization</option>
                    <option value="2">2. Chronic condition management</option>
                    <option value="3">3. Functional decline</option>
                    <option value="4">4. Caregiver stress</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">3. Goals of Care (Check all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Rehabilitation/Restoration',
                    'Maintenance of current status',
                    'Palliative care',
                    'Support for caregiver',
                    'Transition to other setting'
                  ].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={g} {...register('sectionCC.goalsOfCare')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section A - Assessment Information */}
          {activeSection === 'A' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <ClipboardCheck size={20} />
                <h3>SECTION A. ASSESSMENT INFORMATION</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Assessment Reference Date</label>
                  <input type="date" {...register('sectionA.assessmentReferenceDate')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Reason for Assessment</label>
                  <select {...register('sectionA.reasonForAssessment')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="">Select...</option>
                    <option value="1">1. Initial Assessment</option>
                    <option value="2">2. Routine Reassessment</option>
                    <option value="3">3. Significant Change in Status</option>
                    <option value="4">4. Discharge Assessment</option>
                  </select>
                </div>
              </div>
            </section>
          )}
          {activeSection === 'B' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Brain size={20} />
                <h3>SECTION B. COGNITIVE PATTERNS</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Memory Recall Ability</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="0" {...register('sectionB.memoryRecall')} className="w-4 h-4" />
                      <span className="text-sm">0. Memory OK</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="1" {...register('sectionB.memoryRecall')} className="w-4 h-4" />
                      <span className="text-sm">1. Memory problem</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionB.shortTermMemory')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">a. Short-term memory OK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionB.proceduralMemory')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">b. Procedural memory OK</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Cognitive Skills for Daily Decision Making</label>
                  <select {...register('sectionB.cognitiveSkills')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. INDEPENDENT</option>
                    <option value="1">1. MODIFIED INDEPENDENCE</option>
                    <option value="2">2. MINIMALLY IMPAIRED</option>
                    <option value="3">3. MODERATELY IMPAIRED</option>
                    <option value="4">4. SEVERELY IMPAIRED</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Section C - Communication Patterns */}
          {activeSection === 'C' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Brain size={20} />
                <h3>SECTION C. COMMUNICATION PATTERNS</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Hearing</label>
                  <select {...register('sectionC.hearing')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. HEARS ADEQUATELY</option>
                    <option value="1">1. MINIMAL DIFFICULTY</option>
                    <option value="2">2. MODERATE DIFFICULTY</option>
                    <option value="3">3. SEVERE DIFFICULTY</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Making Self Understood</label>
                  <select {...register('sectionC.makingSelfUnderstood')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. UNDERSTOOD</option>
                    <option value="1">1. USUALLY UNDERSTOOD</option>
                    <option value="2">2. OFTEN UNDERSTOOD</option>
                    <option value="3">3. SOMETIMES UNDERSTOOD</option>
                    <option value="4">4. RARELY/NEVER UNDERSTOOD</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" {...register('sectionC.communicationDecline')} className="w-4 h-4 rounded border-zinc-300" />
                  <label className="text-sm font-medium text-zinc-700">Decline in communication compared to 90 days ago</label>
                </div>
              </div>
            </section>
          )}

          {/* Section D - Vision Patterns */}
          {activeSection === 'D' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION D. VISION PATTERNS</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Vision</label>
                  <select {...register('sectionD.vision')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. ADEQUATE</option>
                    <option value="1">1. IMPAIRED</option>
                    <option value="2">2. MODERATELY IMPAIRED</option>
                    <option value="3">3. SEVERELY IMPAIRED</option>
                    <option value="4">4. BLIND</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionD.visualLimitations')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">Visual limitations/difficulties (e.g., halos, blurred vision)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('sectionD.visionDecline')} className="w-4 h-4 rounded border-zinc-300" />
                    <span className="text-sm">Decline in vision compared to 90 days ago</span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Section E - Mood & Behavior */}
          {activeSection === 'E' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Brain size={20} />
                <h3>SECTION E. MOOD AND BEHAVIOR PATTERNS</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Indicators of Depression, Anxiety, Sad Mood</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'sadness', label: 'a. Expressions of distress' },
                      { id: 'anger', label: 'b. Unrestrained explosive anger' },
                      { id: 'unrealisticFears', label: 'c. Unrealistic fears' },
                      { id: 'recurrentCrying', label: 'g. Recurrent crying, tearfulness' },
                    ].map(item => (
                      <div key={item.id} className="space-y-1">
                        <label className="text-xs text-zinc-500">{item.label}</label>
                        <select {...register(`sectionE.${item.id}` as any)} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                          <option value="0">0. Not present</option>
                          <option value="1">1. Present, not daily</option>
                          <option value="2">2. Present daily</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section F - Social Functioning */}
          {activeSection === 'F' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <User size={20} />
                <h3>SECTION F. SOCIAL FUNCTIONING</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Social Involvement</label>
                  <select {...register('sectionF.atEaseWithOthers')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. AT EASE WITH OTHERS</option>
                    <option value="1">1. SOMETIMES UNCOMFORTABLE</option>
                    <option value="2">2. RARELY/NEVER AT EASE</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" {...register('sectionF.feelsLonely')} className="w-4 h-4 rounded border-zinc-300" />
                  <label className="text-sm font-medium text-zinc-700">Says he/she feels lonely</label>
                </div>
              </div>
            </section>
          )}
          {/* Section G - Informal Support */}
          {activeSection === 'G' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <User size={20} />
                <h3>SECTION G. INFORMAL SUPPORT SERVICES</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">1. Primary Helper Name</label>
                    <input {...register('sectionG.primaryHelper.name')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Relationship</label>
                    <select {...register('sectionG.primaryHelper.relationship')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                      <option value="">Select...</option>
                      <option value="1">1. Child</option>
                      <option value="2">2. Spouse</option>
                      <option value="3">3. Other relative</option>
                      <option value="4">4. Friend/Neighbor</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('sectionG.primaryHelper.livesWithClient')} className="w-4 h-4 rounded border-zinc-300" />
                  <label className="text-sm font-medium text-zinc-700">Lives with client</label>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'H' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION H. PHYSICAL FUNCTIONING</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="p-2 text-left">1. IADL SELF-PERFORMANCE</th>
                      <th className="p-2 w-24 text-center">Performance</th>
                      <th className="p-2 w-24 text-center">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {[
                      { id: 'mealPreparation', label: 'a. Meal Preparation' },
                      { id: 'ordinaryHousework', label: 'b. Ordinary Housework' },
                      { id: 'managingFinance', label: 'c. Managing Finance' },
                      { id: 'managingMedications', label: 'd. Managing Medications' },
                      { id: 'phoneUse', label: 'e. Phone Use' },
                      { id: 'shopping', label: 'f. Shopping' },
                      { id: 'transportation', label: 'g. Transportation' },
                    ].map(item => (
                      <tr key={item.id}>
                        <td className="p-2">{item.label}</td>
                        <td className="p-1">
                          <input {...register(`sectionH.iadl.${item.id}.perf` as any)} className="w-full text-center border rounded p-1" />
                        </td>
                        <td className="p-1">
                          <input {...register(`sectionH.iadl.${item.id}.diff` as any)} className="w-full text-center border rounded p-1" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-zinc-700">2. ADL SELF-PERFORMANCE</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'mobilityInBed', label: 'a. Mobility in Bed' },
                    { id: 'transfer', label: 'b. Transfer' },
                    { id: 'locomotionInHome', label: 'c. Locomotion in Home' },
                    { id: 'eating', label: 'g. Eating' },
                    { id: 'toiletUse', label: 'h. Toilet Use' },
                    { id: 'bathing', label: 'j. Bathing' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-2 bg-zinc-50 rounded-xl">
                      <span className="text-xs font-medium">{item.label}</span>
                      <input {...register(`sectionH.adl.${item.id}` as any)} className="w-12 text-center border rounded p-1" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section I - Continence */}
          {activeSection === 'I' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION I. CONTINENCE</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Bladder Continence</label>
                  <select {...register('sectionI.bladderContinence')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. CONTINENT</option>
                    <option value="1">1. USUALLY CONTINENT</option>
                    <option value="2">2. OCCASIONALLY INCONTINENT</option>
                    <option value="3">3. FREQUENTLY INCONTINENT</option>
                    <option value="4">4. INCONTINENT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Bowel Continence</label>
                  <select {...register('sectionI.bowelContinence')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. CONTINENT</option>
                    <option value="1">1. USUALLY CONTINENT</option>
                    <option value="2">2. OCCASIONALLY INCONTINENT</option>
                    <option value="3">3. FREQUENTLY INCONTINENT</option>
                    <option value="4">4. INCONTINENT</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Section J - Disease Diagnoses */}
          {activeSection === 'J' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <HeartPulse size={20} />
                <h3>SECTION J. DISEASE DIAGNOSES</h3>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase">1. Check all that apply</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    'Diabetes Mellitus', 'Hypertension', 'Congestive Heart Failure',
                    'COPD', 'Dementia', 'Alzheimer\'s Disease', 'Parkinson\'s Disease',
                    'Stroke/CVA', 'Arthritis', 'Cancer', 'Osteoporosis'
                  ].map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={d} {...register('sectionJ.diseases')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{d}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Other Diagnoses</label>
                  <textarea {...register('sectionJ.otherDiagnoses')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none h-24" />
                </div>
              </div>
            </section>
          )}

          {/* Section K - Health Conditions */}
          {activeSection === 'K' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION K. HEALTH CONDITIONS</h3>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase">1. Problem Conditions (Check all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Dizziness', 'Edema', 'Fever', 'Hallucinations', 'Pain', 'Shortness of Breath', 'Syncope'].map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={c} {...register('sectionK.problemConditions')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section L - Nutrition/Hydration */}
          {activeSection === 'L' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION L. NUTRITION/HYDRATION STATUS</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Swallowing</label>
                  <select {...register('sectionL.swallowing')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. NO PROBLEM</option>
                    <option value="1">1. COMPLAINS OF DIFFICULTY</option>
                    <option value="2">2. VISIBLE DIFFICULTY</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Section M - Dental Status */}
          {activeSection === 'M' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION M. DENTAL STATUS</h3>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase">1. Oral Status (Check all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Debris in mouth', 'Loose teeth', 'Broken teeth', 'Inflamed gums', 'Daily pain', 'No natural teeth'].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={s} {...register('sectionM.oralStatus')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section N - Skin Condition */}
          {activeSection === 'N' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION N. SKIN CONDITION</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...register('sectionN.skinProblems')} className="w-4 h-4 rounded border-zinc-300" />
                  <label className="text-sm font-medium text-zinc-700">Any skin problems</label>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Ulcers (Highest Stage)</label>
                  <select {...register('sectionN.ulcers.highestStage')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none">
                    <option value="0">0. None</option>
                    <option value="1">1. Stage 1</option>
                    <option value="2">2. Stage 2</option>
                    <option value="3">3. Stage 3</option>
                    <option value="4">4. Stage 4</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Section O - Environmental Assessment */}
          {activeSection === 'O' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION O. ENVIRONMENTAL ASSESSMENT</h3>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase">1. Home Environment (Check all that apply)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Inadequate heating/cooling', 'No phone', 'No running water', 'Structural problems', 'Inadequate lighting', 'Cluttered'].map(e => (
                    <label key={e} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" value={e} {...register('sectionO.homeEnvironment')} className="w-4 h-4 rounded border-zinc-300" />
                      <span className="text-xs">{e}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section P - Service Utilization */}
          {activeSection === 'P' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <Activity size={20} />
                <h3>SECTION P. SERVICE UTILIZATION</h3>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 italic">Enter number of days/hours/minutes of service in last 7 days.</p>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'homeHealthAides', label: 'a. Home Health Aides' },
                    { id: 'visitingNurses', label: 'b. Visiting Nurses' },
                    { id: 'physicalTherapy', label: 'f. Physical Therapy' },
                  ].map(service => (
                    <div key={service.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-zinc-50 rounded-xl">
                      <span className="text-sm font-medium flex-1">{service.label}</span>
                      <div className="flex gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-zinc-400">Days</label>
                          <input {...register(`sectionP.formalCare.${service.id}.days` as any)} className="w-12 text-center border rounded p-1" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-zinc-400">Hours</label>
                          <input {...register(`sectionP.formalCare.${service.id}.hours` as any)} className="w-12 text-center border rounded p-1" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-zinc-400">Mins</label>
                          <input {...register(`sectionP.formalCare.${service.id}.mins` as any)} className="w-12 text-center border rounded p-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Section Q - Medications */}
          {activeSection === 'Q' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <HeartPulse size={20} />
                <h3>SECTION Q. MEDICATIONS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Number of Medications</label>
                  <input {...register('sectionQ.numberOfMedications')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" placeholder="0-9" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Receipt of Psychotropic Medication</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Antipsychotic', 'Anxiolytic', 'Antidepressant', 'Hypnotic'].map(m => (
                      <label key={m} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value={m} {...register('sectionQ.psychotropicMedication')} className="w-4 h-4 rounded border-zinc-300" />
                        <span className="text-xs">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section R - Signatures */}
          {activeSection === 'R' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 text-partners-blue-dark font-bold border-b pb-2">
                <FileText size={20} />
                <h3>SECTION R. SIGNATURES</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1. Assessment Coordinator Signature</label>
                  <input {...register('sectionR.coordinatorSignature')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">2. Title</label>
                  <input {...register('sectionR.coordinatorTitle')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">3. Date Signed</label>
                  <input type="date" {...register('sectionR.completionDate')} className="w-full px-4 py-2 rounded-xl border border-zinc-200 outline-none" />
                </div>
              </div>
            </section>
          )}

          {/* Fallback for other sections - simple message or basic fields */}
          {!['AA', 'BB', 'CC', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].includes(activeSection) && (
            <div className="py-20 text-center space-y-4 animate-in fade-in duration-300">
              <div className="bg-zinc-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FileText className="text-zinc-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Section {activeSection}</h3>
                <p className="text-sm text-zinc-500">This section is being implemented with full fields from the PDF.</p>
              </div>
              <p className="text-xs text-zinc-400 italic">Please select another section from the sidebar to continue assessment.</p>
            </div>
          )}

          <div className="pt-8 border-t flex justify-between items-center no-print">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                if (currentIndex > 0) setActiveSection(sections[currentIndex - 1].id);
              }}
              disabled={activeSection === 'AA'}
            >
              Previous Section
            </Button>
            <Button
              type="button"
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                if (currentIndex < sections.length - 1) setActiveSection(sections[currentIndex + 1].id);
              }}
              disabled={activeSection === 'R'}
            >
              Next Section
            </Button>
          </div>
        </form>
      </div>

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

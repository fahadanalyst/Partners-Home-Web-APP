import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  ArrowLeft,
  FileText,
  Activity,
  ClipboardList,
  Clock,
  ChevronRight,
  Edit2,
  Printer
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { format } from 'date-fns';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  insurance_id: string | null;
  ssn_encrypted: string | null;
  status: string;
  created_at: string;
}

interface Visit {
  id: string;
  scheduled_at: string;
  status: string;
  type: string;
}

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', id)
        .order('scheduled_at', { ascending: false });

      if (visitsError) throw visitsError;
      setVisits(visitsData || []);

    } catch (error) {
      console.error('Error fetching patient data:', error);
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-partners-blue-dark"></div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/patients" className="flex items-center gap-2 text-zinc-500 hover:text-partners-blue-dark transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Patients</span>
        </Link>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/patients?edit=${patient.id}`)}>
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </Button>
          <Button size="sm">
            <Printer size={16} className="mr-2" />
            Print Summary
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="bg-partners-blue-dark/5 p-8 border-b border-zinc-100">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 rounded-3xl bg-partners-blue-dark text-white flex items-center justify-center text-4xl font-bold shadow-lg">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {patient.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-6 text-zinc-500">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-zinc-400" />
                  <span>DOB: {format(new Date(patient.dob), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={18} className="text-zinc-400" />
                  <span className="capitalize">{patient.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-zinc-400" />
                  <span>ID: {patient.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Phone size={18} className="text-partners-blue-dark" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                <p className="text-zinc-700">{patient.phone || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</p>
                <p className="text-zinc-700">{patient.email || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                <p className="text-zinc-700 leading-relaxed">{patient.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Activity size={18} className="text-partners-green" />
              Insurance & Billing
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Insurance ID</p>
                <p className="text-zinc-700">{patient.insurance_id || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SSN (Last 4)</p>
                <p className="text-zinc-700">***-**-{patient.ssn_encrypted || '****'}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <Clock size={18} className="text-partners-blue-dark" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {visits.length > 0 ? (
                <div className="space-y-3">
                  {visits.slice(0, 3).map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{visit.type}</p>
                        <p className="text-xs text-zinc-500">{format(new Date(visit.scheduled_at), 'MMM d, yyyy')}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No recent visits recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to={`/progress-note?patientId=${patient.id}`} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-green/10 text-partners-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Progress Note</h4>
          <p className="text-xs text-zinc-500">Complete monthly clinical note</p>
        </Link>
        <Link to={`/care-plan?patientId=${patient.id}`} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Care Plan</h4>
          <p className="text-xs text-zinc-500">Update patient care plan</p>
        </Link>
        <Link to={`/physician-summary?patientId=${patient.id}`} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-green/10 text-partners-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Physician Summary</h4>
          <p className="text-xs text-zinc-500">Generate PSF-1 form</p>
        </Link>
        <Link to={`/patient-resource-data?patientId=${patient.id}`} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <h4 className="font-bold text-zinc-900 mb-1">Resource Data</h4>
          <p className="text-xs text-zinc-500">Patient demographic details</p>
        </Link>
      </div>

      {/* Visit History */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900">Visit History</h3>
          <Button variant="secondary" size="sm">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-700">
                      {format(new Date(visit.scheduled_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                      {visit.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="text-partners-blue-dark">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
                    No visits recorded for this patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

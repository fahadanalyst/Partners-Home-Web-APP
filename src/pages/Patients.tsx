import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  UserPlus,
  Filter,
  ArrowRight,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  MapPin,
  Shield
} from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  dob: z.string().min(1, 'Required'),
  gender: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  insurance_id: z.string().optional(),
  ssn_encrypted: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  ssn_encrypted: string | null;
  status: string;
  created_at: string;
}

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema)
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PatientFormValues) => {
    try {
      // We use a safe insert that doesn't depend on columns that might be missing
      const insertData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        insurance_id: data.insurance_id,
        ssn_encrypted: data.ssn_encrypted
      };

      console.log('Patients: Attempting to insert patient data:', insertData);
      const { data: response, error } = await supabase
        .from('patients')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Patients: Supabase insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Patients: Successfully added patient:', response);
      setIsModalOpen(false);
      reset();
      fetchPatients();
      alert('Patient added successfully!');
    } catch (error: any) {
      console.error('Error adding patient:', error);
      alert('Error adding patient: ' + (error.message || 'Check console for details'));
    }
  };

  const filteredPatients = patients.filter(p => 
    (filterStatus === 'All' || p.status === filterStatus.toLowerCase()) &&
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 italic">Patients</h1>
          <p className="text-sm md:text-base text-zinc-500">Manage participant records and clinical history</p>
        </div>
        <Button className="rounded-full px-6 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative w-full md:w-auto">
          <Button 
            variant="secondary" 
            className="rounded-2xl h-[50px] w-full md:w-auto"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {filterStatus === 'All' ? 'Filter' : filterStatus}
          </Button>
          
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 overflow-hidden">
              {['All', 'Active', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors ${filterStatus === status ? 'text-partners-blue-dark font-bold bg-partners-blue-dark/5' : 'text-zinc-600'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-bottom border-zinc-200">
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">DOB</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-24"></div></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No patients found matching your search.
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                        <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-mono text-sm">
                    {new Date(patient.dob).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-sm">
                    --
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/progress-note?patientId=${patient.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full text-xs">
                          Progress Note
                        </Button>
                      </Link>
                      <Link to={`/care-plan?patientId=${patient.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full text-xs">
                          Care Plan
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-zinc-200 animate-pulse"></div>
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center text-zinc-500">
            No patients found.
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-partners-blue-dark/10 text-partners-blue-dark flex items-center justify-center font-bold">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{patient.last_name}, {patient.first_name}</p>
                    <p className="text-xs text-zinc-500">ID: {patient.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {patient.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">DOB</p>
                  <p className="text-zinc-600">{new Date(patient.dob).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">Last Visit</p>
                  <p className="text-zinc-600">--</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Link to={`/progress-note?patientId=${patient.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    Progress Note
                  </Button>
                </Link>
                <Link to={`/care-plan?patientId=${patient.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    Care Plan
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Patient"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">First Name</label>
              <input
                {...register('first_name')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="John"
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Last Name</label>
              <input
                {...register('last_name')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="Doe"
              />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Date of Birth</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="date"
                  {...register('dob')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                />
              </div>
              {errors.dob && <p className="text-xs text-red-500">{errors.dob.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Gender</label>
              <select
                {...register('gender')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  {...register('phone')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-zinc-400" size={18} />
              <textarea
                {...register('address')}
                rows={2}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="123 Main St, City, State, Zip"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Insurance ID</label>
              <input
                {...register('insurance_id')}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                placeholder="ABC123456789"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">SSN (Last 4)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  {...register('ssn_encrypted')}
                  maxLength={4}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-partners-blue-dark outline-none transition-all"
                  placeholder="0000"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

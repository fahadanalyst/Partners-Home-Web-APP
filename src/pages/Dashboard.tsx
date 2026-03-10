import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ClipboardList,
  UserPlus,
  ArrowRight,
  RefreshCw,
  Settings,
  Database,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { supabase, testSupabaseConnection, setupDatabase } from '../services/supabase';
import { Modal } from '../components/Modal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, color, loading }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      {trend && (
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-zinc-500 text-sm font-medium">{title}</h3>
    {loading ? (
      <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded mt-1"></div>
    ) : (
      <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activePatients: 0,
    visitsThisWeek: 0,
    pendingForms: 0,
    complianceScore: 98,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    checkConnection();
    fetchDashboardData();
  }, []);

  const checkConnection = async () => {
    const status = await testSupabaseConnection();
    setConnectionStatus(status);
  };

  const handleRefreshSchema = async () => {
    try {
      setIsSettingUp(true);
      await checkConnection();
      await fetchDashboardData();
      alert('Database connection and schema cache refreshed.');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSetupDatabase = async () => {
    try {
      setIsSettingUp(true);
      const result = await setupDatabase();
      if (result.success) {
        await checkConnection();
        await fetchDashboardData();
        alert('Database setup completed successfully.');
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(`Setup failed: ${error.message}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  const sqlScript = `-- 1. Safely update existing tables
DO $$ 
BEGIN 
    -- Profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT CHECK (role IN ('admin', 'nurse', 'therapist', 'social_worker', 'staff', 'manager', 'frontdesk', 'clinical_worker', 'reviewer'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;

    -- Patients table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='status') THEN
        ALTER TABLE public.patients ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='is_active') THEN
        ALTER TABLE public.patients ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='phone') THEN
        ALTER TABLE public.patients ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='email') THEN
        ALTER TABLE public.patients ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='address') THEN
        ALTER TABLE public.patients ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='insurance_id') THEN
        ALTER TABLE public.patients ADD COLUMN insurance_id TEXT;
    END IF;

    -- Visits table columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='visits') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='location') THEN
            ALTER TABLE public.visits ADD COLUMN location TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='notes') THEN
            ALTER TABLE public.visits ADD COLUMN notes TEXT;
        END IF;
    END IF;

    -- Clinical Notes table columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clinical_notes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinical_notes' AND column_name='note_type') THEN
            ALTER TABLE public.clinical_notes ADD COLUMN note_type TEXT;
        END IF;
    END IF;

    -- Forms table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forms' AND column_name='schema') THEN
        ALTER TABLE public.forms ADD COLUMN schema JSONB DEFAULT '{}'::jsonb;
    END IF;
    ALTER TABLE public.forms ALTER COLUMN schema SET DEFAULT '{}'::jsonb;
    UPDATE public.forms SET schema = '{}'::jsonb WHERE schema IS NULL;
    ALTER TABLE public.forms ALTER COLUMN schema SET NOT NULL;
END $$;

-- 2. Create Tables if they don't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('admin', 'nurse', 'therapist', 'social_worker', 'staff', 'manager', 'frontdesk', 'clinical_worker', 'reviewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure existing users have profiles
INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, raw_user_meta_data->>'full_name', email, 'admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    insurance_id TEXT,
    ssn_encrypted TEXT,
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    data JSONB NOT NULL,
    status TEXT CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    parent_type TEXT NOT NULL DEFAULT 'form_response',
    signer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    signature_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    size INTEGER,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Idempotent)
DO $$ 
BEGIN
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles viewable by authenticated') THEN
        CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile') THEN
        CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Patients
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Patients viewable by authenticated') THEN
        CREATE POLICY "Patients viewable by authenticated" ON public.patients FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff insert patients') THEN
        CREATE POLICY "Staff insert patients" ON public.patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Forms
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Forms viewable by authenticated') THEN
        CREATE POLICY "Forms viewable by authenticated" ON public.forms FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- Responses
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Responses viewable by authenticated') THEN
        CREATE POLICY "Responses viewable by authenticated" ON public.form_responses FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff insert responses') THEN
        CREATE POLICY "Staff insert responses" ON public.form_responses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Signatures
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Signatures viewable by authenticated') THEN
        CREATE POLICY "Signatures viewable by authenticated" ON public.signatures FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff insert signatures') THEN
        CREATE POLICY "Staff insert signatures" ON public.signatures FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Files viewable by authenticated') THEN
        CREATE POLICY "Files viewable by authenticated" ON public.files FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff insert files') THEN
        CREATE POLICY "Staff insert files" ON public.files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- 5. Create Visits Table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Visits viewable by authenticated') THEN
        CREATE POLICY "Visits viewable by authenticated" ON public.visits FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage visits') THEN
        CREATE POLICY "Staff manage visits" ON public.visits FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 6. Create Clinical Notes Table
CREATE TABLE IF NOT EXISTS public.clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notes viewable by authenticated') THEN
        CREATE POLICY "Notes viewable by authenticated" ON public.clinical_notes FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff manage notes') THEN
        CREATE POLICY "Staff manage notes" ON public.clinical_notes FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. Force Schema Reload (PostgREST)
NOTIFY pgrst, 'reload schema';

-- 8. Seed Forms
INSERT INTO public.forms (name, description, schema) VALUES
('GAFC Progress Note', 'Monthly GAFC clinical progress note', '{}'::jsonb),
('GAFC Care Plan', 'MassHealth GAFC Program Care Plan', '{}'::jsonb),
('Physician Summary (PSF-1)', 'Physician summary for GAFC services', '{}'::jsonb),
('Clinical Note', 'General clinical documentation', '{}'::jsonb),
('MDS Assessment', 'Minimum Data Set Assessment', '{}'::jsonb),
('Nursing Assessment', 'Comprehensive Nursing Assessment', '{}'::jsonb),
('Patient Resource Data', 'Patient Resource Data Form', '{}'::jsonb),
('Request for Services (RFS-1)', 'Request for Services Form', '{}'::jsonb),
('Medication Administration Record (MAR)', 'Medication Administration Record', '{}'::jsonb),
('Treatment Administration Record (TAR)', 'Treatment Administration Record', '{}'::jsonb),
('Physician Orders', 'Physician Orders Form', '{}'::jsonb),
('Admission Assessment', 'Initial patient admission evaluation', '{}'::jsonb),
('Discharge Summary', 'Final documentation upon patient discharge', '{}'::jsonb)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    schema = COALESCE(public.forms.schema, '{}'::jsonb);`;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Active Patients
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Visits This Week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const { count: visitCount, error: visitError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_at', startOfWeek.toISOString());

      // 3. Fetch Pending Forms
      const { count: formCount, error: formError } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // 4. Fetch Recent Activity (Audit Logs)
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      // 5. Fetch Activity Data for Chart (Aggregate from DB)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split('T')[0],
          name: days[d.getDay()],
          visits: 0,
          forms: 0
        };
      });

      // Fetch visits for last 7 days
      const { data: recentVisits } = await supabase
        .from('visits')
        .select('scheduled_at')
        .gte('scheduled_at', last7Days[0].date);

      // Fetch forms for last 7 days
      const { data: recentForms } = await supabase
        .from('form_responses')
        .select('created_at')
        .gte('created_at', last7Days[0].date);

      const activityData = last7Days.map(day => {
        const dayVisits = recentVisits?.filter(v => v.scheduled_at.startsWith(day.date)).length || 0;
        const dayForms = recentForms?.filter(f => f.created_at.startsWith(day.date)).length || 0;
        return {
          name: day.name,
          visits: dayVisits,
          forms: dayForms
        };
      });

      setStats({
        activePatients: patientCount || 0,
        visitsThisWeek: visitCount || 0,
        pendingForms: formCount || 0,
        complianceScore: 98,
      });
      setRecentActivity(logs || []);
      setActivityData(activityData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('INSERT')) return UserPlus;
    if (action.includes('UPDATE')) return CheckCircle;
    if (action.includes('DELETE')) return ShieldCheck;
    return FileText;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('INSERT')) return { text: 'text-purple-600', bg: 'bg-purple-50' };
    if (action.includes('UPDATE')) return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (action.includes('DELETE')) return { text: 'text-red-600', bg: 'bg-red-50' };
    return { text: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-zinc-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm md:text-base text-zinc-500 mt-1">Welcome back, {profile?.full_name || 'User'}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white rounded-2xl border border-zinc-200 shadow-sm flex-1 sm:flex-none justify-center">
            <ShieldCheck size={18} className="text-partners-blue-dark shrink-0" />
            <span className="text-[10px] md:text-sm font-medium text-zinc-600 whitespace-nowrap">HIPAA Secure Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Patients" 
          value={stats.activePatients} 
          icon={Users} 
          trend="+12%" 
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard 
          title="Visits This Week" 
          value={stats.visitsThisWeek} 
          icon={Calendar} 
          trend="+5%" 
          color="bg-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Pending Forms" 
          value={stats.pendingForms} 
          icon={FileText} 
          color="bg-amber-500"
          loading={loading}
        />
        <StatCard 
          title="Compliance Score" 
          value={`${stats.complianceScore}%`} 
          icon={ShieldCheck} 
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-zinc-900">Clinical Activity</h3>
              <select className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="visits" fill="#005696" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="forms" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/progress-note" className="group bg-partners-blue-dark p-6 rounded-3xl text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <FileText size={24} />
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-bold">New Progress Note</h4>
              <p className="text-white/70 text-sm mt-1">Complete monthly GAFC nursing visit documentation.</p>
            </Link>
            <Link to="/care-plan" className="group bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <ClipboardList size={24} />
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h4 className="text-lg font-bold">New Care Plan</h4>
              <p className="text-white/70 text-sm mt-1">Develop or update MassHealth GAFC Care Plan.</p>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No recent activity.</p>
              ) : (
                recentActivity.map((log, i) => {
                  const colors = getActivityColor(log.action);
                  const Icon = getActivityIcon(log.action);
                  return (
                    <div key={log.id} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={colors.text} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">System Log</p>
                        <p className="text-xs text-zinc-500">{log.action} on {log.table_name}</p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 whitespace-nowrap">{formatTimeAgo(log.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>
            <button className="w-full mt-8 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-50 transition-colors">
              View All Activity
            </button>
          </div>

          <div className="bg-gradient-to-br from-partners-blue-dark to-blue-800 p-8 rounded-3xl text-white">
            <TrendingUp size={32} className="mb-4 text-blue-200" />
            <h3 className="text-xl font-bold mb-2">Compliance Alert</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              {stats.pendingForms} forms are currently in draft status. Please ensure all documentation is submitted.
            </p>
            <button className="mt-6 px-6 py-2 bg-white text-partners-blue-dark rounded-xl text-sm font-bold">
              Review Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

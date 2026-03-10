import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { jsPDF } from "jspdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("CRITICAL: Supabase environment variables are missing!");
  console.error("Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your platform Secrets.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Admin: Create User Endpoint
  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      
      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) throw authError;

      // 2. Update profile role (trigger handles creation, we update role)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role, full_name: fullName })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      res.json({ success: true, user: authData.user });
    } catch (error: any) {
      console.error("Admin Create User Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete User Endpoint
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // 1. Try to delete from Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        // If user not found in Auth, they might still be in profiles (orphaned)
        // We check for "User not found" or "AuthApiError" with that message
        const isUserNotFound = authError.message?.toLowerCase().includes('not found') || 
                              (authError as any).status === 404;

        if (isUserNotFound) {
          console.warn(`User ${userId} not found in Auth, attempting to delete from profiles...`);
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);
          
          if (profileError) throw profileError;
        } else {
          throw authError;
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin Delete User Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Database Setup Endpoint (Bypasses RLS using Service Role Key)
  app.post("/api/setup-database", async (req, res) => {
    try {
      console.log("Server: Starting database setup...");
      
      // 0. Create missing tables and columns
      console.log("Server: Ensuring tables and columns exist...");
      
      // We can't run arbitrary SQL easily via the JS client without a RPC function,
      // but we can try to insert into tables to see if they exist, or just rely on the manual SQL script.
      // However, we can use the supabaseAdmin to check and create if we had a way.
      // Since we don't have a direct "run sql" method in the SDK, we'll stick to seeding
      // and advise the user to run the SQL script for schema changes.
      
      // 1. Seed Forms
      const formsToSeed = [
        { name: 'GAFC Progress Note', description: 'Monthly GAFC clinical progress note', schema: {} },
        { name: 'GAFC Care Plan', description: 'MassHealth GAFC Program Care Plan', schema: {} },
        { name: 'Physician Summary (PSF-1)', description: 'Physician summary for GAFC services', schema: {} },
        { name: 'Request for Services (RFS-1)', description: 'Request for GAFC services', schema: {} },
        { name: 'Patient Resource Data', description: 'Patient demographic and resource information', schema: {} },
        { name: 'Physician Orders', description: 'Physician orders for clinical care', schema: {} },
        { name: 'MDS Assessment', description: 'Minimum Data Set assessment', schema: {} },
        { name: 'Nursing Assessment', description: 'Comprehensive nursing assessment', schema: {} },
        { name: 'Medication Administration Record (MAR)', description: 'Monthly MAR tracking', schema: {} },
        { name: 'Treatment Administration Record (TAR)', description: 'Monthly TAR tracking', schema: {} },
        { name: 'Clinical Note', description: 'General clinical documentation', schema: {} },
        { name: 'Admission Assessment', description: 'Initial patient admission evaluation', schema: {} },
        { name: 'Discharge Summary', description: 'Final documentation upon patient discharge', schema: {} }
      ];

      for (const form of formsToSeed) {
        // Check if form with same name exists
        const { data: existingForm } = await supabaseAdmin
          .from('forms')
          .select('id')
          .eq('name', form.name)
          .maybeSingle();
        
        if (!existingForm) {
          await supabaseAdmin.from('forms').insert([form]);
        }
      }

      // 1.5 Ensure profiles exist for all users
      console.log("Server: Ensuring profiles exist for all users...");
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!usersError && users?.users) {
        const allUsers = [...users.users];
        
        // If no users exist, create a default admin
        if (allUsers.length === 0) {
          console.log("Server: No users found, creating default admin (kianiisrarazam@gmail.com)...");
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: 'kianiisrarazam@gmail.com',
            password: 'Password123!',
            email_confirm: true,
            user_metadata: { full_name: 'Israr Azam Kiani' }
          });
          
          if (!createError && newUser?.user) {
            console.log("Server: Default admin created successfully.");
            allUsers.push(newUser.user);
          } else {
            console.error("Server: Failed to create default admin:", createError);
          }
        }

        for (const user of allUsers) {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!existingProfile) {
            await supabaseAdmin.from('profiles').insert([{
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email,
              email: user.email,
              role: 'admin'
            }]);
          }
        }
      }

      console.log("Server: Database setup completed successfully.");
      res.json({ success: true, message: 'Database setup completed successfully.' });
    } catch (error: any) {
      console.error("Server: Database Setup Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // PDF Generation Endpoint
  app.post("/api/generate-pdf", async (req, res) => {
    try {
      const { title, data, signatures } = req.body;
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(title || "Clinical Document", 20, 20);
      
      doc.setFontSize(12);
      let y = 40;
      
      // Add data fields
      Object.entries(data || {}).forEach(([key, value]) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${key}: ${value}`, 20, y);
        y += 10;
      });

      // Add signatures
      if (signatures && signatures.length > 0) {
        y += 20;
        signatures.forEach((sig: any) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.text(`Signed by: ${sig.signer_name}`, 20, y);
          y += 5;
          if (sig.image) {
            doc.addImage(sig.image, 'PNG', 20, y, 50, 20);
            y += 25;
          }
        });
      }

      const pdfBuffer = doc.output('arraybuffer');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("PDF Generation Error:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware loaded in development mode");
  } else {
    console.log("Serving static files in production mode");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

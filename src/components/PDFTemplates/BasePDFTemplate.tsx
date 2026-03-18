import React from 'react';
import { Logo } from '../Logo';

interface BasePDFTemplateProps {
  title: string;
  children: React.ReactNode;
  logo?: React.ReactNode;
  date?: string;
}

export const BasePDFTemplate: React.FC<BasePDFTemplateProps> = ({ title, children, logo, date }) => {
  return (
    <div 
      className="pdf-template-container bg-white text-black p-10 font-sans" 
      style={{ 
        width: '210mm', 
        minHeight: 'auto', 
        margin: '0 auto',
        color: '#18181b', // zinc-900
        backgroundColor: '#ffffff'
      }}
    >
      {/* Force standard colors to avoid oklab errors in html2canvas */}
      <style dangerouslySetInnerHTML={{ __html: `
        .pdf-template-container * {
          color-scheme: light !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Table fixes for html2canvas */
        table {
          table-layout: fixed !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        td, th {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }

        .bg-partners-blue-dark { background-color: #005696 !important; }
        .text-partners-blue-dark { color: #005696 !important; }
        .bg-partners-green { background-color: #00A651 !important; }
        .text-partners-green { color: #00A651 !important; }
        .border-partners-blue-dark { border-color: #005696 !important; }
        .border-partners-blue-dark\\/20 { border-color: rgba(0, 86, 150, 0.2) !important; }
        .text-zinc-900 { color: #18181b !important; }
        .text-zinc-800 { color: #27272a !important; }
        .text-zinc-700 { color: #3f3f46 !important; }
        .text-zinc-600 { color: #52525b !important; }
        .text-zinc-500 { color: #71717a !important; }
        .text-zinc-400 { color: #a1a1aa !important; }
        .bg-zinc-50 { background-color: #fafafa !important; }
        .bg-zinc-100 { background-color: #f4f4f5 !important; }
        .border-zinc-100 { border-color: #f4f4f5 !important; }
        .border-zinc-200 { border-color: #e4e4e7 !important; }
        .border-zinc-300 { border-color: #d4d4d8 !important; }
        .border-zinc-400 { border-color: #a1a1aa !important; }
        
        .page-break {
          page-break-before: always !important;
          margin-top: 2rem !important;
        }
        
        section, .grid, .flex {
          break-inside: avoid !important;
        }

        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
      `}} />

      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-partners-blue-dark pb-6 mb-8" style={{ borderBottomColor: '#005696' }}>
        <div className="flex items-center gap-4">
          {logo || (
            <div className="flex items-center gap-3">
              <Logo size={56} />
              <div>
                <h1 className="text-2xl font-bold italic tracking-tight" style={{ color: '#005696' }}>Partners Home</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: '#666666' }}>Nursing Services HIPAA Portal</p>
              </div>
            </div>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: '#18181b' }}>{title}</h2>
          <div className="text-xs" style={{ color: '#71717a' }}>
            {date && <p>Form Date: {date}</p>}
            <p>Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pdf-content space-y-6">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-zinc-200 text-center">
        <p className="text-[10px] text-zinc-400">
          This document contains protected health information (PHI) and is intended for authorized use only.
          Partners Home Nursing Services © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

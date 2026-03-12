import React, { useState, useEffect } from 'react';
import { FileText, GraduationCap, Briefcase } from 'lucide-react';
import { getDocuments } from '../services/apiService';

const DocumentsGuide = () => {
  const [documents, setDocuments] = useState({ students: [], professionals: [] });

  useEffect(() => {
    const fetchDocs = async () => {
      const data = await getDocuments();
      setDocuments(data);
    };
    fetchDocs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          Documents Guide <FileText className="text-amber-500" size={28} />
        </h1>
        <p className="text-slate-600 mt-1">Know exactly what paperwork you need to open your new bank account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <GraduationCap size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">For Students</h2>
          <ul className="space-y-3">
            {documents.students.map((doc, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                {doc}
              </li>
            ))}
          </ul>
        </div>

        {/* Working Professionals Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 transition-colors">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
            <Briefcase size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">For Working Professionals</h2>
          <ul className="space-y-3">
            {documents.professionals.map((doc, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentsGuide;

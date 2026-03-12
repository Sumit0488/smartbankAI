import React from 'react';

const ProfileSelectionModal = ({ show, onSelect }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6">
       <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm animate-in zoom-in-95">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Select your profile</h2>
          <p className="text-slate-500 mb-6 text-sm">Help us customize your financial suggestions.</p>
          
          <div className="space-y-3">
            {['Student', 'Working Professional', 'Self Employed'].map(type => (
              <button 
                key={type}
                onClick={() => onSelect(type)}
                className="w-full text-left px-5 py-4 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors font-medium text-slate-700 hover:text-emerald-700"
              >
                {type}
              </button>
            ))}
          </div>
       </div>
    </div>
  );
};

export default ProfileSelectionModal;

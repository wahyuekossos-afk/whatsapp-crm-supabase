import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Key, X, AlertCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Verifikasi Akses Admin",
  description = "Masukkan kredensial khusus untuk mengakses Admin Management",
  buttonText = "Masuk Admin",
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim() === 'Viscata' && password === 'Viscata123') {
      setUsername('');
      setPassword('');
      setError(null);
      onSuccess();
    } else {
      setError('Username atau Password yang Anda masukkan salah!');
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{title}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Username Admin <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan username..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-semibold text-slate-800 transition-all focus:outline-none"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password Admin <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Masukkan password..."
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-semibold text-slate-800 transition-all focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{buttonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

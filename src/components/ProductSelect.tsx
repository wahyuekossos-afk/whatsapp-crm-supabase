import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';

interface ProductSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const ProductSelect: React.FC<ProductSelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih atau cari produk...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelect = (selectedProduct: string) => {
    onChange(selectedProduct);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button / Display Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-xs hover:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 cursor-pointer transition-all"
      >
        <span className={`text-xs font-medium truncate ${value ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 min-w-[220px]">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari item order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      handleSelect(filteredOptions[0]);
                    } else {
                      handleCustomSubmit();
                    }
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Product List */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value.toLowerCase() === option.toLowerCase();
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate pr-2">📦 {option}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                Tidak ada produk cocok di database.
              </div>
            )}
          </div>

          {/* Custom Input Action Footer if searchQuery is typed */}
          {searchQuery.trim() && !options.some((o) => o.toLowerCase() === searchQuery.trim().toLowerCase()) && (
            <div className="p-1.5 border-t border-slate-100 bg-amber-50/50">
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="w-full text-left px-2.5 py-1.5 text-xs text-amber-800 hover:bg-amber-100 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Gunakan "{searchQuery.trim()}" (Kustom)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Search, Plus, X } from 'lucide-react';

/**
 * SearchableSelect
 * 
 * Props:
 * - options: [{ value, label, sub? }]  items to show
 * - value: currently selected value (string)
 * - onChange: (value, label) => void
 * - placeholder: string
 * - searchPlaceholder: string
 * - allowCreate: bool — show "Create new" option
 * - onCreateNew: (inputText) => void — called when user picks create
 * - disabled: bool
 * - className: string — wrapper classes
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  allowCreate = false,
  onCreateNew,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  const filtered = options.filter(o =>
    !query || o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
  );

  const showCreate = allowCreate && query.trim() && !filtered.some(o => o.label.toLowerCase() === query.toLowerCase());
  const totalItems = filtered.length + (showCreate ? 1 : 0);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setHighlighted(0);
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-item]');
      if (items[highlighted]) {
        items[highlighted].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlighted]);

  const handleSelect = useCallback((option) => {
    onChange(option.value, option.label);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const handleCreate = useCallback(() => {
    if (onCreateNew) onCreateNew(query.trim());
    setOpen(false);
    setQuery('');
  }, [onCreateNew, query]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlighted(h => Math.min(h + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlighted(h => Math.max(h - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlighted < filtered.length) {
          handleSelect(filtered[highlighted]);
        } else if (showCreate) {
          handleCreate();
        }
        break;
      case 'Escape':
        setOpen(false);
        setQuery('');
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left transition-all bg-white ${
          open
            ? 'border-[#77bfa3] ring-2 ring-[#77bfa3]/20'
            : 'border-[#dde7c7] hover:border-[#98c9a3]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`text-sm font-medium truncate ${value ? 'text-[#313c1a]' : 'text-[#98c9a3]'}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
              className="p-0.5 text-[#98c9a3] hover:text-[#313c1a] rounded"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={16} className={`text-[#98c9a3] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-[#dde7c7] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search input */}
          <div className="p-2 border-b border-[#edeec9]">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f8faf4] rounded-lg">
              <Search size={14} className="text-[#98c9a3] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-[#313c1a] placeholder:text-[#bfd8bd] outline-none font-medium"
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1"
          >
            {filtered.length === 0 && !showCreate && (
              <li className="px-4 py-3 text-sm text-[#98c9a3] font-medium text-center">
                No matches found
              </li>
            )}

            {filtered.map((option, i) => (
              <li
                key={option.value}
                data-item
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  i === highlighted ? 'bg-[#f0f7f4]' : 'hover:bg-[#f8faf4]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#313c1a] truncate">{option.label}</div>
                  {option.sub && <div className="text-xs text-[#98c9a3] truncate font-medium">{option.sub}</div>}
                </div>
                {option.value === value && <Check size={15} className="text-[#77bfa3] flex-shrink-0" />}
              </li>
            ))}

            {showCreate && (
              <li
                data-item
                role="option"
                onClick={handleCreate}
                onMouseEnter={() => setHighlighted(filtered.length)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-t border-[#edeec9] transition-colors ${
                  highlighted === filtered.length ? 'bg-[#f0f7f4]' : 'hover:bg-[#f8faf4]'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-[#bfd8bd]/30 flex items-center justify-center flex-shrink-0">
                  <Plus size={13} className="text-[#3c7f65]" />
                </div>
                <span className="text-sm font-semibold text-[#3c7f65]">
                  Create &ldquo;{query}&rdquo;
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

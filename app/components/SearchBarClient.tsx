'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchBarClientProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const AUTOCOMPLETE_DEBOUNCE = 200;

export default function SearchBarClient({
  value = '',
  onChange,
  placeholder = 'Search city or address',
}: SearchBarClientProps) {
  const [q, setQ] = useState(value);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    setQ(value);
  }, [value]);

  useEffect(() => {
    if (serviceRef.current) return;
    if (typeof window === 'undefined') return;
    if (!window.google?.maps?.places?.AutocompleteService) return;
    serviceRef.current = new google.maps.places.AutocompleteService();
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!serviceRef.current && typeof window !== 'undefined' && window.google?.maps?.places?.AutocompleteService) {
        serviceRef.current = new google.maps.places.AutocompleteService();
      }

      if (!serviceRef.current) {
        clearSuggestions();
        return;
      }
      serviceRef.current.getPlacePredictions(
        {
          input,
          types: ['geocode'],
        },
        (predictions) => {
          setSuggestions((predictions ?? []).slice(0, 5));
          setActiveIndex(-1);
        }
      );
    },
    [clearSuggestions]
  );

  const debouncedFetch = useCallback(
    (input: string) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      if (!input.trim()) {
        clearSuggestions();
        return;
      }
      debounceRef.current = window.setTimeout(() => fetchSuggestions(input), AUTOCOMPLETE_DEBOUNCE);
    },
    [clearSuggestions, fetchSuggestions]
  );

  function dispatchGeocode(target: string, placeId?: string) {
    if (!target.trim()) return;
    window.dispatchEvent(new CustomEvent('df:geocode', { detail: { q: target, placeId } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    clearSuggestions();
      dispatchGeocode(trimmed);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQ(newValue);
    setActiveIndex(-1);
    if (onChange) {
      onChange(newValue);
    }
    if (serviceRef.current && newValue.length >= 3) {
      debouncedFetch(newValue);
    } else {
      clearSuggestions();
    }
  }

  const handleSuggestionSelect = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      setQ(prediction.description);
      if (onChange) {
        onChange(prediction.description);
      }
      clearSuggestions();
      dispatchGeocode(prediction.description, prediction.place_id);
    },
    [clearSuggestions, onChange]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSuggestionSelect(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      clearSuggestions();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        clearSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2" ref={containerRef}>
      <div className="relative w-80">
        <input
          value={q}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-md border px-3 py-2"
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
            {suggestions.map((prediction, index) => (
              <li
                key={prediction.place_id}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionSelect(prediction);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {prediction.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" className="rounded-md bg-black px-3 py-2 text-white hover:opacity-90">
        Search
      </button>
    </form>
  );
}
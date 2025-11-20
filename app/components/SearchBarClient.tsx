'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchBarClientProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const AUTOCOMPLETE_DEBOUNCE = 200;

// Type definitions for autocomplete suggestions
interface AutocompleteSuggestion {
  placePrediction?: {
    placeId: string;
    text: {
      text: string;
      matches: Array<{ startOffset: number; endOffset: number }>;
    };
    structuredFormat?: {
      mainText: { text: string };
      secondaryText: { text: string };
    };
  };
}

interface AutocompleteSuggestionResponse {
  suggestions: AutocompleteSuggestion[];
}

// Browser compatibility check - support both old and new APIs
function isBrowserCompatible(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.google?.maps?.places) return false;
  
  // Check for new API first (AutocompleteSuggestion)
  if (typeof window.google.maps.places.AutocompleteSuggestion !== 'undefined') {
    return true;
  }
  
  // Fallback to old API (AutocompleteService) - still works but deprecated
  if (typeof window.google.maps.places.AutocompleteService !== 'undefined') {
    return true;
  }
  
  return false;
}

// Check if new API is available
function hasNewAutocompleteAPI(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.google?.maps?.places?.AutocompleteSuggestion !== 'undefined';
}

export default function SearchBarClient({
  value = '',
  onChange,
  placeholder = 'Search city or address',
}: SearchBarClientProps) {
  const [q, setQ] = useState(value);
  const [suggestions, setSuggestions] = useState<Array<{
    place_id: string;
    description: string;
  }>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [browserCompatible, setBrowserCompatible] = useState(false);
  const [usingNewAPI, setUsingNewAPI] = useState(false);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    setQ(value);
  }, [value]);

  // Check browser compatibility and initialize appropriate API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkCompatibility = () => {
      const compatible = isBrowserCompatible();
      setBrowserCompatible(compatible);
      
      if (compatible) {
        const hasNewAPI = hasNewAutocompleteAPI();
        setUsingNewAPI(hasNewAPI);
        
        // Initialize old API as fallback (still works, just deprecated)
        if (!hasNewAPI && !serviceRef.current) {
          try {
            serviceRef.current = new window.google.maps.places.AutocompleteService();
          } catch (error) {
            console.warn('Failed to initialize AutocompleteService:', error);
            setBrowserCompatible(false);
          }
        }
        
        // For new API, we'll use fetch requests (no initialization needed)
      }
    };

    // Check immediately
    checkCompatibility();

    // Also check after a delay in case Google Maps loads asynchronously
    const timeoutId = setTimeout(checkCompatibility, 1000);

    // Listen for Google Maps API load
    if (typeof window !== 'undefined') {
      const handleGoogleLoad = () => {
        checkCompatibility();
      };
      window.addEventListener('google-maps-loaded', handleGoogleLoad);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('google-maps-loaded', handleGoogleLoad);
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
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

  // Fetch suggestions using new API (AutocompleteSuggestion)
  const fetchSuggestionsNewAPI = useCallback(
    async (input: string) => {
      if (!browserCompatible || !usingNewAPI) {
        return;
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn('Google Maps API key not configured');
          return;
        }

        // Use Places API (New) AutocompleteSuggestion endpoint
        const response = await fetch(
          `https://places.googleapis.com/v1/places:autocomplete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
            },
            body: JSON.stringify({
              input: input,
              locationBias: {
                regionCode: 'US', // Focus on US locations
              },
            }),
          }
        );

        if (!response.ok) {
          console.warn('AutocompleteSuggestion API error:', response.status);
          // Fall back to old API if new API fails (403, 401, etc.)
          if (response.status === 403 || response.status === 401) {
            console.log('Falling back to old AutocompleteService API');
            setUsingNewAPI(false);
            return;
          }
          clearSuggestions();
          return;
        }

        const data = (await response.json()) as AutocompleteSuggestionResponse;
        
        if (data.suggestions && data.suggestions.length > 0) {
          const formattedSuggestions = data.suggestions
            .filter(s => s.placePrediction)
            .map(s => ({
              place_id: s.placePrediction!.placeId,
              description: s.placePrediction!.structuredFormat
                ? `${s.placePrediction!.structuredFormat.mainText.text}, ${s.placePrediction!.structuredFormat.secondaryText.text}`
                : s.placePrediction!.text.text,
            }))
            .slice(0, 5);
          
          setSuggestions(formattedSuggestions);
          setActiveIndex(-1);
        } else {
          clearSuggestions();
        }
      } catch (error) {
        console.warn('AutocompleteSuggestion error:', error);
        // Fall back to old API on any error
        console.log('Falling back to old AutocompleteService API due to error');
        // Note: Will fallback via fetchSuggestions callback
        setUsingNewAPI(false);
      }
    },
    [clearSuggestions, browserCompatible, usingNewAPI]
  );

  // Fetch suggestions using old API (AutocompleteService) - fallback
  const fetchSuggestionsOldAPI = useCallback(
    (input: string) => {
      if (!browserCompatible || !serviceRef.current) {
        clearSuggestions();
        return;
      }

      try {
        serviceRef.current.getPlacePredictions(
          {
            input,
            types: ['geocode'],
          },
          (predictions, status) => {
            // Handle different status codes for better error handling
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formatted = predictions.slice(0, 5).map(p => ({
                place_id: p.place_id,
                description: p.description,
              }));
              setSuggestions(formatted);
              setActiveIndex(-1);
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setSuggestions([]);
              setActiveIndex(-1);
            } else {
              // For other statuses (OVER_QUERY_LIMIT, REQUEST_DENIED, etc.), just clear
              clearSuggestions();
            }
          }
        );
      } catch (error) {
        // Fallback for browsers that don't support the API properly
        console.warn('AutocompleteService error:', error);
        clearSuggestions();
      }
    },
    [clearSuggestions, browserCompatible]
  );

  const fetchSuggestions = useCallback(
    (input: string) => {
      if (usingNewAPI) {
        fetchSuggestionsNewAPI(input);
      } else {
        fetchSuggestionsOldAPI(input);
      }
    },
    [usingNewAPI, fetchSuggestionsNewAPI, fetchSuggestionsOldAPI]
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
      if (browserCompatible) {
        debounceRef.current = window.setTimeout(() => fetchSuggestions(input), AUTOCOMPLETE_DEBOUNCE);
      }
    },
    [clearSuggestions, fetchSuggestions, browserCompatible]
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
    if (browserCompatible && newValue.length >= 3) {
      debouncedFetch(newValue);
    } else {
      clearSuggestions();
    }
  }

  const handleSuggestionSelect = useCallback(
    (suggestion: { place_id: string; description: string }) => {
      setQ(suggestion.description);
      if (onChange) {
        onChange(suggestion.description);
      }
      clearSuggestions();
      dispatchGeocode(suggestion.description, suggestion.place_id);
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
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const target = event.target instanceof Node ? event.target : null;
      if (target && !containerRef.current.contains(target)) {
        clearSuggestions();
      }
    };

    // Support both mouse and touch events for better mobile compatibility
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [clearSuggestions]);

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        width: '100%',
        maxWidth: '100%'
      }} 
      ref={containerRef}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%',
        minWidth: 0,
        flex: 1
      }}>
        <input
          value={q}
          onChange={handleInputChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px',
            minHeight: '44px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: '16px',
            boxSizing: 'border-box',
            touchAction: 'manipulation',
            WebkitAppearance: 'none', // Fix Safari appearance
            MozAppearance: 'textfield' // Fix Firefox appearance
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off" // Prevent browser autocomplete interference
        />
        {suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 4,
            width: '100%',
            overflow: 'hidden',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            maxHeight: '300px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
          }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.place_id}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  minHeight: '44px',
                  fontSize: '14px',
                  background: index === activeIndex ? '#eff6ff' : '#fff',
                  color: index === activeIndex ? '#1d4ed8' : '#111827',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent' // Remove tap highlight on iOS
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionSelect(suggestion);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleSuggestionSelect(suggestion);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {suggestion.description}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button 
        type="submit" 
        style={{ 
          padding: '12px 20px',
          minHeight: '44px',
          minWidth: '80px',
          borderRadius: 8, 
          background: '#111827', 
          color: '#fff',
          border: 'none',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          touchAction: 'manipulation',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          WebkitAppearance: 'none', // Fix Safari button appearance
          MozAppearance: 'none' // Fix Firefox button appearance
        }}
      >
        Search
      </button>
    </form>
  );
}

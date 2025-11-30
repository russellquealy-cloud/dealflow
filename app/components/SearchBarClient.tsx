'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchBarClientProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const AUTOCOMPLETE_DEBOUNCE = 300;

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
  const containerRef = useRef<HTMLFormElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    setQ(value);
  }, [value]);

  // Check browser compatibility and initialize Google Places services
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkCompatibility = () => {
      if (!window.google?.maps?.places) {
        setBrowserCompatible(false);
        return;
      }

      // Check for AutocompleteService (standard Google Maps JavaScript library)
      if (typeof window.google.maps.places.AutocompleteService === 'undefined') {
        setBrowserCompatible(false);
        return;
      }

      setBrowserCompatible(true);
      
      // Initialize AutocompleteService for getting predictions
      if (!serviceRef.current) {
        try {
          serviceRef.current = new window.google.maps.places.AutocompleteService();
        } catch (error) {
          console.warn('Failed to initialize AutocompleteService:', error);
          setBrowserCompatible(false);
          return;
        }
      }

      // Initialize PlacesService for getting place details (geometry)
      // We need a dummy div for PlacesService constructor
      if (!placesServiceRef.current) {
        try {
          const dummyDiv = document.createElement('div');
          placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
        } catch (error) {
          console.warn('Failed to initialize PlacesService:', error);
        }
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

  // Fetch suggestions using AutocompleteService (Google Maps JavaScript library)
  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!browserCompatible || !serviceRef.current) {
        clearSuggestions();
        return;
      }

      try {
        serviceRef.current.getPlacePredictions(
          {
            input,
            types: ['geocode'], // Restrict to geocoding results (addresses, cities)
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formatted = predictions.slice(0, 5).map(p => ({
                place_id: p.place_id,
                description: p.description,
              }));
              setSuggestions(formatted);
              setActiveIndex(-1);
            } else {
              // For all other statuses (ZERO_RESULTS, OVER_QUERY_LIMIT, REQUEST_DENIED, etc.), clear suggestions
              clearSuggestions();
              // Only log warnings for actual errors (not ZERO_RESULTS)
              if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT ||
                  status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED ||
                  status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
                console.warn('AutocompleteService error:', status);
              }
            }
          }
        );
      } catch (error) {
        console.warn('AutocompleteService error:', error);
        clearSuggestions();
      }
    },
    [clearSuggestions, browserCompatible]
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

  // Get place details including geometry (lat/lng/viewport) from PlacesService
  const getPlaceDetails = useCallback(
    (placeId: string): Promise<{
      lat: number;
      lng: number;
      viewport?: { north: number; south: number; east: number; west: number };
      formattedAddress?: string;
    } | null> => {
      return new Promise((resolve) => {
        if (!placesServiceRef.current) {
          console.warn('PlacesService not initialized');
          resolve(null);
          return;
        }

        placesServiceRef.current.getDetails(
          {
            placeId,
            fields: ['geometry', 'formatted_address', 'name'],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              const location = place.geometry.location;
              // LatLng has lat() and lng() methods
              const lat = location.lat();
              const lng = location.lng();

              let viewport: { north: number; south: number; east: number; west: number } | undefined;
              if (place.geometry.viewport) {
                const ne = place.geometry.viewport.getNorthEast();
                const sw = place.geometry.viewport.getSouthWest();
                viewport = {
                  north: ne.lat(),
                  south: sw.lat(),
                  east: ne.lng(),
                  west: sw.lng(),
                };
              }

              resolve({
                lat,
                lng,
                viewport,
                formattedAddress: place.formatted_address || place.name,
              });
            } else {
              console.warn('Failed to get place details:', status);
              resolve(null);
            }
          }
        );
      });
    },
    []
  );

  function dispatchGeocodeWithPlace(
    target: string,
    placeId?: string,
    placeDetails?: {
      lat: number;
      lng: number;
      viewport?: { north: number; south: number; east: number; west: number };
      formattedAddress?: string;
    }
  ) {
    if (!target.trim()) return;
    window.dispatchEvent(
      new CustomEvent('df:geocode', {
        detail: {
          q: target,
          placeId,
          placeDetails, // Include place geometry directly
        },
      })
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    clearSuggestions();
    // If no suggestion selected, dispatch with just text (will use geocode API as fallback)
    dispatchGeocodeWithPlace(trimmed);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQ(newValue);
    setActiveIndex(-1);
    if (onChange) {
      onChange(newValue);
    }
    if (browserCompatible && newValue.length >= 2) {
      debouncedFetch(newValue);
    } else {
      clearSuggestions();
    }
  }

  const handleSuggestionSelect = useCallback(
    async (suggestion: { place_id: string; description: string }) => {
      setQ(suggestion.description);
      if (onChange) {
        onChange(suggestion.description);
      }
      clearSuggestions();

      // Get place details with geometry directly from PlacesService
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      
      if (placeDetails) {
        // Dispatch with place details (geometry) - this will be used directly without geocode API call
        dispatchGeocodeWithPlace(suggestion.description, suggestion.place_id, placeDetails);
      } else {
        // Fallback: dispatch with placeId, will use geocode API
        dispatchGeocodeWithPlace(suggestion.description, suggestion.place_id);
      }
    },
    [clearSuggestions, onChange, getPlaceDetails]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) {
      // Allow Enter to submit even without suggestions
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event as unknown as React.FormEvent);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) {
        handleSuggestionSelect(suggestions[activeIndex]);
      } else {
        // If no suggestion selected, submit the form
        handleSubmit(event as unknown as React.FormEvent);
      }
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

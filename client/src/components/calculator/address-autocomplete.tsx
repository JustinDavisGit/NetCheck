import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Search } from "lucide-react";
import { NM_GRT_RATES } from "@/lib/grt-rates";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onGrtCodeChange?: (code: string) => void;
  placeholder?: string;
  label?: string;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onGrtCodeChange,
  placeholder = "Enter property address",
  label = "Property Address"
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle input changes and get suggestions
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);

    // Use Nominatim (OpenStreetMap) for address suggestions
    const searchQuery = `${value} New Mexico, USA`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(searchQuery)}`;

    fetch(url)
      .then(response => response.json())
      .then((data: AddressSuggestion[]) => {
        setIsLoading(false);
        
        // Filter for New Mexico addresses
        const nmAddresses = data.filter(item => 
          item.address && 
          (item.address.state === 'New Mexico' || 
           item.display_name.toLowerCase().includes('new mexico'))
        );
        
        setSuggestions(nmAddresses);
        setShowDropdown(nmAddresses.length > 0);
      })
      .catch(error => {
        console.error("Address search failed:", error);
        setIsLoading(false);
        setSuggestions([]);
        setShowDropdown(false);
      });
  }, [value]);

  // Find matching GRT code based on city/location
  const findGrtCode = (address: string): string => {
    const addressLower = address.toLowerCase();
    
    // Check for specific cities/areas in New Mexico
    for (const [code, data] of Object.entries(NM_GRT_RATES)) {
      const locationCode = data.locationCode.toLowerCase();
      
      // Check if the address contains the city name
      if (addressLower.includes(locationCode) || 
          (locationCode.includes('albuquerque') && addressLower.includes('albuquerque')) ||
          (locationCode.includes('santa fe') && addressLower.includes('santa fe')) ||
          (locationCode.includes('las cruces') && addressLower.includes('las cruces')) ||
          (locationCode.includes('rio rancho') && addressLower.includes('rio rancho'))) {
        return code;
      }
    }
    
    // Default to Albuquerque if no specific match found
    return "351";
  };

  // Handle address selection
  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    const selectedAddress = suggestion.display_name;
    onChange(selectedAddress);
    
    // Try to determine GRT code from the address
    const grtCode = findGrtCode(selectedAddress);
    if (onGrtCodeChange) {
      onGrtCodeChange(grtCode);
    }
    
    setShowDropdown(false);
    setSuggestions([]);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format address for display
  const formatAddress = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    const parts = [];
    
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }
    
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postcode) parts.push(addr.postcode);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="address-input" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        {label}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
        
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Dropdown for suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleAddressSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors border-b border-border last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatAddress(suggestion)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.address.city}, {suggestion.address.state}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helpful tip */}
      <p className="text-xs text-muted-foreground mt-1">
        💡 Type your address to see suggestions and auto-select the correct GRT tax rate
      </p>
    </div>
  );
}
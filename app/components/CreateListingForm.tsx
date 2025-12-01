"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

type FormState = {
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number | "";
  baths: number | "";
  sqft: number | "";
  lot_sqft: number | "";
  price: number | "";
  description: string;
  arv: number | "";
  repairs: number | "";
  property_type: string;
  age_restricted: boolean;
};

export default function CreateListingForm({ ownerId }: { ownerId?: string }) {
  const router = useRouter();
  const { session } = useAuth();
  
  const [form, setForm] = React.useState<FormState>({
    title: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    beds: "",
    baths: "",
    sqft: "",
    lot_sqft: "",
    price: "",
    description: "",
    arv: "",
    repairs: "",
    property_type: "single-family",
    age_restricted: false,
  });

  const [images, setImages] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const handleCameraCapture = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create a canvas to capture the image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImages(prev => [...prev, file]);
          }
        }, 'image/jpeg', 0.8);

        // Stop the camera
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      console.error('Camera access denied or error:', error);
      setMessage('Camera access denied. Please allow camera access to take photos.');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Ensure we have a valid session before proceeding
    if (!session || !session.access_token) {
      setMessage('⚠️ Your session has expired. Please refresh the page and try again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      // Validate address
      if (!form.address.trim() && !form.city.trim()) {
        setMessage('⚠️ Please enter at least an address or city to create a listing.');
        setLoading(false);
        return;
      }

      // Use API route for listing creation (handles geocoding server-side)
      const listingData = {
        title: form.title || `${form.beds} bed, ${form.baths} bath in ${form.city}`,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        beds: form.beds || null,
        baths: form.baths || null,
        sqft: form.sqft || null,
        lot_sqft: form.lot_sqft || null,
        price: form.price || null,
        arv: form.arv || null,
        repairs: form.repairs || null,
        description: form.description,
        property_type: form.property_type || "single-family",
        age_restricted: form.age_restricted || false,
        contact_email: "russell.quealy@gmail.com", // You can make this dynamic
        contact_phone: "555-0123", // You can make this dynamic
        status: 'live',
      };

      // Call API route which handles geocoding server-side
      // Include Authorization header with session token for dual auth support
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const createResponse = await fetch('/api/listings', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(listingData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ error: 'Failed to create listing' }));
        
        // Provide user-friendly error messages
        let errorMessage = errorData.error || 'Failed to create listing';
        if (createResponse.status === 401) {
          errorMessage = 'Please sign in to create a listing.';
        } else if (createResponse.status === 403) {
          errorMessage = 'You do not have permission to create listings. Please contact support.';
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await createResponse.json();
      const listingId = responseData.id;
      
      if (!listingId) {
        throw new Error('Failed to create listing: No listing ID returned');
      }

      // Upload images if any
      if (images.length > 0) {
        const imageUrls: string[] = [];
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${listingId}-${i}.${fileExt}`;
          const filePath = `listings/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Image upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }

        // Update listing with image URLs
        if (imageUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('listings')
            .update({ 
              images: imageUrls,
              cover_image_url: imageUrls[0] // First image as cover
            })
            .eq('id', listingId);
            
          if (updateError) {
            console.error('Error updating listing with images:', updateError);
            // Don't fail the whole operation if image update fails
          }
        }
      }

      // Navigate to My Listings page on success
      router.push('/my-listings');

    } catch (error) {
      console.error('Error creating listing:', error);
      setMessage(`Error creating listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-6 sm:space-y-8">
        {/* Property Details Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-900">Property Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Property Title</label>
              <input 
                name="title" 
                value={form.title} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="e.g., Beautiful 3BR Home in Downtown"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Price</label>
              <input 
                name="price" 
                type="number" 
                value={form.price} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="250000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Address</label>
              <input 
                name="address" 
                value={form.address} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">City</label>
              <input 
                name="city" 
                value={form.city} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Tucson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">State</label>
              <input 
                name="state" 
                value={form.state} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="AZ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">ZIP Code</label>
              <input 
                name="zip" 
                value={form.zip} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="85701"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={(e) => setForm({...form, property_type: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="single-family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="multi-family">Multi-Family</option>
                <option value="land">Land</option>
                <option value="manufactured">Manufactured Home</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Restricted</label>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  name="age_restricted"
                  checked={form.age_restricted}
                  onChange={(e) => setForm({...form, age_restricted: e.target.checked})}
                  className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">55+ Community</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input 
                name="beds" 
                type="number" 
                value={form.beds} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input 
                name="baths" 
                type="number" 
                step="0.5"
                value={form.baths} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Feet</label>
              <input 
                name="sqft" 
                type="number" 
                value={form.sqft} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="1800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lot Size (sq ft)</label>
              <input 
                name="lot_sqft" 
                type="number" 
                value={form.lot_sqft} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="7200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ARV</label>
              <input 
                name="arv" 
                type="number" 
                value={form.arv} 
                onChange={onChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="300000"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Repair Estimate</label>
            <input 
              name="repairs" 
              type="number" 
              value={form.repairs} 
              onChange={onChange} 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="25000"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={onChange} 
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Describe the property, its condition, and any notable features..."
            />
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Property Photos</h2>
          
          <div className="space-y-4">
            {/* Upload Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors">
                  <div className="text-gray-600">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-medium">Upload from Camera Roll</p>
                    <p className="text-xs text-gray-500">Click to select photos</p>
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={handleCameraCapture}
                className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-gray-600">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium">Take Photo</p>
                  <p className="text-xs text-gray-500">Use camera</p>
                </div>
              </button>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      width={128}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-500">
              Upload up to 20 photos. First photo will be used as the main thumbnail.
            </p>
          </div>
      </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
      </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}
    </form>
    </div>
  );
}

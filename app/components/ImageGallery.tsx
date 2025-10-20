'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

type Props = {
  coverImage?: string;
  galleryImages: string[];
  title: string;
};

export default function ImageGallery({ coverImage, galleryImages, title }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Safely combine cover image and gallery images
  const allImages = React.useMemo(() => {
    const cover = coverImage && coverImage.trim() ? [coverImage] : [];
    const gallery = Array.isArray(galleryImages) ? galleryImages.filter(img => img && img.trim()) : [];
    return [...cover, ...gallery];
  }, [coverImage, galleryImages]);
  
  // Filter out duplicates and empty strings
  const uniqueImages = React.useMemo(() => {
    return allImages.filter((img, index, arr) => 
      img && img.trim() && arr.indexOf(img) === index
    );
  }, [allImages]);

  // Handle keyboard navigation for main image
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : uniqueImages.length - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => prev < uniqueImages.length - 1 ? prev + 1 : 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [uniqueImages.length]);

  const nextImage = () => {
    setSelectedIndex(prev => prev < uniqueImages.length - 1 ? prev + 1 : 0);
  };

  const prevImage = () => {
    setSelectedIndex(prev => prev > 0 ? prev - 1 : uniqueImages.length - 1);
  };

  if (uniqueImages.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: 400, 
        background: '#f3f4f6', 
        borderRadius: 12, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 18,
        marginBottom: 16
      }}>
        No Images Available
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Main Image Display */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: 500, 
        borderRadius: 12, 
        overflow: 'hidden', 
        background: '#f3f4f6',
        marginBottom: 16
      }}>
        <Image 
          src={uniqueImages[selectedIndex]} 
          alt={title} 
          fill 
          style={{ objectFit: 'contain' }} 
          priority 
          onError={(e) => {
            console.error('Main image failed to load:', uniqueImages[selectedIndex], e);
          }}
          onLoad={() => {
            console.log('Main image loaded successfully:', uniqueImages[selectedIndex]);
          }}
        />
        
        {/* Navigation arrows on main image */}
        {uniqueImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: 'white',
                fontSize: 24,
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: 'white',
                fontSize: 24,
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ›
            </button>
          </>
        )}
        
        {/* Image counter */}
        {uniqueImages.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600
          }}>
            {selectedIndex + 1} of {uniqueImages.length}
          </div>
        )}
      </div>

      {/* Square Thumbnail Gallery - Horizontal Scroll */}
      {uniqueImages.length > 1 && (
        <div style={{ 
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 16,
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}>
          {uniqueImages.map((img, index) => (
            <div 
              key={img} 
              style={{ 
                position: 'relative', 
                width: 120, 
                height: 120, 
                borderRadius: 12, 
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#f3f4f6',
                border: selectedIndex === index ? '3px solid #0ea5e9' : '3px solid transparent',
                flexShrink: 0
              }}
              onClick={() => setSelectedIndex(index)}
            >
              <Image 
                src={img} 
                alt={`Photo ${index + 1}`} 
                fill 
                style={{ objectFit: 'cover' }} 
                onError={(e) => {
                  console.error('Thumbnail image failed to load:', img, e);
                }}
                onLoad={() => {
                  console.log('Thumbnail image loaded successfully:', img);
                }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Instructions */}
      {uniqueImages.length > 1 && (
        <div style={{
          color: '#6b7280',
          fontSize: 14,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Click thumbnails or use arrow keys to navigate
        </div>
      )}
    </div>
  );
}
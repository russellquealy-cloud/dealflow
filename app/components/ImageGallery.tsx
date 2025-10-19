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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : uniqueImages.length - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => prev < uniqueImages.length - 1 ? prev + 1 : 0);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, uniqueImages.length]);

  const openModal = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
    <>
      {/* Main Image Display */}
      <div style={{ marginBottom: 16 }}>
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: 500, 
            borderRadius: 12, 
            overflow: 'hidden', 
            cursor: 'pointer',
            background: '#f3f4f6'
          }}
          onClick={() => openModal(0)}
        >
          <Image 
            src={uniqueImages[0]} 
            alt={title} 
            fill 
            style={{ objectFit: 'contain' }} 
            priority 
            onError={(e) => {
              console.error('Main image failed to load:', uniqueImages[0], e);
            }}
            onLoad={() => {
              console.log('Main image loaded successfully:', uniqueImages[0]);
            }}
          />
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
              {uniqueImages.length} photos
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {uniqueImages.length > 1 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 8, 
          marginBottom: 16 
        }}>
          {uniqueImages.slice(1).map((img, index) => (
            <div 
              key={img} 
              style={{ 
                position: 'relative', 
                width: '100%', 
                height: 80, 
                borderRadius: 8, 
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#f3f4f6'
              }}
              onClick={() => openModal(index + 1)}
            >
              <Image 
                src={img} 
                alt={`Photo ${index + 2}`} 
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: 24,
                width: 40,
                height: 40,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001
              }}
            >
              ×
            </button>

            {/* Navigation Arrows */}
            {uniqueImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  style={{
                    position: 'absolute',
                    left: -60,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: 24,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  style={{
                    position: 'absolute',
                    right: -60,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    fontSize: 24,
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001
                  }}
                >
                  ›
                </button>
              </>
            )}

            {/* Main Image */}
            <div style={{ position: 'relative', width: '100%', height: '80vh' }}>
              <Image 
                src={uniqueImages[selectedIndex]} 
                alt={`${title} - Photo ${selectedIndex + 1}`} 
                fill 
                style={{ objectFit: 'contain' }} 
                onError={(e) => {
                  console.error('Modal image failed to load:', uniqueImages[selectedIndex], e);
                }}
                onLoad={() => {
                  console.log('Modal image loaded successfully:', uniqueImages[selectedIndex]);
                }}
              />
            </div>

            {/* Image Counter */}
            {uniqueImages.length > 1 && (
              <div style={{
                color: 'white',
                fontSize: 16,
                marginTop: 16,
                textAlign: 'center'
              }}>
                {selectedIndex + 1} of {uniqueImages.length}
              </div>
            )}

            {/* Instructions */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center'
            }}>
              Use arrow keys or click arrows to navigate • Press ESC to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

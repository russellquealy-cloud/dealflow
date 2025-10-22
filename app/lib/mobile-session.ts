'use client';

import { supabase } from '@/supabase/client';

export class MobileSessionManager {
  private static instance: MobileSessionManager;
  
  static getInstance(): MobileSessionManager {
    if (!MobileSessionManager.instance) {
      MobileSessionManager.instance = new MobileSessionManager();
    }
    return MobileSessionManager.instance;
  }

  // Store session in localStorage for mobile persistence
  storeSession(session: { access_token?: string; refresh_token?: string; expires_at?: number; user?: unknown }) {
    try {
      if (session && session.access_token) {
        const sessionData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: session.user
        };
        
        localStorage.setItem('dealflow-session', JSON.stringify(sessionData));
        console.log('🔐 Mobile session stored successfully');
        return true;
      }
    } catch (error) {
      console.error('Error storing mobile session:', error);
      return false;
    }
    return false;
  }

  // Retrieve session from localStorage
  getStoredSession() {
    try {
      const stored = localStorage.getItem('dealflow-session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        
        // Check if session is still valid
        if (sessionData.expires_at && Date.now() < sessionData.expires_at * 1000) {
          console.log('🔐 Valid mobile session found in localStorage');
          return sessionData;
        } else {
          console.log('🔐 Stored session expired, removing from localStorage');
          this.clearStoredSession();
        }
      }
    } catch (error) {
      console.error('Error retrieving mobile session:', error);
      this.clearStoredSession();
    }
    return null;
  }

  // Clear stored session
  clearStoredSession() {
    try {
      localStorage.removeItem('dealflow-session');
      console.log('🔐 Mobile session cleared from localStorage');
    } catch (error) {
      console.error('Error clearing mobile session:', error);
    }
  }

  // Restore session from localStorage to Supabase
  async restoreSession() {
    try {
      const storedSession = this.getStoredSession();
      if (storedSession) {
        // Try to restore the session with Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: storedSession.access_token,
          refresh_token: storedSession.refresh_token
        });
        
        if (error) {
          console.error('Error restoring mobile session:', error);
          this.clearStoredSession();
          return null;
        }
        
        if (data.session) {
          console.log('🔐 Mobile session restored successfully');
          return data.session;
        }
      }
    } catch (error) {
      console.error('Error restoring mobile session:', error);
      this.clearStoredSession();
    }
    return null;
  }

  // Check if user is on mobile device
  isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    
    // Check for mobile devices
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // Check for touch capability
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobile || isTouch;
  }

  // Initialize mobile session management
  async initialize() {
    if (this.isMobileDevice()) {
      console.log('📱 Mobile device detected, initializing session management');
      
      // Try to restore existing session
      await this.restoreSession();
      
      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Mobile auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          this.storeSession(session);
        } else if (event === 'SIGNED_OUT') {
          this.clearStoredSession();
        }
      });
    }
  }
}

// Export singleton instance
export const mobileSessionManager = MobileSessionManager.getInstance();

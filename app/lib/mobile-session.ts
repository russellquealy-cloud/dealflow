'use client';

import { supabase } from '@/supabase/client';
import type { Session } from '@supabase/supabase-js';

export class MobileSessionManager {
  private static instance: MobileSessionManager;
  private lastRestoreAttempt: number = 0;
  private restoreInProgress: boolean = false;
  private readonly MIN_RESTORE_INTERVAL = 60000; // 60 seconds minimum between restore attempts
  private initialized: boolean = false;
  
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

  // Restore session from localStorage to Supabase with rate limiting
  async restoreSession(): Promise<Session | null> {
    // Rate limiting: Prevent excessive restore attempts
    const now = Date.now();
    if (this.restoreInProgress) {
      console.log('🔐 Mobile session restore already in progress, skipping');
      return null;
    }
    
    if (now - this.lastRestoreAttempt < this.MIN_RESTORE_INTERVAL) {
      const waitTime = Math.ceil((this.MIN_RESTORE_INTERVAL - (now - this.lastRestoreAttempt)) / 1000);
      console.log(`🔐 Mobile session restore rate limited, wait ${waitTime}s`);
      return null;
    }

    // Check if Supabase already has a valid session before attempting restore
    try {
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        console.log('🔐 Supabase already has a valid session, skipping restore');
        return existingSession.session;
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }

    this.restoreInProgress = true;
    this.lastRestoreAttempt = now;

    try {
      const storedSession = this.getStoredSession();
      if (!storedSession) {
        this.restoreInProgress = false;
        return null;
      }

      // Try to restore the session with Supabase
      const { data, error } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token
      });
      
      if (error) {
        // Handle rate limit errors gracefully
        if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('too many')) {
          console.warn('⚠️ Rate limited while restoring mobile session, will retry later');
          // Don't clear stored session on rate limit - keep it for next attempt
          this.lastRestoreAttempt = now; // Update timestamp to enforce cooldown
          this.restoreInProgress = false;
          return null;
        }
        
        // For other errors (invalid token, etc.), clear stored session
        console.error('Error restoring mobile session:', error);
        this.clearStoredSession();
        this.restoreInProgress = false;
        return null;
      }
      
      if (data.session) {
        console.log('🔐 Mobile session restored successfully');
        this.restoreInProgress = false;
        return data.session;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle rate limit errors in catch block too
      if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('too many')) {
        console.warn('⚠️ Rate limited while restoring mobile session (catch), will retry later');
        this.lastRestoreAttempt = now;
        this.restoreInProgress = false;
        return null;
      }
      
      console.error('Error restoring mobile session:', error);
      this.clearStoredSession();
    } finally {
      this.restoreInProgress = false;
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

  // Initialize mobile session management (only once per app lifecycle)
  async initialize(): Promise<Session | null> {
    // Prevent multiple initializations
    if (this.initialized) {
      return null;
    }

    if (this.isMobileDevice()) {
      console.log('📱 Mobile device detected, initializing session management');
      
      // Try to restore existing session (with rate limiting protection)
      const restoredSession = await this.restoreSession();
      this.initialized = true;
      return restoredSession;
    } else {
      this.initialized = true;
      return null;
    }
  }

  // Reset initialization state (useful for testing or re-initialization)
  resetInitialization() {
    this.initialized = false;
  }

  handleAuthEvent(event: string, session: Session | null) {
    if (!this.isMobileDevice()) {
      return;
    }

    if (event === 'SIGNED_IN' && session) {
      this.storeSession(session);
    }

    if (event === 'SIGNED_OUT') {
      this.clearStoredSession();
    }
  }
}

// Export singleton instance
export const mobileSessionManager = MobileSessionManager.getInstance();

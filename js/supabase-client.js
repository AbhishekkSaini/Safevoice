// Supabase Client Configuration
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth state management
let currentUser = null;
let authStateListeners = [];

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    
    // Notify all listeners
    authStateListeners.forEach(listener => {
        listener(currentUser, event);
    });
    
    // Update UI based on auth state
    updateAuthUI();
});

// Add auth state listener
export function onAuthStateChange(callback) {
    authStateListeners.push(callback);
    
    // Call immediately with current state
    callback(currentUser, 'INITIAL_SESSION');
    
    // Return unsubscribe function
    return () => {
        authStateListeners = authStateListeners.filter(listener => listener !== callback);
    };
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Update auth UI elements
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileSignupBtn = document.getElementById('mobileSignupBtn');
    const userProfile = document.getElementById('userProfile');

    const authButtons = [loginBtn, signupBtn, mobileLoginBtn, mobileSignupBtn];
    const loggedInElements = [logoutBtn, userProfile];

    if (currentUser) {
        // User is logged in
        authButtons.forEach(btn => btn && btn.classList.add('hidden'));
        loggedInElements.forEach(el => el && el.classList.remove('hidden'));
        
        // Update user profile display
        if (userProfile) {
            updateUserProfileDisplay();
        }
    } else {
        // User is logged out
        authButtons.forEach(btn => btn && btn.classList.remove('hidden'));
        loggedInElements.forEach(el => el && el.classList.add('hidden'));
    }
}

// Update user profile display
async function updateUserProfileDisplay() {
    if (!currentUser) return;
    
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', currentUser.id)
            .single();
        
        const userProfile = document.getElementById('userProfile');
        if (userProfile && profile) {
            const displayName = `${profile.first_name} ${profile.last_name}`.trim() || 'User';
            userProfile.textContent = displayName;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Auth functions
export async function signUp(email, password, userData = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
    }
}

export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error };
    }
}

// Profile functions
export async function getProfile(userId = null) {
    const id = userId || currentUser?.id;
    if (!id) return { data: null, error: new Error('No user ID provided') };
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error fetching profile:', error);
        return { data: null, error };
    }
}

export async function updateProfile(profileData) {
    if (!currentUser) return { data: null, error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id)
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
    }
}

// Emergency contacts functions
export async function getEmergencyContacts() {
    if (!currentUser) return { data: [], error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });
        
        return { data: data || [], error };
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        return { data: [], error };
    }
}

export async function addEmergencyContact(contactData) {
    if (!currentUser) return { data: null, error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('emergency_contacts')
            .insert({
                ...contactData,
                user_id: currentUser.id
            })
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        return { data: null, error };
    }
}

// Emergency alerts functions
export async function createEmergencyAlert(alertData) {
    if (!currentUser) return { data: null, error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('emergency_alerts')
            .insert({
                ...alertData,
                user_id: currentUser.id
            })
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error creating emergency alert:', error);
        return { data: null, error };
    }
}

export async function getEmergencyAlerts(status = null) {
    try {
        let query = supabase
            .from('emergency_alerts')
            .select(`
                *,
                profiles:user_id (
                    first_name,
                    last_name
                )
            `)
            .order('created_at', { ascending: false });
        
        if (status) {
            query = query.eq('status', status);
        }
        
        const { data, error } = await query;
        return { data: data || [], error };
    } catch (error) {
        console.error('Error fetching emergency alerts:', error);
        return { data: [], error };
    }
}

// Community posts functions
export async function getCommunityPosts(postType = null) {
    try {
        let query = supabase
            .from('community_posts')
            .select(`
                *,
                profiles:user_id (
                    first_name,
                    last_name
                ),
                post_comments (
                    id,
                    content,
                    created_at,
                    profiles:user_id (
                        first_name,
                        last_name
                    )
                )
            `)
            .order('created_at', { ascending: false });
        
        if (postType) {
            query = query.eq('post_type', postType);
        }
        
        const { data, error } = await query;
        return { data: data || [], error };
    } catch (error) {
        console.error('Error fetching community posts:', error);
        return { data: [], error };
    }
}

export async function createCommunityPost(postData) {
    if (!currentUser) return { data: null, error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('community_posts')
            .insert({
                ...postData,
                user_id: currentUser.id
            })
            .select(`
                *,
                profiles:user_id (
                    first_name,
                    last_name
                )
            `)
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error creating community post:', error);
        return { data: null, error };
    }
}

export async function addComment(postId, content) {
    if (!currentUser) return { data: null, error: new Error('Not authenticated') };
    
    try {
        const { data, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: currentUser.id,
                content
            })
            .select(`
                *,
                profiles:user_id (
                    first_name,
                    last_name
                )
            `)
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error adding comment:', error);
        return { data: null, error };
    }
}

// Utility functions
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Slide out and remove
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
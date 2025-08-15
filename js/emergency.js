// Emergency functionality
import { createEmergencyAlert, getEmergencyAlerts, getCurrentUser, showNotification } from './supabase-client.js';

// Initialize emergency handlers
document.addEventListener('DOMContentLoaded', () => {
    initializeEmergencyHandlers();
    loadEmergencyAlerts();
});

function initializeEmergencyHandlers() {
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) {
        sosBtn.addEventListener('click', handleSOSClick);
    }
}

async function handleSOSClick() {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please log in to use emergency services', 'warning');
        return;
    }
    
    const sosBtn = document.getElementById('sosBtn');
    sosBtn.classList.add('animate__headShake');
    sosBtn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        sosBtn.classList.remove('animate__headShake');
        sosBtn.style.transform = 'scale(1)';
        showEmergencyModal();
    }, 1000);
}

function showEmergencyModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md mx-4 animate__animated animate__zoomIn">
            <div class="text-center">
                <div class="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="phone-call" class="w-10 h-10 text-white"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Emergency Services</h2>
                <p class="text-gray-600 mb-6">What type of emergency are you experiencing?</p>
                <div class="space-y-3">
                    <button onclick="handleEmergencyType('medical')" class="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors">
                        🚑 Medical Emergency
                    </button>
                    <button onclick="handleEmergencyType('fire')" class="w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                        🔥 Fire Emergency
                    </button>
                    <button onclick="handleEmergencyType('police')" class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                        🚔 Police Emergency
                    </button>
                    <button onclick="handleEmergencyType('other')" class="w-full px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                        ⚠️ Other Emergency
                    </button>
                    <button onclick="closeEmergencyModal()" class="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEmergencyModal();
        }
    });
}

// Make functions global for onclick handlers
window.handleEmergencyType = async function(type) {
    const user = getCurrentUser();
    if (!user) {
        showNotification('Please log in to create emergency alerts', 'error');
        return;
    }
    
    try {
        // Get user location
        const location = await getCurrentLocation();
        
        // Create emergency alert
        const alertData = {
            alert_type: type,
            message: `Emergency alert: ${type}`,
            location_lat: location.latitude,
            location_lng: location.longitude,
            address: location.address || ''
        };
        
        const { data, error } = await createEmergencyAlert(alertData);
        
        if (error) {
            throw error;
        }
        
        showNotification('Emergency alert created! Help is on the way.', 'success');
        
        // Call emergency services
        callEmergencyServices(type);
        
        closeEmergencyModal();
        
    } catch (error) {
        console.error('Error creating emergency alert:', error);
        showNotification('Failed to create emergency alert', 'error');
    }
};

window.closeEmergencyModal = function() {
    const modal = document.querySelector('.fixed.inset-0.z-50');
    if (modal) {
        modal.remove();
    }
};

function callEmergencyServices(type) {
    const numbers = {
        'medical': 'tel:911',
        'fire': 'tel:911',
        'police': 'tel:911',
        'other': 'tel:911'
    };
    
    if (numbers[type]) {
        // In a real app, you might want to show a confirmation dialog
        const confirmCall = confirm('Do you want to call 911 now?');
        if (confirmCall) {
            window.location.href = numbers[type];
        }
    }
}

async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Try to get address from coordinates (you might want to use a geocoding service)
                    const address = await reverseGeocode(latitude, longitude);
                    resolve({ latitude, longitude, address });
                } catch (error) {
                    resolve({ latitude, longitude, address: null });
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                resolve({ latitude: null, longitude: null, address: null });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

async function reverseGeocode(lat, lng) {
    // This is a placeholder - in a real app, you'd use a geocoding service
    // like Google Maps Geocoding API or OpenStreetMap Nominatim
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

async function loadEmergencyAlerts() {
    try {
        const { data: alerts, error } = await getEmergencyAlerts('active');
        
        if (error) {
            console.error('Error loading emergency alerts:', error);
            return;
        }
        
        displayEmergencyAlerts(alerts);
        
    } catch (error) {
        console.error('Error loading emergency alerts:', error);
    }
}

function displayEmergencyAlerts(alerts) {
    // This function would display active emergency alerts on the page
    // You might want to add a dedicated section for this
    if (alerts.length > 0) {
        console.log(`${alerts.length} active emergency alerts in your area`);
    }
}
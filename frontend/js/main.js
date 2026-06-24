const SALON_DATA = [
    {
        id: 'lush-bandra',
        name: 'Lush Salon & Spa',
        type: 'Salon',
        area: 'Linking Road, Bandra West',
        lat: 19.0596,
        lng: 72.8295,
        rating: 4.8,
        reviews: 142,
        services: ['Interview Ready', 'Hair', 'Skin'],
        priceFrom: 1200,
        rushOffer: null,
        homeVisit: false
    },
    {
        id: 'haircraft-andheri',
        name: 'Haircraft Studio',
        type: 'Salon',
        area: 'Andheri West',
        lat: 19.1364,
        lng: 72.8296,
        rating: 4.6,
        reviews: 98,
        services: ['Keratin', 'Hair Spa', 'Color'],
        priceFrom: 2450,
        rushOffer: {
            label: 'Premium Keratin Treatment',
            discountPct: 30,
            originalPrice: 3500,
            rushPrice: 2450,
            endsInMins: 45
        },
        homeVisit: false
    },
    {
        id: 'gentlemans-den-bkc',
        name: "The Gentleman's Den",
        type: 'Salon',
        area: 'Bandra Kurla Complex',
        lat: 19.0669,
        lng: 72.8679,
        rating: 4.7,
        reviews: 112,
        services: ["Men's Grooming", 'Beard', 'Haircut'],
        priceFrom: 899,
        rushOffer: {
            label: 'Executive Haircut + Beard Sculpt + Head Massage',
            discountPct: 40,
            originalPrice: 1500,
            rushPrice: 899,
            endsInMins: 72
        },
        homeVisit: false
    },
    {
        id: 'nail-couture-powai',
        name: 'Nail Couture',
        type: 'Salon',
        area: 'Powai',
        lat: 19.1176,
        lng: 72.9060,
        rating: 4.5,
        reviews: 76,
        services: ['Nails', 'Gel Manicure', 'Pedicure'],
        priceFrom: 1200,
        rushOffer: {
            label: 'Gel Manicure & Pedicure (3 PM - 5 PM)',
            discountPct: 40,
            originalPrice: 2000,
            rushPrice: 1200,
            endsInMins: 125
        },
        homeVisit: false
    },
    {
        id: 'meera-dadar',
        name: 'Meera K.',
        type: 'Freelance Bridal Artist',
        area: 'Dadar',
        lat: 19.0178,
        lng: 72.8478,
        rating: 4.9,
        reviews: 87,
        services: ['Bridal Makeup', 'Wedding Guest', 'Festival Glam'],
        priceFrom: 2200,
        rushOffer: null,
        homeVisit: true
    },
    {
        id: 'rohan-bandra',
        name: 'Rohan S.',
        type: 'Mobile Barber & Grooming',
        area: 'Bandra',
        lat: 19.0550,
        lng: 72.8400,
        rating: 4.7,
        reviews: 112,
        services: ["Men's Grooming", 'Beard Sculpt', 'Facial'],
        priceFrom: 700,
        rushOffer: null,
        homeVisit: true
    },
    {
        id: 'priya-andheri',
        name: 'Priya & Co.',
        type: 'Mehendi Artist',
        area: 'Andheri',
        lat: 19.1197,
        lng: 72.8468,
        rating: 5.0,
        reviews: 34,
        services: ['Mehendi', 'Bridal', 'Festival Glam'],
        priceFrom: 1500,
        rushOffer: null,
        homeVisit: true
    },
    {
        id: 'studioglow-bandra',
        name: 'Studio Glow by Priya',
        type: 'Salon',
        area: 'Bandra West',
        lat: 19.0600,
        lng: 72.8320,
        rating: 4.9,
        reviews: 211,
        services: ['Bridal', 'Party Glam', 'Wedding Guest'],
        priceFrom: 1500,
        rushOffer: null,
        homeVisit: false
    },
    {
        id: 'dermaglow-juhu',
        name: 'Dermaglow Clinic',
        type: 'Skin Clinic',
        area: 'Juhu',
        lat: 19.1075,
        lng: 72.8263,
        rating: 4.6,
        reviews: 64,
        services: ['Skin Prep', 'Facial', 'Consultation'],
        priceFrom: 2500,
        rushOffer: null,
        homeVisit: false
    }
];

/* =====================================================================
   2. GEOLOCATION & MAPS
   ===================================================================== */
const DEFAULT_LOCATION = {
    lat: 19.0596,
    lng: 72.8295,
    label: 'Bandra West (default)'
};

let userLocation = null;
let userLocationLabel = 'Bandra (estimated)';

function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function estimateMinutes(km) {
    const avgSpeedKmh = 18;
    return Math.max(3, Math.round((km / avgSpeedKmh) * 60));
}

function getActiveLocation() {
    return userLocation || DEFAULT_LOCATION;
}

function getUserLocation() {
    const btnText = document.getElementById('locationBtnText');
    const locBtn = btnText ? btnText.closest('button') : null;

    if (!('geolocation' in navigator)) {
        showToast("Your browser doesn't support location. Using Bandra as default.");
        return;
    }

    if (btnText) {
        btnText.textContent = 'Locating...';
    }

    try {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                try {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    userLocationLabel = 'Your current location';
                    if (btnText) {
                        btnText.textContent = 'Location found';
                    }
                    if (locBtn) {
                        locBtn.classList.add('located');
                    }
                    updateLocationBanner();
                    showToast('Location found - showing salons sorted by distance.');
                    renderRushDeals();
                    renderNearbyArtists();
                } catch (innerErr) {
                    console.error('Error processing position:', innerErr);
                    showToast('Could not read your location. Using default area.');
                }
            },
            (error) => {
                if (btnText) {
                    btnText.textContent = 'Use My Location';
                }
                let msg = 'Could not access location. Using Bandra as default.';
                if (error.code === error.PERMISSION_DENIED) {
                    msg = 'Location access denied. Using Bandra as default.';
                } else if (error.code === error.TIMEOUT) {
                    msg = 'Location request timed out. Using Bandra as default.';
                }
                showToast(msg);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    } catch (err) {
        console.error('Geolocation call failed:', err);
        showToast('Location lookup failed. Using Bandra as default.');
    }
}

function updateLocationBanner() {
    const banner = document.getElementById('locationBanner');
    if (!banner) {
        return;
    }
    banner.textContent = userLocation
        ? 'LIVE NEAR YOU - MUMBAI'
        : 'LIVE ACROSS 14 MUMBAI NEIGHBOURHOODS';
}

window.openDirections = function(placeName, destLat, destLng) {
    const loc = getActiveLocation();
    const origin = `${loc.lat},${loc.lng}`;
    const url = `http://googleusercontent.com/maps.google.com/?saddr=${origin}&daddr=${destLat},${destLng}`;
    showToast(`Opening directions to ${placeName}...`);
    window.open(url, '_blank', 'noopener');
};

function openDirectionsByName(placeName, areaText) {
    const query = encodeURIComponent(`${placeName}, ${areaText}`);
    const url = `http://googleusercontent.com/maps.google.com/?q=${query}`;
    showToast(`Opening directions to ${placeName}...`);
    window.open(url, '_blank', 'noopener');
}

/* =====================================================================
   3. TAB SWITCHING
   ===================================================================== */
window.switchTab = function(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active', 'text-coral', 'border-b-2', 'border-coral'));

    const selectedContent = document.getElementById('tab-' + tabName);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }

    document.querySelectorAll(`button[onclick*="switchTab('${tabName}')"]`).forEach(btn => {
        if (btn.classList.contains('tab-btn')) {
            btn.classList.add('active', 'text-coral', 'border-b-2', 'border-coral');
        }
    });

    if (tabName === 'rush') {
        renderRushDeals();
    }
    if (tabName === 'artists') {
        renderNearbyArtists();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* =====================================================================
   4. MOBILE HAMBURGER MENU
   ===================================================================== */
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const burger = document.getElementById('hamburger');
    const isOpen = menu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        const menu = document.getElementById('mobile-menu');
        const burger = document.getElementById('hamburger');
        if (menu && menu.classList.contains('open')) {
            menu.classList.remove('open');
            burger.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
        }
    }
});

/* =====================================================================
   5. TOAST NOTIFICATIONS
   ===================================================================== */
window.showToast = function(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3000);
};

window.handleGetApp = function() {
    showToast('App store download links coming soon!');
};

/* =====================================================================
   6. DYNAMIC RENDERING
   ===================================================================== */
function locationPinSvg() {
    return `<svg class="w-4 h-4 mr-1 text-coral flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>`;
}

function starSvg(cls) {
    return `<svg class="${cls || 'w-4 h-4 mr-1'}" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
    </svg>`;
}

function formatMinsLeft(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function escapeJs(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function renderRushDeals() {
    const container = document.getElementById('rushDealsContainer');
    if (!container) {
        return;
    }

    const loc = getActiveLocation();
    const deals = SALON_DATA
        .filter(s => s.rushOffer)
        .map(s => ({ ...s, _km: distanceKm(loc.lat, loc.lng, s.lat, s.lng) }))
        .sort((a, b) => a._km - b._km);

    if (deals.length === 0) {
        container.innerHTML = `<p class="text-gray-text col-span-full text-center py-8">No rush deals live right now.</p>`;
        return;
    }

    container.innerHTML = deals.map(s => {
        const offer = s.rushOffer;
        return `
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-card border border-gray-100 hover:border-coral transition-all">
            <div class="flex items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span class="text-xs font-bold text-red-500 uppercase tracking-wider">Ends in ${formatMinsLeft(offer.endsInMins)}</span>
                </div>
                <span class="distance-pill px-2 py-1 bg-gray-100 text-xs font-semibold rounded">${s._km.toFixed(1)} km</span>
            </div>
            <h3 class="text-lg md:text-xl font-bold text-dark mb-1">${s.name}</h3>
            <button onclick="openDirections('${escapeJs(s.name)}', ${s.lat}, ${s.lng})" class="flex items-center text-sm text-gray-text mb-4 hover:text-coral hover:underline transition-colors">
                ${locationPinSvg()} ${s.area}
            </button>
            <div class="mb-4 flex items-baseline flex-wrap gap-2">
                <span class="text-xl md:text-2xl font-bold text-dark">₹${offer.rushPrice.toLocaleString('en-IN')}</span>
                <span class="text-sm text-gray-text line-through">₹${offer.originalPrice.toLocaleString('en-IN')}</span>
                <span class="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded">${offer.discountPct}% OFF</span>
            </div>
            <p class="text-sm text-gray-700 mb-5">${offer.label}</p>
            <button onclick="openBookingModal('${escapeJs(s.name)} - Rush Deal')" class="w-full bg-coral text-white py-3 rounded-lg font-bold hover:bg-coral-hover transition-colors">Claim Slot</button>
        </div>`;
    }).join('');
}

function renderNearbyArtists() {
    const container = document.getElementById('nearbyContainer');
    if (!container) {
        return;
    }

    const loc = getActiveLocation();
    const ranked = SALON_DATA
        .map(s => ({ ...s, _km: distanceKm(loc.lat, loc.lng, s.lat, s.lng) }))
        .sort((a, b) => a._km - b._km);

    container.innerHTML = ranked.map(s => {
        const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const mins = estimateMinutes(s._km);
        return `
        <div class="artist-card bg-white rounded-2xl p-6 shadow-card border border-gray-100 transition-all duration-300 cursor-pointer hover:border-teal" onclick="openProfileModal('${escapeJs(s.name)}','${escapeJs(s.type)}','${escapeJs(s.area)}','${s.rating}','${s.reviews}')">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">${initials}</div>
                    <div>
                        <h3 class="font-bold text-dark">${s.name}</h3>
                        <div class="flex items-center text-xs text-gray-text">${starSvg('w-3 h-3 mr-1 text-coral')}${s.rating} (${s.reviews} reviews)</div>
                    </div>
                </div>
                <span class="distance-pill px-2 py-1 bg-gray-100 text-xs font-semibold rounded">${s._km.toFixed(1)} km · ${mins}m</span>
            </div>
            <div class="mb-4 flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-teal/30 text-dark text-xs font-semibold rounded">${s.type}</span>
                <span class="px-2 py-1 bg-cream text-dark text-xs font-semibold rounded">${s.area}</span>
                ${s.homeVisit ? '<span class="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded">Home Visit</span>' : ''}
            </div>
            <p class="text-sm text-gray-text mb-4">Specializes in ${s.services.slice(0, 2).join(' & ')}. From ₹${s.priceFrom.toLocaleString('en-IN')}.</p>
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                <button onclick="event.stopPropagation(); openDirections('${escapeJs(s.name)}', ${s.lat}, ${s.lng})" class="flex items-center gap-1 text-sm font-semibold text-dark hover:text-coral transition-colors">
                    ${locationPinSvg()} Get Directions
                </button>
                <button onclick="event.stopPropagation(); openProfileModal('${escapeJs(s.name)}','${escapeJs(s.type)}','${escapeJs(s.area)}','${s.rating}','${s.reviews}')" class="text-coral font-semibold text-sm hover:underline">View Profile</button>
            </div>
        </div>`;
    }).join('');
}

function animateCount(elId, target, duration) {
    const el = document.getElementById(elId);
    if (!el) {
        return;
    }
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        el.textContent = Math.round(start + (target - start) * progress);
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }
    requestAnimationFrame(tick);
}

window.showOccasionResult = function(occasion) {
    const resultDiv = document.getElementById('occasion-result');
    if (!resultDiv) {
        return;
    }

    const loc = getActiveLocation();
    const ranked = SALON_DATA
        .map(s => ({ ...s, _km: distanceKm(loc.lat, loc.lng, s.lat, s.lng) }))
        .sort((a, b) => a._km - b._km);

    const top = ranked[0];
    const fitPct = 90 + Math.floor(Math.random() * 9);

    resultDiv.innerHTML = `
        <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-teal rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
                <h3 class="text-lg md:text-xl font-bold text-dark">Top Recommendation for <span class="text-coral">${occasion}</span></h3>
                <p class="text-sm text-gray-text">Based on ${userLocation ? 'your current location' : 'Bandra (default area)'} and high urgency.</p>
            </div>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
            <div class="border border-gray-200 rounded-xl p-5 hover:border-coral transition-colors cursor-pointer" onclick="openBookingModal('${escapeJs(top.name)} - ${escapeJs(occasion)}')">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-lg">${top.name}</h4>
                    <span class="px-2 py-1 bg-teal text-xs font-bold rounded text-dark">${fitPct}% FIT</span>
                </div>
                <button onclick="event.stopPropagation(); openDirections('${escapeJs(top.name)}', ${top.lat}, ${top.lng})" class="flex items-center text-sm text-gray-text mb-3 hover:text-coral hover:underline transition-colors">
                    ${locationPinSvg()} ${top.area} · ${top._km.toFixed(1)} km away
                </button>
                <div class="flex items-center gap-4 text-sm text-gray-700 mb-4">
                    <span class="flex items-center">${starSvg('w-4 h-4 mr-1 text-coral')} ${top.rating} (${top.reviews})</span>
                    <span class="flex items-center"><svg class="w-4 h-4 mr-1 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Today, 4:00 PM</span>
                </div>
                <button class="w-full bg-coral text-white py-2 rounded-lg font-semibold hover:bg-coral-hover transition-colors">Book Instantly</button>
            </div>
            <div class="bg-cream p-5 rounded-xl border border-gray-100">
                <h5 class="font-bold text-dark mb-2">AI Reasoning:</h5>
                <ul class="text-sm text-gray-text space-y-2">
                    <li class="flex items-start"><span class="text-coral mr-2 font-bold">1.</span> Specializes in ${top.services.join(', ')}.</li>
                    <li class="flex items-start"><span class="text-coral mr-2 font-bold">2.</span> Closest match at ${top._km.toFixed(1)} km - about ${estimateMinutes(top._km)} min away.</li>
                    <li class="flex items-start"><span class="text-coral mr-2 font-bold">3.</span> Rated ${top.rating} across ${top.reviews} reviews, from ₹${top.priceFrom.toLocaleString('en-IN')}.</li>
                </ul>
            </div>
        </div>`;

    resultDiv.classList.remove('hidden');
    setTimeout(() => resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
};

window.toggleVibe = function(el) {
    el.classList.toggle('bg-coral');
    el.classList.toggle('border-coral');
    if (el.classList.contains('bg-coral')) {
        el.classList.remove('text-dark', 'bg-cream');
        el.classList.add('text-white');
    } else {
        el.classList.remove('text-white');
        el.classList.add('text-dark', 'bg-cream');
    }
};

/* =====================================================================
   7. HERO CARD ROTATION
   ===================================================================== */
let _heroCardIdx = 0;
let _heroInterval = null;

function startHeroRotation() {
    const cards = document.querySelectorAll('.hero-rotating-card');
    if (cards.length < 2) {
        return;
    }
    _heroInterval = setInterval(() => {
        cards[_heroCardIdx].classList.remove('active');
        cards[_heroCardIdx].classList.add('inactive');
        _heroCardIdx = (_heroCardIdx + 1) % cards.length;
        cards[_heroCardIdx].classList.remove('inactive');
        cards[_heroCardIdx].classList.add('active');
    }, 7000);
}

/* =====================================================================
   8. MODALS & DYNAMIC PRICING
   ===================================================================== */
let currentBookingBasePrice = 1500;
const PLATFORM_FEE = 49;

window.openLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 50);
    }
};

window.closeLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
};

window.showLoginStep = function(step) {
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById(`login-step-${i}`);
        if (el) el.classList.add('hidden');
    }
    const target = document.getElementById(`login-step-${step}`);
    if (target) target.classList.remove('hidden');
};

window.openBookingModal = function(serviceName) {
    const nameEl = document.getElementById('booking-service-name');
    if (nameEl) nameEl.textContent = `Booking: ${serviceName}`;

    // Dynamically calculate base price based on salon data
    let basePrice = 1500; // Default fallback
    const matchedSalon = SALON_DATA.find(s => serviceName.includes(s.name));
    
    if (matchedSalon) {
        // Apply discounted rush price if it's a rush deal
        if (serviceName.toLowerCase().includes('rush') && matchedSalon.rushOffer) {
            basePrice = matchedSalon.rushOffer.rushPrice;
        } else {
            basePrice = matchedSalon.priceFrom;
        }
    }
    
    currentBookingBasePrice = basePrice;

    const modal = document.getElementById('booking-modal');
    if (modal) {
        // Find the package selection dropdown precisely
        const packageSelect = Array.from(modal.querySelectorAll('select')).find(sel => {
            return Array.from(sel.options).some(opt => opt.text.toLowerCase().includes('premium') || opt.text.toLowerCase().includes('bridal'));
        });

        if (packageSelect) {
            // Reset to first option (Standard package) when opening modal
            packageSelect.selectedIndex = 0;
            
            // Remove any old event listeners to prevent duplication, then add the clean updater
            packageSelect.removeEventListener('change', window.updateBookingUI);
            packageSelect.addEventListener('change', window.updateBookingUI);
        }
        
        // Trigger UI price recalculation immediately upon opening
        window.updateBookingUI();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 50);
    }
};

window.openBookingModal = function(serviceName) {
    const nameEl = document.getElementById('booking-service-name');
    if (nameEl) nameEl.textContent = `Booking: ${serviceName}`;

    // Dynamically calculate base price based on salon data
    let basePrice = 1500; // Default fallback
    const matchedSalon = SALON_DATA.find(s => serviceName.includes(s.name));
    
    if (matchedSalon) {
        // Apply discounted rush price if it's a rush deal
        if (serviceName.toLowerCase().includes('rush') && matchedSalon.rushOffer) {
            basePrice = matchedSalon.rushOffer.rushPrice;
        } else {
            basePrice = matchedSalon.priceFrom;
        }
    }
    
    currentBookingBasePrice = basePrice;

    const modal = document.getElementById('booking-modal');
    if (modal) {
        // Target ALL dropdown select elements inside the modal to guarantee click detection
        const selects = modal.querySelectorAll('select');
        selects.forEach(select => {
            // Clean up any old listeners and attach fresh live ones
            select.removeEventListener('change', window.updateBookingUI);
            select.addEventListener('change', window.updateBookingUI);
            
            // If this is the package selection box, reset it to Standard initially
            if (Array.from(select.options).some(opt => opt.text.toLowerCase().includes('premium') || opt.text.toLowerCase().includes('bridal'))) {
                select.selectedIndex = 0;
            }
        });
        
        // Trigger calculation immediately upon opening the modal
        window.updateBookingUI();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 50);
    }
};

window.updateBookingUI = function() {
    const modal = document.getElementById('booking-modal');
    if (!modal) return;
    
    let extra = 0;
    
    // Look through all active selections across the form fields
    const selects = modal.querySelectorAll('select');
    selects.forEach(select => {
        if (select.selectedIndex !== -1) {
            const selectedText = select.options[select.selectedIndex].text.toLowerCase();
            const selectedValue = select.value.toLowerCase();
            
            if (selectedText.includes('500') || selectedValue.includes('500') || selectedText.includes('premium')) {
                extra = 500;
            } else if (selectedText.includes('1500') || selectedValue.includes('1500') || selectedText.includes('bridal')) {
                extra = 1500;
            }
        }
    });
    
    const serviceTotal = currentBookingBasePrice + extra;
    const finalTotal = serviceTotal + PLATFORM_FEE;
    
    // Select all text elements to dynamically match price summary tags
    const allSpans = Array.from(modal.querySelectorAll('span'));
    
    allSpans.forEach(span => {
        const text = span.textContent.trim().toLowerCase();
        const parent = span.parentElement;
        if (!parent) return;
        
        // Updates the Row for the Final Total Amount
        if (text === 'total' || text === 'total amount') {
            const priceSpan = parent.querySelector('span:last-child');
            if (priceSpan) priceSpan.textContent = '₹' + finalTotal.toLocaleString('en-IN');
        }
        
        // Updates the Row for the Base Service Charge
        if (text === 'service' || text === 'base price' || text === 'service cost') {
            const priceSpan = parent.querySelector('span:last-child');
            if (priceSpan) priceSpan.textContent = '₹' + serviceTotal.toLocaleString('en-IN');
        }
        
        // Updates the Row for the fixed Platform Fees
        if (text === 'platform fee' || text === 'taxes & fees') {
            const priceSpan = parent.querySelector('span:last-child');
            if (priceSpan) priceSpan.textContent = '₹' + PLATFORM_FEE;
        }
    });
};
window.closeBookingModal = function() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
};

window.handleBookingSubmit = function(e) {
    e.preventDefault();
    closeBookingModal();
    showToast('Booking Confirmed! You will receive an SMS shortly.');
};

window.openProfileModal = function(name, title, location, rating, reviews) {
    document.getElementById('profile-title').textContent = name;
    document.getElementById('profile-specialty').textContent = title;
    document.getElementById('profile-location').textContent = location;
    document.getElementById('profile-rating').textContent = rating;
    document.getElementById('profile-reviews').textContent = reviews;
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profile-avatar-box').textContent = initials;

    const bookBtn = document.getElementById('profile-modal-book-btn');
    if(bookBtn) {
        bookBtn.onclick = () => {
            closeProfileModal();
            openBookingModal(name);
        };
    }

    const mapBtn = document.getElementById('profile-modal-direction-btn');
    if(mapBtn) {
        mapBtn.onclick = () => {
            const salon = SALON_DATA.find(s => s.name === name);
            if(salon) {
                openDirections(name, salon.lat, salon.lng);
            } else {
                openDirectionsByName(name, location);
            }
        };
    }

    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('.transform').classList.remove('scale-95');
        }, 50);
    }
};

window.closeProfileModal = function() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.transform').classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') {
        return;
    }
    closeLoginModal();
    closeBookingModal();
    closeProfileModal();
});

/* =====================================================================
   9. GOOGLE IDENTITY SERVICES (OAuth 2.0)
   ===================================================================== */
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';
let _googleInitialized = false;

function initGoogleAuth() {
    if (_googleInitialized || typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
    if (GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_OAUTH_CLIENT_ID')) return;

    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        google.accounts.id.renderButton(document.querySelector('.g_id_signin'), {
            type: 'standard',
            theme: 'outline',
            size: 'large'
        });
        _googleInitialized = true;
    } catch (err) {
        console.error('Google Identity Services init failed:', err);
    }
}

window.handleGoogleCredential = function(response) {
    try {
        const payload = decodeJwt(response.credential);
        showToast(`Signed in securely as ${payload.name || payload.email}`);
        closeLoginModal();
    } catch (err) {
        console.error('Credential decode failed:', err);
        showToast('Sign-in failed - try again.');
    }
};

function decodeJwt(jwt) {
    const base64Url = jwt.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonStr);
}

/* =====================================================================
   10. AI STYLE FINDER 
   ===================================================================== */
let currentStream   = null;
let currentFacingMode = "user";
let selectedGender  = null;
let selectedStyles  = { beard: null, moustache: null, hair: null, nails: null };

function getCanvas() { return document.getElementById("sf-canvas"); }
function getCtx() { const c = getCanvas(); return c ? c.getContext("2d") : null; }

const STYLE_DATA = {
    male: {
        "Beard Styles": ["Full Beard","Corporate Beard","Goatee","Balbo","Van Dyke","Light Stubble","Heavy Stubble","Ducktail","Short Boxed Beard"],
        "Moustache Styles": ["Chevron","Handlebar","Walrus","Pencil Mustache","Natural Mustache","Bushy Mustache","Dali"],
        "Hairstyles": ["Buzz Cut","Crew Cut","Side Part","Pompadour","Quiff","Low Fade","Mid Fade","French Crop","Curtains","Man Bun"]
    },
    female: {
        "Hairstyles": ["Pixie Cut","Classic Bob","Lob","Butterfly Cut","Layered Long Hair","Curtain Bangs","Loose Waves","High Ponytail","Messy Bun","Bridal Updo"],
        "Nail Styles": ["French Manicure","Glazed Donut Nails","Aura Nails","Milky Nails","Ombré Nails","Marble Nails","Floral Nails","Chrome Nails","Nude Nails","Rhinestone Nails"]
    }
};

const FACE_RECS = {
    Oval:    { beard:"Corporate Beard",  moustache:"Chevron",     hair_m:"Modern Pompadour", hair_f:"Beach Waves",       nails:"Almond" },
    Round:   { beard:"Short Boxed Beard",moustache:"Handlebar",   hair_m:"High Fade",        hair_f:"Layered Long Hair", nails:"Stiletto" },
    Square:  { beard:"Ducktail",         moustache:"Pencil Mustache",hair_m:"Textured Quiff",hair_f:"Curtain Bangs",    nails:"Oval" },
    Heart:   { beard:"Goatee",           moustache:"Walrus",       hair_m:"Curtains",         hair_f:"Classic Bob",      nails:"Coffin" },
    Oblong:  { beard:"Mutton Chops",     moustache:"Bushy Mustache",hair_m:"Crew Cut",        hair_f:"Full Bangs",       nails:"Square" },
    Diamond: { beard:"Chin Strap",       moustache:"Natural Mustache",hair_m:"Comb Over",    hair_f:"Half-Up Half-Down",nails:"Round" }
};

window.sfGoToStep = function(step) {
    const steps = ["gender", "options", "groups", "nails", "upload", "result"];
    steps.forEach(s => {
        const el = document.getElementById("sf-step-" + s);
        if (el) el.classList.toggle("hidden", s !== step);
    });
    if (step === 'options') renderOptions();
    if (step !== "upload") sfCloseCamera();
};

window.sfBackTo = function(step) { sfGoToStep(step); };

window.sfBackToPreviousPicker = function() {
    if (selectedStyles.nails !== null) sfGoToStep("nails");
    else sfGoToStep("groups");
};

window.sfSkipToUpload = function() { sfGoToStep("upload"); };

window.sfSelectGender = function(gender) {
    selectedGender = gender;
    selectedStyles = { beard: null, moustache: null, hair: null, nails: null };
    document.querySelectorAll(".sf-gender-btn").forEach(btn => btn.classList.remove('border-coral'));
    event.currentTarget.classList.add('border-coral');
    sfGoToStep("options");
};

function renderOptions() {
    const container = document.getElementById("sf-options-grid");
    if (!container || !selectedGender) return;
    container.innerHTML = "";

    const data = STYLE_DATA[selectedGender];
    Object.keys(data).forEach(type => {
        const btn = document.createElement("button");
        btn.className = "p-4 border-2 border-gray-100 rounded-xl hover:border-coral hover:bg-cream/40 transition-all text-center group bg-white";
        
        let emoji = "💇";
        if (type.toLowerCase().includes("beard")) emoji = "🧔";
        if (type.toLowerCase().includes("moustache")) emoji = "👨";
        if (type.toLowerCase().includes("nail")) emoji = "💅";

        btn.innerHTML = `
            <div class="w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-2 text-coral group-hover:scale-110 transition-transform text-2xl">${emoji}</div>
            <span class="font-semibold text-dark block text-sm md:text-base">${type}</span>
        `;
        
        btn.onclick = () => {
            const cat = type.toLowerCase().includes("beard") ? "beard" :
                        type.toLowerCase().includes("moustache") ? "moustache" :
                        type.toLowerCase().includes("nail") ? "nails" : "hair";
            
            if (cat === 'nails') sfGoToStep('nails');
            else {
                sfPopulateAccordionStyles(cat, type);
                sfGoToStep('groups');
            }
        };
        container.appendChild(btn);
    });
}

function sfPopulateAccordionStyles(categoryKey, displayTitle) {
    const acc = document.getElementById('sf-groups-accordion');
    const titleElem = document.getElementById('sf-groups-title');
    if (!acc || !titleElem) return;

    titleElem.textContent = `Choose your ${displayTitle}`;
    const styles = STYLE_DATA[selectedGender][displayTitle];
    
    acc.innerHTML = styles.map((style, idx) => {
        const group = idx < 3 ? "Trending Now" : (idx < 6 ? "Classic" : "Avant-Garde");
        return `
        <div class="border border-gray-100 rounded-xl p-3.5 bg-gray-50/50 hover:bg-cream/20 cursor-pointer transition-colors flex justify-between items-center" onclick="sfSelectStyleNode('${categoryKey}', '${escapeJs(style)}')">
            <div>
                <span class="text-[10px] font-extrabold text-coral uppercase tracking-wider">${group}</span>
                <h4 class="font-bold text-dark text-sm mt-0.5">${style}</h4>
            </div>
            <span class="text-coral font-bold text-sm">Select →</span>
        </div>`;
    }).join('');
}

window.sfSelectStyleNode = function(categoryKey, styleTitle) {
    selectedStyles[categoryKey] = styleTitle;
    showToast(`${styleTitle} selected.`);
    sfGoToStep("upload");
};

const AR = {
    beard(ctx, box, styleName) {
        const { x, y, w, h } = box;
        const cx = x + w / 2;
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = "#2C1810";
        const s = (styleName||"").toLowerCase();

        if (s.includes("stubble")) {
            ctx.globalAlpha = 0.35;
            for (let i = 0; i < 420; i++) {
                const px = cx + (Math.random() - 0.5) * w * 0.82;
                const py = y + h * 0.52 + Math.random() * h * 0.36;
                ctx.beginPath(); ctx.arc(px, py, 0.9 + Math.random(), 0, Math.PI * 2); ctx.fill();
            }
        } else if (s.includes("goatee")) {
            ctx.globalAlpha = 0.68;
            ctx.beginPath(); ctx.ellipse(cx, y + h * 0.77, w * 0.14, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
        } else {
            const beardH = h * 0.36;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.38, y + h * 0.56);
            ctx.bezierCurveTo(cx - w * 0.42, y + h * 0.62, cx - w * 0.38, y + h * 0.56 + beardH, cx, y + h * 0.56 + beardH * 1.05);
            ctx.bezierCurveTo(cx + w * 0.38, y + h * 0.56 + beardH, cx + w * 0.42, y + h * 0.62, cx + w * 0.38, y + h * 0.56);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    },
    moustache(ctx, box, styleName) {
        const { x, y, w, h } = box;
        const cx = x + w / 2;
        const my = y + h * 0.585;
        ctx.save();
        ctx.fillStyle = "#2C1810";
        ctx.globalAlpha = 0.72;
        const s = (styleName||"").toLowerCase();

        if (s.includes("handlebar")) {
            ctx.beginPath();
            ctx.moveTo(cx, my);
            ctx.bezierCurveTo(cx - w * 0.08, my - h * 0.025, cx - w * 0.24, my - h * 0.018, cx - w * 0.30, my + h * 0.025);
            ctx.bezierCurveTo(cx - w * 0.35, my + h * 0.055, cx - w * 0.28, my + h * 0.06, cx - w * 0.22, my + h * 0.018);
            ctx.bezierCurveTo(cx - w * 0.12, my - h * 0.005, cx, my, cx, my);
            ctx.closePath(); ctx.fill();
            ctx.save(); ctx.scale(-1, 1); ctx.translate(-2 * cx, 0); ctx.fill(); ctx.restore();
        } else if (s.includes("pencil")) {
            ctx.globalAlpha = 0.65;
            ctx.fillRect(cx - w * 0.18, my - h * 0.008, w * 0.36, h * 0.018);
        } else {
            ctx.beginPath(); ctx.ellipse(cx, my, w * 0.22, h * 0.038, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    },
    hair_male(ctx, box, styleName) {
        const { x, y, w, h } = box;
        const cx = x + w / 2;
        ctx.save();
        ctx.fillStyle = "#1A0F0A";
        ctx.globalAlpha = 0.68;
        const s = (styleName||"").toLowerCase();

        if (s.includes("buzz")) {
            ctx.globalAlpha = 0.28;
            ctx.beginPath(); ctx.ellipse(cx, y + h * 0.02, w * 0.52, h * 0.16, 0, Math.PI, 0, true); ctx.fill();
        } else if (s.includes("pompadour")) {
            ctx.beginPath(); ctx.ellipse(cx, y - h * 0.10, w * 0.45, h * 0.22, 0, Math.PI, 0, true); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx - w * 0.08, y - h * 0.18, w * 0.28, h * 0.14, -0.3, Math.PI, 0, true); ctx.fill();
        } else {
            ctx.beginPath(); ctx.ellipse(cx - w * 0.06, y - h * 0.03, w * 0.50, h * 0.16, 0, Math.PI, 0, true); ctx.fill();
        }
        ctx.restore();
    },
    hair_female(ctx, box, styleName) {
        const { x, y, w, h } = box;
        const cx = x + w / 2;
        ctx.save();
        ctx.fillStyle = "#1A0F0A";
        ctx.globalAlpha = 0.65;
        const s = (styleName||"").toLowerCase();

        if (s.includes("bob")) {
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.54, y + h * 0.12);
            ctx.bezierCurveTo(cx - w * 0.54, y + h * 0.55, cx - w * 0.48, y + h * 0.62, cx, y + h * 0.64);
            ctx.bezierCurveTo(cx + w * 0.48, y + h * 0.62, cx + w * 0.54, y + h * 0.55, cx + w * 0.54, y + h * 0.12);
            ctx.bezierCurveTo(cx + w * 0.38, y - h * 0.08, cx - w * 0.38, y - h * 0.08, cx - w * 0.54, y + h * 0.12);
            ctx.closePath(); ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.54, y + h * 0.10);
            ctx.lineTo(cx - w * 0.56, y + h * 0.88);
            ctx.bezierCurveTo(cx - w * 0.40, y + h * 0.94, cx, y + h * 0.96, cx + w * 0.40, y + h * 0.94);
            ctx.lineTo(cx + w * 0.56, y + h * 0.88);
            ctx.bezierCurveTo(cx + w * 0.38, y - h * 0.06, cx - w * 0.38, y - h * 0.06, cx - w * 0.54, y + h * 0.10);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    },
    nails(ctx, box, styleName) {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;
        ctx.save();

        const s = (styleName||"").toLowerCase();
        let baseColor   = "#F5ECE5";
        let accentColor = null;

        if (s.includes("french")) { baseColor = "#FFF5EE"; accentColor = "#FFFFFF"; }
        else if (s.includes("chrome")) { baseColor = "#D8D8E8"; }
        else if (s.includes("glitter")) { baseColor = "#E8C547"; }
        else if (s.includes("aura")) { baseColor = "#C7B8EA"; }
        else if (s.includes("matte")) { baseColor = "#E8DDD5"; }

        const nailW  = cw * 0.065;
        const nailH  = nailW * 1.55;
        const startX = cw * 0.18;
        const baseY  = ch * 0.82;
        const gaps   = cw * 0.075;

        for (let i = 0; i < 5; i++) {
            const nx = startX + i * (nailW + gaps);
            const ny = baseY - nailH;

            ctx.fillStyle = "#F0C8A0";
            ctx.globalAlpha = 0.50;
            ctx.fillRect(nx - nailW * 0.15, ny + nailH * 0.55, nailW * 1.3, nailH * 0.88);

            ctx.globalAlpha = 0.90;
            ctx.fillStyle = baseColor;
            ctx.fillRect(nx, ny, nailW, nailH); 

            if (accentColor) {
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = 0.88;
                ctx.fillRect(nx, ny, nailW, nailH * 0.24);
            }

            ctx.globalAlpha = 0.22;
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.ellipse(nx + nailW * 0.28, ny + nailH * 0.28, nailW * 0.12, nailH * 0.22, -0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
};

function estimateFaceBox(imgW, imgH) {
    const bw = imgW * 0.54;
    const bh = imgH * 0.58;
    const bx = (imgW - bw) / 2;
    const by = imgH * 0.07;
    return { x: bx, y: by, w: bw, h: bh };
}

function sfRunPipeline(imageSrc) {
    const canvas      = getCanvas();
    const ctx         = getCtx();
    const analyzingEl = document.getElementById("sf-analyzing");
    const analyzingTx = document.getElementById("sf-analyzing-text");

    if (!canvas || !ctx) {
        showToast("Canvas not available — please refresh and try again.");
        return;
    }

    sfGoToStep("result");
    if (analyzingEl) analyzingEl.style.display = "flex";

    const img = new Image();
    img.onload = () => {
        const maxW = canvas.parentElement ? canvas.parentElement.clientWidth  : 420;
        const maxH = canvas.parentElement ? canvas.parentElement.clientHeight : 560;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scanStates = ["Analyzing facial geometry...", "Mapping feature landmarks...", "Evaluating style zones...", "Generating recommendation..."];
        let i = 0;
        const tick = setInterval(() => {
            if (analyzingTx) analyzingTx.textContent = scanStates[i] || "Processing...";
            i++;
            if (i >= scanStates.length) {
                clearInterval(tick);
                const faceBox = estimateFaceBox(canvas.width, canvas.height);
                const isNails = selectedStyles.nails !== null;

                if (!isNails) {
                    if (selectedStyles.hair || selectedGender) {
                        const hairStyle = selectedStyles.hair || (selectedGender === "male" ? "Textured Crop" : "Beach Waves");
                        if (selectedGender === "male") AR.hair_male(ctx, faceBox, hairStyle);
                        else AR.hair_female(ctx, faceBox, hairStyle);
                    }
                    if (selectedStyles.beard) AR.beard(ctx, faceBox, selectedStyles.beard);
                    if (selectedStyles.moustache) AR.moustache(ctx, faceBox, selectedStyles.moustache);
                } else {
                    AR.nails(ctx, faceBox, selectedStyles.nails);
                }

                if (analyzingEl) analyzingEl.style.display = "none";
                sfShowResults(faceBox);
            }
        }, 750);
    };
    img.onerror = () => {
        if (analyzingEl) analyzingEl.style.display = "none";
        showToast("Could not load that image — please try another photo.");
        sfGoToStep("upload");
    };
    img.src = imageSrc;
}

function sfShowResults(faceBox) {
    const shapes = ["Oval","Round","Square","Heart","Oblong","Diamond"];
    const detectedShape = shapes[Math.floor(Math.random() * shapes.length)];
    const recs = FACE_RECS[detectedShape] || FACE_RECS["Oval"];

    const isNails = selectedStyles.nails !== null;
    let mainStyle, reason;

    if (isNails) {
        mainStyle = selectedStyles.nails;
        reason    = `${mainStyle} suits your nail bed proportions and is trending for ${detectedShape.toLowerCase()}-shaped hands this season in Mumbai.`;
    } else if (selectedGender === "male") {
        mainStyle = selectedStyles.beard || selectedStyles.moustache || selectedStyles.hair || recs.beard;
        reason    = `Based on your detected ${detectedShape} face shape: ${recs.beard} for beard, ${recs.moustache} for moustache, and ${recs.hair_m} for hair are the strongest matches.`;
    } else {
        mainStyle = selectedStyles.hair || recs.hair_f;
        reason    = `${mainStyle} flatters ${detectedShape} face shapes — it adds the right balance of width and length for your proportions.`;
    }

    const titleEl  = document.getElementById("sf-result-title");
    const reasonEl = document.getElementById("sf-result-reason");
    const tagsEl   = document.getElementById("sf-result-tags");

    if (titleEl)  titleEl.textContent  = `Recommended: ${mainStyle}`;
    if (reasonEl) reasonEl.textContent = reason;
    if (tagsEl) {
        tagsEl.innerHTML = `
            <div class="flex flex-wrap gap-2 text-xs text-gray-600">
                <span class="px-2 py-1 bg-gray-100 rounded border border-gray-200">Face shape: ${detectedShape}</span>
                <span class="px-2 py-1 bg-gray-100 rounded border border-gray-200">AR overlay applied</span>
            </div>`;
    }
}

window.sfHandleFileSelect = function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        showToast("Please select an image file (JPG, PNG, etc.)");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => { sfRunPipeline(e.target.result); };
    reader.onerror = () => showToast("Could not read that file.");
    reader.readAsDataURL(file);
    event.target.value = "";
};

window.sfCapturePhoto = function() {
    const video = document.getElementById("sf-camera-video");
    if (!video || !video.videoWidth) {
        showToast("Camera is still starting up — wait a moment.");
        return;
    }
    const tmp = document.createElement("canvas");
    tmp.width  = video.videoWidth;
    tmp.height = video.videoHeight;
    tmp.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = tmp.toDataURL("image/jpeg", 0.92);
    sfCloseCamera();
    sfRunPipeline(dataUrl);
};

window.sfOpenCamera = async function() {
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());
    const wrap    = document.getElementById("sf-camera-wrap");
    const errorEl = document.getElementById("sf-camera-error");
    if (errorEl) errorEl.classList.add("hidden");
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errorEl) { errorEl.textContent = 'Camera not supported by browser. Use "Browse Files".'; errorEl.classList.remove("hidden"); }
        return;
    }
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: false });
        const video = document.getElementById("sf-camera-video");
        if (video) { 
            video.srcObject = currentStream; 
            if (wrap) wrap.classList.remove("hidden"); 
        }
    } catch (err) {
        if (errorEl) { 
            errorEl.textContent = "Camera access denied or unavailable. Use 'Browse Files'."; 
            errorEl.classList.remove("hidden"); 
        }
    }
};

window.sfSwitchCamera = function() {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    sfOpenCamera();
};

window.sfCloseCamera = function() {
    if (currentStream) { 
        currentStream.getTracks().forEach(t => t.stop()); 
        currentStream = null; 
    }
    const wrap = document.getElementById("sf-camera-wrap");
    if (wrap) wrap.classList.add("hidden");
};

function goToProvider() {
    window.location.href = "/provider.html";
}

/* =====================================================================
   11. INITIALIZATION & DYNAMIC PRICING EVENT LISTENER
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    switchTab('hero');
    updateLocationBanner();
    startHeroRotation();
    animateCount('statArtists', 412, 1200);
    animateCount('statSalons', SALON_DATA.length, 1000);

    setTimeout(initGoogleAuth, 500);

    renderRushDeals();
    renderNearbyArtists();

    // Call geolocation safely
    setTimeout(getUserLocation, 1000);

    // Bind booking price updater to the dropdown
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
        const selects = bookingModal.querySelectorAll('select');
        if (selects.length >= 2) {
            selects[1].addEventListener('change', window.updateBookingUI);
        }
    }
});
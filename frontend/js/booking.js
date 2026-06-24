const BookingSystem = {
    activeBasePrice: 1500,
    activeTargetName: '',

    
    init() {
        const dateInput = document.getElementById('bookingDateInput');
        if (dateInput) {
            // Restrict historical bookings by locking minimum date parameters to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }

        // Target either booking-modal or bookingModal to be completely safe
        const modal = document.getElementById('booking-modal') || document.getElementById('bookingModal');
        if (modal) {
            // Target ALL select dropdowns in the modal so any change guarantees a price recalculation
            const selects = modal.querySelectorAll('select');
            selects.forEach(select => {
                select.removeEventListener('change', this.handleSelectChange);
                select.addEventListener('change', (e) => this.handleSelectChange(e));
            });
        }
    },

    
    handleSelectChange(e) {
        // If the selected value looks like a package or number, send it to the summary update
        const val = e.target.value;
        this.updatePriceSummary(val);
    },

    open(targetTitle, contextBasePrice = 1500) {
        this.activeBasePrice = contextBasePrice;
        this.activeTargetName = targetTitle;

        const titleEl = document.getElementById('bookingTargetTitle') || document.getElementById('booking-service-name');
        if (titleEl) titleEl.textContent = `Book ${targetTitle}`;

        // Safe package reset across potential ID variations
        const modal = document.getElementById('booking-modal') || document.getElementById('bookingModal');
        if (modal) {
            const selects = modal.querySelectorAll('select');
            selects.forEach(select => {
                // If this selector contains pricing values or option text matching tiers, reset to standard
                if (Array.from(select.options).some(opt => opt.value.includes('Standard') || opt.text.includes('Standard') || opt.text.includes('Premium'))) {
                    select.value = select.options[0].value; 
                }
            });
        }

        // Run an initial recalculation instantly upon loading the modal view
        this.updatePriceSummary('Standard');

        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                const transformEl = modal.querySelector('.transform');
                if (transformEl) transformEl.classList.remove('scale-95');
            }, 50);
        }
    },

   
    close() {
        const modal = document.getElementById('booking-modal') || document.getElementById('bookingModal');
        if (modal) {
            modal.classList.add('opacity-0');
            const transformEl = modal.querySelector('.transform');
            if (transformEl) transformEl.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }
    },

    
    updatePriceSummary(selectedPackage) {
        // Fallback pricing handler if global Engine isn't loaded yet
        let breakdown = { subtotal: this.activeBasePrice, platformFee: 49, total: this.activeBasePrice + 49 };
        
        let normalizedPackage = 'Standard';
        
        // Convert to string safely and lowercase it for bulletproof matching
        const pkgStr = String(selectedPackage).toLowerCase();
        
        if (pkgStr.includes('500') || pkgStr.includes('premium')) {
            normalizedPackage = 'Premium (+500)';
        } else if (pkgStr.includes('1500') || pkgStr.includes('bridal')) {
            normalizedPackage = 'Bridal (+1500)';
        }

        if (window.PricingEngine) {
            breakdown = window.PricingEngine.calculateBreakdown(this.activeBasePrice, normalizedPackage);
        } else {
            // Hardcoded safe fallback calculations matching multipliers directly
            let extra = 0;
            if (normalizedPackage.includes('500')) extra = 500;
            if (normalizedPackage.includes('1500')) extra = 1500;
            breakdown.subtotal = this.activeBasePrice + extra;
            breakdown.total = breakdown.subtotal + breakdown.platformFee;
        }

        // Target the inner receipt block container inside the correct element context
        const modal = document.getElementById('booking-modal') || document.getElementById('bookingModal');
        if (!modal) return;

        // Try standard class or look for the summary layout blocks safely
        const container = modal.querySelector('.bg-cream') || modal.querySelector('.border-t')?.parentElement;
        
        if (container) {
            container.innerHTML = `
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-text">Service Subtotal</span>
                    <span class="font-semibold">₹${breakdown.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-text">Platform Service Fee</span>
                    <span class="font-semibold">₹${breakdown.platformFee}</span>
                </div>
                <div class="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-dark">
                    <span>Total Checkout</span>
                    <span>₹${breakdown.total.toLocaleString('en-IN')}</span>
                </div>
            `;
        }
    },

    
    handleSubmit(event) {
        event.preventDefault();
        this.close();
        if (window.showToast) {
            window.showToast(`Success! Your slot with ${this.activeTargetName} has been synchronized.`);
        }
    }
};

// Global mapping integration hooks
window.openBookingModal = (title) => BookingSystem.open(title);
window.closeBookingModal = () => BookingSystem.close();
window.handleBookingSubmit = (e) => BookingSystem.handleSubmit(e);
window.BookingSystem = BookingSystem;

// Initialize hooks on load
document.addEventListener('DOMContentLoaded', () => {
    BookingSystem.init();
});
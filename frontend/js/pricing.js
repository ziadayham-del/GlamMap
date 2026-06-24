const PricingEngine = {
    // Configuration constants
    PLATFORM_FEE: 49,
    PACKAGE_MULTIPLIERS: {
        'Standard': 0,
        'Premium (+500)': 500,
        'Bridal (+1500)': 1500
    },

    /**
     * Internal helper to calculate dynamic surge/weekend pricing
     */
    getDynamicMultiplier(basePrice) {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();

        let multiplier = 1.0;

        // Weekend premium (Saturday/Sunday)
        if (day === 0 || day === 6) {
            multiplier += 0.25;
        }

        // Peak hours (5 PM - 9 PM)
        if (hour >= 17 && hour <= 21) {
            multiplier += 0.15;
        }

        return Math.round(basePrice * multiplier);
    },

    /**
     * Calculates absolute checkout totals with dynamic pricing applied
     * @param {number} basePrice - Base cost of professional service
     * @param {string} packageType - Selection from package dropdown
     * @returns {object} Detailed cost breakdown object
     */
    calculateBreakdown(basePrice, packageType = 'Standard') {
        // Apply dynamic pricing to the base first
        const adjustedBase = this.getDynamicMultiplier(Number(basePrice));
        
        const additionalCost = this.PACKAGE_MULTIPLIERS[packageType] || 0;
        const subtotal = adjustedBase + additionalCost;
        const total = subtotal + this.PLATFORM_FEE;
        
        return {
            originalBase: basePrice,
            adjustedBase,
            subtotal,
            platformFee: this.PLATFORM_FEE,
            total
        };
    },

    // ... keep getRushDeals and getEstimatedPrice as they were ...
    getRushDeals() { /* ... */ },
    getEstimatedPrice(category, subStyle = '') { /* ... */ }
};

// Export globally
window.PricingEngine = PricingEngine;
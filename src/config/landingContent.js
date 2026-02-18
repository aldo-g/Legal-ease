export const LANDING_CONTENT = {
    airline: {
        hero: {
            title: "Flight disrupted? Demand what you're owed.",
            subtitle: "Don't let airlines ignore your rights. Generate formal legal claims for cancellations, delays, and lost luggage in minutes.",
            cta: "Start Free Assessment",
            secondaryCta: "Check Eligibility"
        },
        features: [
            {
                title: "1. Tell Us What Happened",
                description: "Enter your flight details and the nature of the disruption. We check against major frameworks like EU 261, US DOT, and Montreal Convention.",
                icon: "📝"
            },
            {
                title: "2. Instant Legal Assessment",
                description: "Our system identifies specific regulatory breaches and calculates potential compensation eligibility.",
                icon: "⚖️"
            },
            {
                title: "3. Generate Formal Demand",
                description: "Get a professionally drafted legal letter citing exact statutes, ready to send to the airline's legal department.",
                icon: "✉️"
            }
        ],
        stats: [
            { value: "$600", label: "Max compensation per passenger" },
            { value: "3 Years", label: "To file a claim in many jurisdictions" },
            { value: "0%", label: "Commission taken (it's free)" }
        ],
        testimonials: [
            {
                quote: "I didn't know I was entitled to €600 until I ran my flight number through this.",
                author: "Sarah J., London"
            }
        ]
    }
};

export const CURRENT_MODE = 'airline';

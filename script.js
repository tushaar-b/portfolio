document.addEventListener('DOMContentLoaded', () => {
    // ---- Scroll Reveal Animation ----
    const revealElements = document.querySelectorAll('.section, .interactive-card, .timeline-item, .pub-card');
    
    // Auto-add reveal class
    revealElements.forEach(el => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal');
        }
    });

    function reveal() {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    }

    // Attach event listener
    window.addEventListener('scroll', reveal);
    
    // Trigger once on load just in case
    reveal();
});

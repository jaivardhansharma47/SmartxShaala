// ==================================================
// SMARTXSHAALA PRODUCTION FRONTEND - BACKEND API READY
// All 3 Forms → Secure Server Endpoints
// Careers Form + Resume Upload + Production Optimized
// January 2026 - Professional Deployment Ready
// ==================================================

// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
    }
    lastScroll = currentScroll;
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(faq => {
            faq.classList.remove('active');
        });
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .service-card, .founder-card, .faq-item, .career-card').forEach(el => {
    observer.observe(el);
});

// ==================================================
// APPLICATION MODAL FUNCTIONS
// ==================================================
function openApplicationModal(position) {
    const modal = document.getElementById('applicationModal');
    const modalPosition = document.getElementById('modalPosition');
    modalPosition.textContent = position;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('applicationForm').reset();
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('applicationModal');
    if (e.target === modal) {
        closeApplicationModal();
    }
});

// ==================================================
// BACKEND API FORM HANDLERS (NO TELEGRAM TOKENS EXPOSED)
// ==================================================

// 🔔 CONTACT FORM → Backend API
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get values from form inputs (first 4 inputs in order)
        const formInputs = contactForm.querySelectorAll('input, textarea');
        const name = formInputs[0]?.value.trim() || '';
        const email = formInputs[1]?.value.trim() || '';
        const subject = formInputs[2]?.value.trim() || '';
        const message = formInputs[3]?.value.trim() || '';
        
        // VALIDATION
        if (!name || !email || !message) {
            showNotification('❌ Please fill Name, Email, and Message fields', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('❌ Please enter a valid email address', 'error');
            return;
        }
        
        const data = { name, email, subject, message };
        
        try {
            showNotification('📤 Sending your message...', 'info');
            
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('✅ Thank you! We will contact you soon.', 'success');
                contactForm.reset();
            } else {
                showNotification('❌ ' + (result.message || 'Submission failed. Please try again.'), 'error');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            showNotification('❌ Network error. Please check your connection.', 'error');
        }
    });
}

// 🎯 CAREERS FORM → Backend API + Resume Upload
document.addEventListener('DOMContentLoaded', () => {
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(applicationForm);
            const position = document.getElementById('modalPosition')?.textContent || 'Not specified';
            formData.append('position', position);
            
            try {
                showNotification('📤 Submitting application...', 'info');
                
                const response = await fetch('/api/careers', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showNotification('🎉 Application submitted successfully!', 'success');
                    closeApplicationModal();
                } else {
                    showNotification('❌ ' + (result.message || 'Submission failed'), 'error');
                }
            } catch (error) {
                console.error('Careers form error:', error);
                showNotification('❌ Network error. Please try again.', 'error');
            }
        });
    }
});

// 📧 NEWSLETTER FORM → Backend API
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showNotification('❌ Please enter a valid email address', 'error');
            return;
        }
        
        try {
            showNotification('📧 Subscribing...', 'info');
            
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showNotification('✅ Welcome to SmartxShaala updates!', 'success');
                newsletterForm.reset();
            } else {
                showNotification('❌ ' + (result.message || 'Subscription failed'), 'error');
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            showNotification('❌ Network error. Please try again.', 'error');
        }
    });
}

// ==================================================
// NOTIFICATION SYSTEM
// ==================================================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;font-size:1.2rem;cursor:pointer;">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10000;
        animation: slideInRight 0.5s ease;
        font-family: inherit;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 4000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
`;
document.head.appendChild(style);

// ==================================================
// PARALLAX & ANIMATION EFFECTS
// ==================================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const floatingIcons = document.querySelectorAll('.floating-icon');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight * 0.3);
        
        floatingIcons.forEach((icon, index) => {
            icon.style.transform = `translateY(${scrolled * (0.3 + index * 0.1)}px)`;
        });
    }
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add active nav link styles
const navLinkStyle = document.createElement('style');
navLinkStyle.textContent = `
    .nav-link.active {
        color: var(--primary-color);
    }
    .nav-link.active::after {
        width: 100%;
    }
`;
document.head.appendChild(navLinkStyle);

// Loading Animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Scroll to Top Button
const scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '↑';
scrollTopBtn.className = 'scroll-to-top';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 999;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
`;

document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.style.opacity = '1';
        scrollTopBtn.style.visibility = 'visible';
    } else {
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.visibility = 'hidden';
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Image Error Handling
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.style.color = 'white';
            this.style.fontSize = '3rem';
            this.innerHTML = '📱';
        });
    });
});

console.log('🚀 SmartxShaala Frontend - Backend API Ready! All 3 forms connected.');

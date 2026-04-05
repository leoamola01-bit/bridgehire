// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling
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

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');
        
        answer.classList.toggle('active');
        icon.style.transform = answer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    });
});

// Modal Functions
function openJobModal() {
    document.getElementById('jobModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('jobModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openScholarshipModal() {
    document.getElementById('scholarshipModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeScholarshipModal() {
    document.getElementById('scholarshipModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modals
window.onclick = function(event) {
    const jobModal = document.getElementById('jobModal');
    const scholarshipModal = document.getElementById('scholarshipModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === jobModal) {
        closeJobModal();
    } else if (event.target === scholarshipModal) {
        closeScholarshipModal();
    } else if (event.target === successModal) {
        closeSuccessModal();
    }
};

// 🔥 IMPORTANT: PUT YOUR RENDER BACKEND URL HERE
const API_URL = "https://bridgehire-tmd7.onrender.com/api/applications";

// ================= JOB FORM =================
document.getElementById('jobForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // 🔥 Change button to submitting
    submitBtn.innerHTML = "Submitting...";
    submitBtn.disabled = true;

    const formData = new FormData(this);
    formData.append('type', 'job');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeJobModal();
            document.getElementById('successModal').style.display = 'block';
            this.reset();
        } else {
            alert('Error submitting application. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection.');
    }

    // 🔥 Restore button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
});

// ================= SCHOLARSHIP FORM =================
document.getElementById('scholarshipForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = "Submitting...";
    submitBtn.disabled = true;

    const formData = new FormData(this);
    formData.append('type', 'scholarship');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeScholarshipModal();
            document.getElementById('successModal').style.display = 'block';
            this.reset();
        } else {
            alert('Error submitting application. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please check your connection.');
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
});

// Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .why-item, .benefit, .info-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
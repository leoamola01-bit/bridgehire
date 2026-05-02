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
    // Clear the application ID when modal is closed
    document.getElementById('submittedApplicationId').textContent = 'Loading...';
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
const API_URL = window.location.hostname === 'localhost' && window.location.port === '3000'
    ? '/api/applications'
    : window.location.hostname === 'localhost' && window.location.port === '5500'
    ? 'http://127.0.0.1:3000/api/applications'
    : "https://bridgehire-tmd7.onrender.com/api/applications";

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
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Display application ID in success modal
            document.getElementById('submittedApplicationId').textContent = data.applicationId;
            closeJobModal();
            document.getElementById('successModal').style.display = 'block';
            this.reset();
        } else {
            alert(data.error || 'Error submitting application. Please try again.');
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
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Display application ID in success modal
            document.getElementById('submittedApplicationId').textContent = data.applicationId;
            closeScholarshipModal();
            document.getElementById('successModal').style.display = 'block';
            this.reset();
        } else {
            alert(data.error || 'Error submitting application. Please try again.');
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

// ================= APPLICATION STATUS DASHBOARD =================
const API_BASE = window.location.port === '3000' ? '' : 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', function() {
    const statusForm = document.getElementById('statusForm');
    const applicationStatus = document.getElementById('applicationStatus');

    if (statusForm) {
        statusForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const applicationId = document.getElementById('applicationId').value.trim();

        if (!applicationId) {
            showError('Please enter your Application ID');
            return;
        }

        // Show loading state
        const submitBtn = statusForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span>Checking...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/api/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationId: applicationId
                })
            });

            const data = await response.json();

            if (response.ok) {
                displayApplicationStatus(data.application);
                applicationStatus.style.display = 'block';
                applicationStatus.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                showError(data.error || 'Application not found');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please try again later.');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        });
    }
});

function showError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<p><i class="fas fa-exclamation-triangle"></i> ${message}</p>`;

    const statusCard = document.querySelector('#status .status-card');
    if (statusCard) {
        statusCard.insertBefore(errorDiv, statusCard.querySelector('form'));
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function displayApplicationStatus(application) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Update basic info
    document.getElementById('appId').textContent = application.id;
    document.getElementById('appType').textContent = application.type === 'job' ? 'Job Application' : 'Scholarship Application';
    document.getElementById('submittedDate').textContent = formatDate(application.timestamp);
    document.getElementById('fullName').textContent = application.data.personalDetails.fullName;
    document.getElementById('emailDisplay').textContent = application.data.contactDetails.email;
    document.getElementById('phone').textContent = application.data.contactDetails.phone;

    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    const status = getApplicationStatus(application);
    statusBadge.className = `status-badge ${status.class}`;
    statusBadge.textContent = status.text;

    // Generate timeline
    generateTimeline(application);

    // Display documents
    displayDocuments(application);

    // Show notes if any
    displayNotes(application);
}

function getApplicationStatus(application) {
    const status = application.status || application.data.status || 'pending';

    switch (status) {
        case 'approved':
            return { class: 'approved', text: 'Approved' };
        case 'rejected':
            return { class: 'rejected', text: 'Rejected' };
        case 'pending':
        default:
            // Fallback to time-based logic for pending applications
            const submittedDate = new Date(application.timestamp);
            const now = new Date();
            const daysSinceSubmission = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24));

            if (daysSinceSubmission < 3) {
                return { class: 'pending', text: 'Submitted' };
            } else if (daysSinceSubmission < 14) {
                return { class: 'reviewing', text: 'Under Review' };
            } else if (daysSinceSubmission < 30) {
                return { class: 'reviewing', text: 'Processing' };
            } else {
                return { class: 'reviewing', text: 'In Progress' };
            }
    }
}

function generateTimeline(application) {
    const timeline = document.getElementById('timeline');
    const submittedDate = new Date(application.timestamp);

    const timelineItems = [
        {
            title: 'Application Submitted',
            description: 'Your application has been received and is being processed.',
            date: submittedDate,
            completed: true
        },
        {
            title: 'Document Verification',
            description: 'We are verifying your submitted documents.',
            date: new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
            completed: new Date() > new Date(submittedDate.getTime() + 2 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Eligibility Check',
            description: 'Checking your eligibility for the program.',
            date: new Date(submittedDate.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
            completed: new Date() > new Date(submittedDate.getTime() + 5 * 24 * 60 * 60 * 1000)
        },
        {
            title: 'Final Review',
            description: 'Final review by our admissions team.',
            date: new Date(submittedDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days later
            completed: new Date() > new Date(submittedDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
    ];

    timeline.innerHTML = '';

    timelineItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `timeline-item ${item.completed ? 'completed' : (index === timelineItems.findIndex(i => !i.completed) ? 'current' : '')}`;

        itemDiv.innerHTML = `
            <h5>${item.title}</h5>
            <p>${item.description}</p>
            <div class="date">${formatDate(item.date)}</div>
        `;

        timeline.appendChild(itemDiv);
    });
}

function displayDocuments(application) {
    const documentsGrid = document.getElementById('documentsGrid');
    documentsGrid.innerHTML = '';

    if (!application.data.files || Object.keys(application.data.files).length === 0) {
        documentsGrid.innerHTML = '<p style="color: #94a3b8; text-align: center; width: 100%;">No documents uploaded</p>';
        return;
    }

    const documentTypes = {
        passport: { icon: 'fas fa-passport', label: 'Passport/ID' },
        cv: { icon: 'fas fa-file-alt', label: 'CV/Resume' },
        birthCert: { icon: 'fas fa-certificate', label: 'Birth Certificate' },
        olevel: { icon: 'fas fa-graduation-cap', label: 'O-Level Results' },
        alevel: { icon: 'fas fa-graduation-cap', label: 'A-Level Results' },
        diploma: { icon: 'fas fa-certificate', label: 'Diploma Certificate' },
        olevelCert: { icon: 'fas fa-certificate', label: 'O-Level Certificate' },
        alevelCert: { icon: 'fas fa-certificate', label: 'A-Level Certificate' },
        otherDocs: { icon: 'fas fa-file', label: 'Other Documents' }
    };

    Object.keys(application.data.files).forEach(fieldName => {
        const files = application.data.files[fieldName];
        if (!files || files.length === 0) return;

        const docType = documentTypes[fieldName] || { icon: 'fas fa-file', label: fieldName };

        files.forEach((file, index) => {
            const docDiv = document.createElement('div');
            docDiv.className = 'document-item';

            docDiv.innerHTML = `
                <i class="${docType.icon}"></i>
                <h5>${docType.label}${files.length > 1 ? ` ${index + 1}` : ''}</h5>
                <p>${file.originalname}</p>
                <a href="${file.url}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> View Document
                </a>
            `;

            documentsGrid.appendChild(docDiv);
        });
    });
}

function displayNotes(application) {
    const notesSection = document.getElementById('notesSection');
    const notesContent = document.getElementById('notesContent');

    let notes = '';

    // Show admin notes if they exist (check both top-level and data object)
    if (application.notes) {
        notes = `<strong>Admin Notes:</strong> ${application.notes}`;
    } else if (application.data && application.data.notes) {
        notes = `<strong>Admin Notes:</strong> ${application.data.notes}`;
    } else {
        // Default status-based notes
        const status = getApplicationStatus(application);
        if (status.class === 'pending') {
            notes = 'Your application is being processed. We will contact you within 3-5 business days with an update.';
        } else if (status.class === 'reviewing') {
            notes = 'Your application is under review. Our team is carefully evaluating your qualifications and documents.';
        } else if (status.class === 'approved') {
            notes = 'Congratulations! Your application has been approved. Our team will contact you shortly with next steps.';
        } else if (status.class === 'rejected') {
            notes = 'We regret to inform you that your application has not been approved at this time. Please contact us for more information.';
        }
    }

    if (notes) {
        notesContent.innerHTML = `<p>${notes}</p>`;
        notesSection.style.display = 'block';
    } else {
        notesSection.style.display = 'none';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


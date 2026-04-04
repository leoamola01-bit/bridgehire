const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.body.type}-${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, PNG, DOC, DOCX files are allowed'));
        }
    }
});

// Application submission endpoint
app.post('/api/applications', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'birthCert', maxCount: 1 },
    { name: 'paymentProof', maxCount: 1 },
    { name: 'olevel', maxCount: 1 },
    { name: 'alevel', maxCount: 1 },
    { name: 'diploma', maxCount: 1 },
    { name: 'olevelCert', maxCount: 1 },
    { name: 'alevelCert', maxCount: 1 },
    { name: 'otherDocs', maxCount: 10 }
]), (req, res) => {
    try {
        // Log application data (in production, save to database)
        const applicationData = {
            type: req.body.type,
            timestamp: new Date().toISOString(),
            personalDetails: {
                fullName: req.body.fullName,
                dob: req.body.dob,
                gender: req.body.gender,
                nationality: req.body.nationality,
                maritalStatus: req.body.maritalStatus
            },
            contactDetails: {
                phone: req.body.phone,
                email: req.body.email,
                address: req.body.address
            },
            files: req.files
        };

        if (req.body.type === 'job') {
            applicationData.workDetails = {
                jobCategory: req.body.jobCategory,
                experience: req.body.experience,
                skills: req.body.skills
            };
        } else {
            applicationData.education = {
                olevel: req.body.olevel,
                alevel: req.body.alevel,
                desiredCourse: req.body.desiredCourse
            };
        }

        console.log('New application received:', JSON.stringify(applicationData, null, 2));

        // In production, you would:
        // 1. Save to database (MongoDB/PostgreSQL)
        // 2. Send email notifications
        // 3. Move to admin dashboard for review

        res.json({ 
            success: true, 
            message: 'Application received successfully. You will be contacted within 48 hours.' 
        });

    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({ error: 'Server error processing application' });
    }
});

// Admin endpoint to list applications (basic implementation)
app.get('/api/admin/applications', (req, res) => {
    // In production, fetch from database
    res.json({ 
        applications: [],
        message: 'Admin endpoint - connect to database for full functionality'
    });
});

app.listen(PORT, () => {
    console.log(`BridgeHire.AU server running on port ${PORT}`);
});
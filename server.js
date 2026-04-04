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

// Ensure directories exist
const uploadsDir = 'uploads';
const dataDir = 'data';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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

// Helper function to save application data
const saveApplication = (applicationData) => {
    const fileName = `data/application-${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(applicationData, null, 2));
    return fileName;
};

// Helper function to get all applications
const getAllApplications = () => {
    const applications = [];
    if (fs.existsSync('data')) {
        const files = fs.readdirSync('data');
        files.forEach(file => {
            if (file.endsWith('.json') && file.startsWith('application-')) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join('data', file), 'utf8'));
                    applications.push({
                        id: file,
                        ...data
                    });
                } catch (err) {
                    console.error(`Error reading file ${file}:`, err);
                }
            }
        });
    }
    return applications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

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
        const applicationData = {
            id: Date.now().toString(),
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
            files: {}
        };

        // Process uploaded files
        if (req.files) {
            Object.keys(req.files).forEach(fieldName => {
                applicationData.files[fieldName] = req.files[fieldName].map(file => ({
                    originalname: file.originalname,
                    filename: file.filename,
                    path: file.path,
                    size: file.size,
                    mimetype: file.mimetype
                }));
            });
        }

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

        // Save to file
        saveApplication(applicationData);
        
        console.log('New application saved:', applicationData.id);

        res.json({ 
            success: true, 
            message: 'Application received successfully. You will be contacted within 48 hours.',
            applicationId: applicationData.id
        });

    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({ error: 'Server error processing application' });
    }
});

// Admin endpoint to list all applications
app.get('/api/admin/applications', (req, res) => {
    try {
        const applications = getAllApplications();
        res.json({ 
            applications: applications,
            total: applications.length
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Error fetching applications' });
    }
});

// Admin endpoint to get single application with file details
app.get('/api/admin/applications/:id', (req, res) => {
    try {
        const applications = getAllApplications();
        const application = applications.find(app => app.id === req.params.id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        res.json(application);
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ error: 'Error fetching application' });
    }
});

// Serve uploaded files publicly (for admin viewing)
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`BridgeHire.AU server running on port ${PORT}`);
    console.log(`Files served from: http://localhost:${PORT}/uploads/`);
    console.log(`Admin API: http://localhost:${PORT}/api/admin/applications`);
});
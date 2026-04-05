require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 CHECK ENV VARIABLES
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

// 🔥 SUPABASE CONFIG
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
    origin: '*', // allow all origins; change to your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Upload file to Supabase storage
const uploadToSupabase = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
        .from('applications')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
        .from('applications')
        .getPublicUrl(fileName);

    return publicUrl.publicUrl;
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
]), async (req, res) => {
    try {
        const applicationId = Date.now().toString();

        const applicationData = {
            id: applicationId,
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

        // 🔥 Upload files
        if (req.files) {
            for (const fieldName of Object.keys(req.files)) {
                applicationData.files[fieldName] = [];

                for (const file of req.files[fieldName]) {
                    const fileUrl = await uploadToSupabase(file, req.body.type);
                    applicationData.files[fieldName].push({
                        originalname: file.originalname,
                        url: fileUrl,
                        size: file.size,
                        mimetype: file.mimetype
                    });
                }
            }
        }

        // Extra data
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

        // 🔥 Save to Supabase DB
        const { error } = await supabase
            .from('applications')
            .insert([{
                id: applicationId,
                type: applicationData.type,
                timestamp: applicationData.timestamp,
                data: applicationData
            }]);

        if (error) throw error;

        console.log('✅ Saved to Supabase:', applicationId);

        res.json({
            success: true,
            message: 'Application submitted successfully',
            applicationId
        });

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// Admin: get all applications
app.get('/api/admin/applications', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        res.json({ applications: data, total: data.length });

    } catch (error) {
        res.status(500).json({ error: 'Error fetching applications' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
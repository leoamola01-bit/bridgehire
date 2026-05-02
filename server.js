require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 ENV CHECK
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase ENV variables');
    process.exit(1);
}

// 🔥 SUPABASE
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 RATE LIMIT (ANTI-SPAM)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 50,
    message: "Too many requests. Try again later."
});
app.use(limiter);

// 🔐 CORS (CHANGE THIS AFTER DEPLOY)
app.use(cors({
    origin: '*', // 🔥 later replace with your frontend URL
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 🔥 MULTER
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

// 🔥 UPLOAD TO SUPABASE
const uploadToSupabase = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
        .from('applications')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from('applications')
        .getPublicUrl(fileName);

    return data.publicUrl;
};

// 🚀 SUBMIT APPLICATION
app.post('/api/applications', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'birthCert', maxCount: 1 },
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

        // Upload files
        if (req.files) {
            for (const fieldName of Object.keys(req.files)) {
                applicationData.files[fieldName] = [];

                for (const file of req.files[fieldName]) {
                    const url = await uploadToSupabase(file, req.body.type);

                    applicationData.files[fieldName].push({
                        originalname: file.originalname,
                        url,
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

        // Save to DB
        const { error } = await supabase
            .from('applications')
            .insert([{
                id: applicationId,
                type: applicationData.type,
                timestamp: applicationData.timestamp,
                status: 'pending', // Add status field
                data: applicationData
            }]);

        if (error) throw error;

        console.log('✅ Saved:', applicationId);

        res.json({
            success: true,
            applicationId
        });

    } catch (error) {
        console.error('❌ ERROR:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// 🔐 ADMIN ROUTE
app.get('/api/admin/applications', async (req, res) => {
    const adminKey = req.headers.authorization;

    if (adminKey !== "my-secret-key") {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        res.json({
            applications: data,
            total: data.length
        });

    } catch (error) {
        res.status(500).json({ error: 'Error fetching applications' });
    }
});

// 🔐 ADMIN UPDATE APPLICATION STATUS
app.post('/api/admin/applications/:id/status', async (req, res) => {
    const adminKey = req.headers.authorization;

    if (adminKey !== "my-secret-key") {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        console.log('🔄 Status update request:', { id, status, notes });

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be approved, rejected, or pending' });
        }

        // First, get the current application data
        const { data: existingApp, error: fetchError } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingApp) {
            console.log('❌ Application not found:', fetchError);
            return res.status(404).json({ error: 'Application not found' });
        }

        console.log('📋 Current application data:', existingApp);

        // Update the data object with status and notes
        const updatedData = { ...existingApp.data };
        if (status) updatedData.status = status;
        if (notes) updatedData.notes = notes;

        console.log('📝 Updated data object:', updatedData);

        // Update the application
        const { error } = await supabase
            .from('applications')
            .update({
                data: updatedData,
                status: status // Also try to update the top-level status field
            })
            .eq('id', id);

        if (error) {
            console.error('❌ Primary update error:', error);
            // If the status column doesn't exist, try updating just the data field
            const { error: fallbackError } = await supabase
                .from('applications')
                .update({ data: updatedData })
                .eq('id', id);

            if (fallbackError) {
                console.error('❌ Fallback update error:', fallbackError);
                throw fallbackError;
            } else {
                console.log('✅ Fallback update successful');
            }
        } else {
            console.log('✅ Primary update successful');
        }

        res.json({
            success: true,
            message: `Application ${status}`
        });

    } catch (error) {
        console.error('❌ Status update error:', error);
        res.status(500).json({ error: 'Error updating application status' });
    }
});

// 🚀 CUSTOMER STATUS CHECK
app.post('/api/status', async (req, res) => {
    try {
        const { applicationId } = req.body;

        if (!applicationId) {
            return res.status(400).json({ error: 'Application ID is required' });
        }

        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Application not found. Please check your Application ID.' });
        }

        res.json({
            success: true,
            application: data
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Error checking application status' });
    }
});

// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
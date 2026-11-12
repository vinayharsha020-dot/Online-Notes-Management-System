const { createClient } = require("@supabase/supabase-js");

// SUPABASE CLIENT
const getSupabase = (token) => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );
};

// CREATE NOTE
const createNote = async (req, res) => {
    try {
        const supabase = getSupabase(req.accessToken);
        const { title, subject, content, category } = req.body;

        if (!title || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: "Title, subject and content are required"
            });
        }

        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: req.user.id,
                title,
                subject,
                content,
                category,
                note_type: "text"
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: "Note created successfully",
            note: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET ALL NOTES
const getNotes = async (req, res) => {
    try {
        const supabase = getSupabase(req.accessToken);

        const { data, error } = await supabase
            .from("notes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            notes: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE NOTE
const updateNote = async (req, res) => {
    try {
        const supabase = getSupabase(req.accessToken);
        const { title, subject, content, category } = req.body;

        const { data, error } = await supabase
            .from("notes")
            .update({ title, subject, content, category })
            .eq("id", req.params.id)
            .eq("user_id", req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: "Note updated successfully",
            note: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE NOTE
const deleteNote = async (req, res) => {
    try {
        const supabase = getSupabase(req.accessToken);

        const { data, error } = await supabase
            .from("notes")
            .delete()
            .eq("id", req.params.id)
            .eq("user_id", req.user.id)
            .select()
            .single();

        if (error) throw error;

        // Delete associated uploaded file
        if (data.file_path) {
            const { error: storageError } = await supabase.storage
                .from("note-materials")
                .remove([data.file_path]);

            if (storageError) {
                console.error("Storage deletion failed:", storageError.message);
            }
        }

        res.status(200).json({
            success: true,
            message: "Note deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPLOAD STUDY MATERIAL
const uploadMaterial = async (req, res) => {
    let filePath;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file."
            });
        }

        const supabase = getSupabase(req.accessToken);

        const safeName = req.file.originalname.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

        filePath = `${req.user.id}/${Date.now()}-${safeName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("note-materials")
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Save file details in database
        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: req.user.id,
                title: req.body.title || safeName,
                subject: req.body.subject || "General",
                category: req.body.category || "Material",
                content: "",
                note_type: "file",
                file_name: req.file.originalname,
                file_path: filePath,
                file_size: req.file.size,
                mime_type: req.file.mimetype
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: "Material uploaded successfully!",
            note: data
        });

    } catch (error) {

        // Clean up uploaded file if database insertion fails
        if (filePath) {
            try {
                const supabase = getSupabase(req.accessToken);

                await supabase.storage
                    .from("note-materials")
                    .remove([filePath]);

            } catch (cleanupError) {
                console.error("File cleanup failed:", cleanupError.message);
            }
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DOWNLOAD SELECTED MATERIAL
const downloadMaterial = async (req, res) => {
    try {
        const supabase = getSupabase(req.accessToken);
        const { id } = req.params;

        // Find the selected user's file
        const { data: note, error: noteError } = await supabase
            .from("notes")
            .select("file_path, file_name, note_type")
            .eq("id", id)
            .eq("user_id", req.user.id)
            .single();

        if (noteError || !note || note.note_type !== "file") {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        // Generate a temporary download URL
        const { data, error } = await supabase.storage
            .from("note-materials")
            .createSignedUrl(note.file_path, 60);

        if (error) throw error;

        res.status(200).json({
            success: true,
            downloadUrl: data.signedUrl,
            fileName: note.file_name
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// EXPORT CONTROLLERS
module.exports = {
    createNote,
    getNotes,
    updateNote,
    deleteNote,
    uploadMaterial,
    downloadMaterial
};
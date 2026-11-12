const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./config/supabase");

const app = express();

app.use(cors());
app.use(express.json());

// Authentication Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Notes Routes
const notesRoutes = require("./routes/notesRoutes");
app.use("/api/notes", notesRoutes);

// Home Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Online Notes Management System API is running!"
    });
});

// Supabase Health Check
app.get("/api/health", async (req, res) => {
    try {
        const { error } = await supabase
            .from("notes")
            .select("id")
            .limit(1);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: "Backend and Supabase connected successfully!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
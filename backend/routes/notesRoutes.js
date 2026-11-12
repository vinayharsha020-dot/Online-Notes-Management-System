const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createNote,
    getNotes,
    updateNote,
    deleteNote,
    uploadMaterial,
    downloadMaterial
} = require("../controllers/notesController");

// Protect all notes routes
router.use(authMiddleware);

// Upload study materials
router.post("/upload", upload.single("file"), uploadMaterial);

// Download selected material
router.get("/:id/download", downloadMaterial);

// Notes CRUD operations
router.post("/", createNote);
router.get("/", getNotes);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

module.exports = router;
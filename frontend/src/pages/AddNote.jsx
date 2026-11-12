import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AddNote() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState(() => {
        const type = new URLSearchParams(window.location.search).get("type");
        return type === "upload" ? "upload" : "write";
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        title: "",
        subject: "",
        category: "General",
        content: ""
    });

    const [file, setFile] = useState(null);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    // SAVE TYPED NOTE
    const handleWriteNote = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await API.post("/notes", form);

            setMessage("Note saved successfully!");

            setTimeout(() => navigate("/dashboard"), 1200);

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Unable to save note."
            );
        } finally {
            setLoading(false);
        }
    };

    // UPLOAD MATERIAL
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage("Please select a file.");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);
        formData.append("title", form.title);
        formData.append("subject", form.subject);
        formData.append("category", form.category);

        setLoading(true);
        setMessage("");

        try {
            await API.post("/notes/upload", formData);

            setMessage("Material uploaded successfully!");

            setTimeout(() => navigate("/dashboard"), 1200);

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Upload failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-note-page">

            <div className="add-note-header">
                <h1>Add New Study Material</h1>
                <p>Create notes or import existing materials.</p>
            </div>

            <div className="note-tabs">
                <button
                    type="button"
                    className={activeTab === "write" ? "active" : ""}
                    onClick={() => {
                        setActiveTab("write");
                        setMessage("");
                    }}
                >
                    ✍️ Write Note
                </button>

                <button
                    type="button"
                    className={activeTab === "upload" ? "active" : ""}
                    onClick={() => {
                        setActiveTab("upload");
                        setMessage("");
                    }}
                >
                    📁 Import Notes
                </button>
            </div>

            <div className="add-note-card">

                <form
                    onSubmit={
                        activeTab === "write"
                            ? handleWriteNote
                            : handleUpload
                    }
                >

                    <label>Note Title</label>
                    <input
                        type="text"
                        name="title"
                        placeholder="Enter note title"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />

                    <label>Subject</label>
                    <input
                        type="text"
                        name="subject"
                        placeholder="Enter subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                    />

                    <label>Category</label>
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                    >
                        <option value="General">General</option>
                        <option value="Lecture Notes">Lecture Notes</option>
                        <option value="Assignments">Assignments</option>
                        <option value="Exam Preparation">Exam Preparation</option>
                        <option value="Reference Materials">Reference Materials</option>
                    </select>

                    {activeTab === "write" ? (
                        <>
                            <label>Note Content</label>

                            <textarea
                                name="content"
                                placeholder="Start writing your study notes..."
                                value={form.content}
                                onChange={handleChange}
                                rows="12"
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="save-note-btn"
                            >
                                {loading ? "Saving..." : "Save Note"}
                            </button>
                        </>
                    ) : (
                        <>
                            <label>Choose Study Material</label>

                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                onChange={(e) => setFile(e.target.files[0])}
                                required
                            />

                            {file && (
                                <p>
                                    Selected: {file.name}
                                </p>
                            )}

                            <p className="upload-info">
                                Supported: PDF, DOC, DOCX, TXT, JPG and PNG.
                                Maximum size: 10 MB.
                            </p>

                            <button
                                type="submit"
                                disabled={loading}
                                className="save-note-btn"
                            >
                                {loading ? "Uploading..." : "Upload Material"}
                            </button>
                        </>
                    )}

                    {message && <p className="form-message">{message}</p>}

                </form>

                <button
                    type="button"
                    className="back-btn"
                    onClick={() => navigate("/dashboard")}
                >
                    Back to Dashboard
                </button>

            </div>
        </div>
    );
}

export default AddNote;
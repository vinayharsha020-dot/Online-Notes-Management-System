import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    Plus,
    Search,
    LogOut,
    FileText,
    FileDown,
    FolderOpen,
    Edit,
    Trash2
} from "lucide-react";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showFilesOnly, setShowFilesOnly] = useState(false);

    const [form, setForm] = useState({
        title: "",
        subject: "",
        content: "",
        category: ""
    });

    // FETCH NOTES
    const fetchNotes = async () => {
        try {
            const response = await API.get("/notes");
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error("Unable to fetch notes:", error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    // CREATE / UPDATE NOTE
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await API.put(`/notes/${editingId}`, form);
            } else {
                await API.post("/notes", form);
            }

            setForm({
                title: "",
                subject: "",
                content: "",
                category: ""
            });

            setEditingId(null);
            fetchNotes();

        } catch (error) {
            alert(error.response?.data?.message || "Something went wrong");
        }
    };

    // EDIT NOTE
    const editNote = (note) => {
        if (note.note_type === "file") {
            alert("File materials cannot be edited as text notes.");
            return;
        }

        setEditingId(note.id);

        setForm({
            title: note.title,
            subject: note.subject,
            content: note.content,
            category: note.category || ""
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // DELETE NOTE
    const deleteNote = async (id) => {
        if (!window.confirm("Delete this note?")) return;

        try {
            await API.delete(`/notes/${id}`);
            fetchNotes();
        } catch (error) {
            alert("Unable to delete note");
        }
    };

    // DOWNLOAD SELECTED FILE

    const downloadFile = async (id) => {
        try {
            const response = await API.get(`/notes/${id}/download`);

            const fileUrl = response.data.downloadUrl;
            const fileName = response.data.fileName || "download";

            const fileResponse = await fetch(fileUrl);
            if (!fileResponse.ok) {
                throw new Error("Unable to fetch file");
            }

            const blob = await fileResponse.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(blobUrl);

        } catch (error) {
            console.error("Download error:", error);
            alert(error.response?.data?.message || error.message || "Unable to download file");
        }
    };
    // FILTER NOTES
    const filteredNotes = notes.filter(note => {
        const matchesSearch =
            `${note.title} ${note.subject} ${note.category} ${note.file_name || ""}`
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesFileType =
            !showFilesOnly || note.note_type === "file";

        return matchesSearch && matchesFileType;
    });

    return (
        <div className="dashboard-layout">

            {/* SIDEBAR */}
            <aside className="dashboard-sidebar">

                <div className="sidebar-brand">
                    <BookOpen size={27} />
                    <h2>NoteSpace</h2>
                </div>

                <p className="sidebar-label">MENU</p>

                <button className="sidebar-link active">
                    <LayoutDashboard size={19} />
                    Dashboard
                </button>

                <button
                    className="sidebar-link"
                    onClick={() => navigate("/add-note")}
                >
                    <Plus size={19} />
                    Add New Note
                </button>

                <button
                    className="sidebar-link"
                    onClick={() => {
                        setShowFilesOnly(false);
                        setSearch("");

                        document.getElementById("notes-section")?.scrollIntoView({
                            behavior: "smooth"
                        });
                    }}
                >
                    <FolderOpen size={19} />
                    My Notes
                </button>

                <div className="sidebar-bottom">

                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user?.email?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="user-details">
                            <strong>My Account</strong>
                            <span>{user?.email}</span>
                        </div>
                    </div>

                    <button
                        className="sidebar-link logout-link"
                        onClick={logout}
                    >
                        <LogOut size={19} />
                        Logout
                    </button>

                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="dashboard-main">

                <header className="dashboard-topbar">

                    <div>
                        <h2>Dashboard</h2>
                        <p>Welcome back! Manage your study materials.</p>
                    </div>

                    <button
                        className="dashboard-add-btn"
                        onClick={() => navigate("/add-note")}
                    >
                        <Plus size={19} />
                        Add Note
                    </button>

                </header>

                {/* STATISTICS */}
                <section className="dashboard-stats">

                    <div className="stat-card">
                        <div className="stat-icon">
                            <FileText size={23} />
                        </div>

                        <div>
                            <p>Total Notes</p>
                            <h2>{notes.length}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <FolderOpen size={23} />
                        </div>

                        <div>
                            <p>Subjects</p>
                            <h2>
                                {new Set(
                                    notes.map(note => note.subject).filter(Boolean)
                                ).size}
                            </h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <BookOpen size={23} />
                        </div>

                        <div>
                            <p>Uploaded Materials</p>
                            <h2>
                                {notes.filter(
                                    note => note.note_type === "file"
                                ).length}
                            </h2>
                        </div>
                    </div>

                </section>

                {/* NOTES SECTION */}
                <section
                    className="dashboard-notes-section"
                    id="notes-section"
                >

                    {/* NOTES HEADING */}
                    <div className="notes-heading">

                        <div>
                            <h2>
                                {showFilesOnly ? "Your PDF & Files" : "Your notes"}
                            </h2>

                            <p>
                                {showFilesOnly
                                    ? "Select the material you want to download."
                                    : "Everything you've been learning, in one place."
                                }
                            </p>
                        </div>

                        <div className="notes-heading-actions">

                            <button
                                className="notes-action-btn"
                                onClick={() => navigate("/add-note?type=text")}
                            >
                                <FileText size={16} />
                                Text
                            </button>

                            <button
                                className="notes-action-btn"
                                onClick={() => {
                                    setShowFilesOnly(true);
                                    setSearch("");

                                    document.getElementById("notes-section")?.scrollIntoView({
                                        behavior: "smooth"
                                    });
                                }}
                            >
                                <FileDown size={16} />
                                PDF
                            </button>

                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    setShowFilesOnly(false);
                                    setSearch("");
                                }}
                            >
                                View all <span>→</span>
                            </button>

                        </div>

                    </div>

                    {/* SEARCH */}
                    <div className="dashboard-search">

                        <Search size={20} />

                        <input
                            type="text"
                            placeholder={
                                showFilesOnly
                                    ? "Search uploaded files..."
                                    : "Search by title, subject or category..."
                            }
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                    </div>

                    {/* EDIT NOTE FORM */}
                    {editingId && (

                        <form className="note-form" onSubmit={handleSubmit}>

                            <h2>Edit Note</h2>

                            <input
                                placeholder="Note Title"
                                value={form.title}
                                onChange={e => setForm({
                                    ...form,
                                    title: e.target.value
                                })}
                                required
                            />

                            <input
                                placeholder="Subject"
                                value={form.subject}
                                onChange={e => setForm({
                                    ...form,
                                    subject: e.target.value
                                })}
                                required
                            />

                            <input
                                placeholder="Category"
                                value={form.category}
                                onChange={e => setForm({
                                    ...form,
                                    category: e.target.value
                                })}
                            />

                            <textarea
                                placeholder="Write your notes here..."
                                value={form.content}
                                onChange={e => setForm({
                                    ...form,
                                    content: e.target.value
                                })}
                                required
                            />

                            <button type="submit">
                                Update Note
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm({
                                        title: "",
                                        subject: "",
                                        content: "",
                                        category: ""
                                    });
                                }}
                            >
                                Cancel
                            </button>

                        </form>
                    )}

                    {/* NOTES GRID */}
                    <div className="notes-grid">

                        {filteredNotes.map(note => (

                            <div className="note-card" key={note.id}>

                                <div className="note-card-header">

                                    <div className="note-icon">
                                        {note.note_type === "file"
                                            ? <FileDown size={21} />
                                            : <FileText size={21} />
                                        }
                                    </div>

                                    <span className="note-category">
                                        {note.category || "General"}
                                    </span>

                                </div>

                                <h3>{note.title}</h3>

                                <p>
                                    <strong>Subject:</strong> {note.subject}
                                </p>

                                {note.note_type === "file" ? (

                                    <p className="note-file-name">
                                        📎 {note.file_name || "Uploaded material"}
                                    </p>

                                ) : (

                                    <p className="note-content">
                                        {note.content}
                                    </p>

                                )}

                                <div className="note-card-actions">

                                    {note.note_type === "file" ? (

                                        <button
                                            onClick={() => downloadFile(note.id)}
                                        >
                                            <FileDown size={16} />
                                            Download
                                        </button>

                                    ) : (

                                        <button onClick={() => editNote(note)}>
                                            <Edit size={16} />
                                            Edit
                                        </button>

                                    )}

                                    <button
                                        className="delete-note-btn"
                                        onClick={() => deleteNote(note.id)}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>

                                </div>

                            </div>

                        ))}

                        {/* EMPTY STATE */}
                        {filteredNotes.length === 0 && (

                            <div className="empty-notes">

                                <FileText size={42} />

                                <h3>
                                    {showFilesOnly
                                        ? "No uploaded files found"
                                        : "No notes found"
                                    }
                                </h3>

                                <p>
                                    {showFilesOnly
                                        ? "Upload study materials to see them here."
                                        : "Start organizing your study materials."
                                    }
                                </p>

                                <button
                                    onClick={() => navigate("/add-note")}
                                >
                                    <Plus size={18} />
                                    Add New Material
                                </button>

                            </div>

                        )}

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;
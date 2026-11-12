import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await register(
                form.full_name,
                form.email,
                form.password
            );

            setMessage(response.data.message);
            setError("");
            setTimeout(() => navigate("/"), 2500);

        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Create Account</h1>
                <p>Start managing your study notes</p>

                {message && <p className="success">{message}</p>}
                {error && <p className="error">{error}</p>}

                <input
                    placeholder="Full Name"
                    value={form.full_name}
                    onChange={(e) => setForm({
                        ...form,
                        full_name: e.target.value
                    })}
                    required
                />

                <input
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => setForm({
                        ...form,
                        email: e.target.value
                    })}
                    required
                />

                <input
                    type="password"
                    placeholder="Password (minimum 8 characters)"
                    value={form.password}
                    onChange={(e) => setForm({
                        ...form,
                        password: e.target.value
                    })}
                    minLength="8"
                    required
                />

                <button type="submit">Register</button>

                <p>
                    Already registered? <Link to="/">Login</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
import { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../config/supabase";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Password reset link sent! Check your email.");
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Forgot Password?</h2>
                <p>Enter your registered email to receive a reset link.</p>

                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                {message && <p>{message}</p>}

                <Link to="/">Back to Login</Link>
            </form>
        </div>
    );
}

export default ForgotPassword;
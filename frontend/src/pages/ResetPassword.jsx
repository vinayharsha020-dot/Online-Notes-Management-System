import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../config/supabase";

function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Password updated successfully!");

            setTimeout(() => {
                navigate("/");
            }, 2000);
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Reset Password</h2>

                <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength="6"
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength="6"
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                </button>

                {message && <p>{message}</p>}

                <Link to="/">Back to Login</Link>
            </form>
        </div>
    );
}

export default ResetPassword;
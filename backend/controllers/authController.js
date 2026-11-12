const supabase = require("../config/supabase");

// Student Registration
const register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name
                }
            }
        });

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: "Registration successful. Check your email for verification.",
            user: data.user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Student Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: data.user,
            session: data.session
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = { register, login };
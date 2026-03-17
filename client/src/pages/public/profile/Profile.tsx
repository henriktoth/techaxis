import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../../../components/shared/Navbar";
import type { User, Category } from "../../../types";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [userRes, catRes] = await Promise.all([
                    axios.get("http://localhost:8000/api/auth/me", { headers }),
                    axios.get("http://localhost:8000/api/categories")
                ]);
                
                setUser(userRes.data);
                setName(userRes.data.name);
                setEmail(userRes.data.email);
                setCategories(catRes.data);
            } catch (error) {
                console.error(error);
                localStorage.removeItem("token");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const canEditEmail = () => {
        if (!user) return false;
        if (user.role === 'SUPERADMIN') return true;
        if (user.role === 'ADMIN' || user.role === 'WRITER') return false;
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password && password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            
            const data: any = { name };
            if (canEditEmail() && email !== user?.email) {
                data.email = email;
            }
            if (password) {
                data.password = password;
            }

            const res = await axios.patch("http://localhost:8000/api/users/profile", data, { headers });
            
            setUser(res.data);
            toast.success("Profile updated successfully");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0B1120] text-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#0B1120] text-gray-100 font-sans selection:bg-indigo-500/30">
            <Navbar 
                categories={categories} 
                selectedCategoryId={null} 
                onSelectCategory={() => navigate("/")} 
                onSearch={() => {}}
                user={user}
                onSignOut={() => {
                    localStorage.removeItem("token");
                    navigate("/login");
                }}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="max-w-2xl mx-auto bg-[#111827] rounded-xl border border-white/10 p-8">
                    <h1 className="text-3xl font-bold mb-8 text-white">Profile Settings</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                                {!canEditEmail() && <span className="text-xs text-slate-500 ml-2">(Contact admin to change)</span>}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${!canEditEmail() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!canEditEmail()} 
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <h2 className="text-xl font-semibold mb-4 text-white">Change Password</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {password && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-[0_0_20px_-5px_theme(colors.indigo.500/0.5)]"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
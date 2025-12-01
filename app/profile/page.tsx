"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Mail, Phone, MapPin, FileText, Save, Camera } from "lucide-react";

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [formData, setFormData] = useState({
        name: currentUser?.name || "",
        phone: currentUser?.phone || "",
        address: currentUser?.address || "",
        bio: currentUser?.bio || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch("http://localhost:3001/api/auth/me", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            dispatch(setUser(data.user));
            setMessage({ type: 'success', text: "Profile updated successfully!" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) return null;

    // Get initials for avatar
    const initials = currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your profile and preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar / Avatar Section */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                            <CardContent className="pt-6 flex flex-col items-center text-center">
                                <div className="relative group cursor-pointer">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl mb-4">
                                        {initials}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
                                <p className="text-sm text-black dark:text-white">{currentUser.email}</p>
                                <div className="mt-4 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider">
                                    {currentUser.role}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Form Section */}
                    <div className="md:col-span-2">
                        <Card className="border-none shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {message && (
                                        <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success'
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium">{message.text}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="flex items-center space-x-2">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span>Full Name</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="bg-gray-50/50 dark:bg-gray-900/50"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center space-x-2">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                                <span>Email Address</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                value={currentUser.email}
                                                disabled
                                                className="disabled:bg-gray-50/50 dark:disabled:bg-gray-900/50 disabled:text-gray-900 dark:disabled:text-white disabled:opacity-100 disabled:border-gray-200 dark:disabled:border-gray-800 cursor-not-allowed"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="flex items-center space-x-2">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    <span>Phone Number</span>
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+91 98765 43210"
                                                    className="bg-gray-50/50 dark:bg-gray-900/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="address" className="flex items-center space-x-2">
                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                    <span>Location</span>
                                                </Label>
                                                <Input
                                                    id="address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    placeholder="Mumbai, India"
                                                    className="bg-gray-50/50 dark:bg-gray-900/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bio" className="flex items-center space-x-2">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <span>Bio</span>
                                            </Label>
                                            <textarea
                                                id="bio"
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleChange}
                                                className="flex min-h-[120px] w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900/50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300 transition-colors"
                                                placeholder="Tell us a little about yourself..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving Changes...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

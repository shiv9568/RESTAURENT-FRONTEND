import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email });
            setEmailSent(true);
            toast.success('Password reset link sent to your email!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                                <CheckCircle2 className="w-16 h-16 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold">Check your email!</h2>
                        <p className="text-muted-foreground">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <Button
                            onClick={() => setEmailSent(false)}
                            variant="outline"
                            className="w-full mt-4"
                        >
                            Try another email
                        </Button>
                        <Link to="/auth">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Forgot Password? 🔐
                    </CardTitle>
                    <CardDescription className="text-center text-base">
                        No worries! Enter your email and we'll send you a reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="transition-all"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg transition-all duration-300"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/auth">
                            <Button variant="ghost" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

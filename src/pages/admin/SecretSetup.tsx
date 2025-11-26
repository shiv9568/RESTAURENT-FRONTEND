import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function SecretSetup() {
    const [secretKey, setSecretKey] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/setup-admin-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, secretKey }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to update credentials');
                toast.error(data.error || 'Failed to update credentials');
            } else {
                setMessage(data.message);
                toast.success(data.message);
                // Optional: Clear sensitive fields
                setPassword('');
            }
        } catch (err: any) {
            console.error('Setup error:', err);
            setError('Connection failed');
            toast.error('Connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-900">
                        <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-white">
                        Developer Access Only
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Setup Admin Credentials
                    </p>
                </div>

                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-center text-gray-100">Secret Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert variant="destructive" className="bg-red-900/50 border-red-900 text-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {message && (
                                <Alert className="bg-green-900/50 border-green-900 text-green-200">
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="secret" className="text-gray-300">Developer Secret Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                                    <Input
                                        id="secret"
                                        type="password"
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        placeholder="Enter secret key"
                                        className="pl-10 bg-gray-900 border-gray-600 text-white placeholder:text-gray-600 focus:border-red-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4 mt-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-4">New Admin Credentials</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@example.com"
                                            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-600"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-300">New Password</Label>
                                        <Input
                                            id="password"
                                            type="text"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Set strong password"
                                            className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-600"
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Visible for verification</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Updating...</span>
                                    </div>
                                ) : (
                                    'Update Admin Credentials'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

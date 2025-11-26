import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSignUp() {
  const navigate = useNavigate();

  // Redirect to admin login since we're using custom auth now
  React.useEffect(() => {
    navigate('/admin/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Redirecting to Login...
          </h2>
        </div>
      </div>
    </div>
  );
}

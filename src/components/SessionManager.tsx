import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 60 * 1000; // 1 minute warning

export function SessionManager() {
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        setShowWarning(false);

        const tableNumber = localStorage.getItem('tableNumber');
        if (!tableNumber) return; // Only run for dine-in users

        timeoutRef.current = setTimeout(() => {
            setShowWarning(true);
            warningTimeoutRef.current = setTimeout(() => {
                handleSessionTimeout();
            }, WARNING_DURATION);
        }, INACTIVITY_LIMIT);
    };

    const handleSessionTimeout = () => {
        const tableNumber = localStorage.getItem('tableNumber');
        if (tableNumber) {
            localStorage.removeItem('tableNumber');
            localStorage.removeItem(`dineInUserName_${tableNumber}`);
            localStorage.removeItem('tableToken');
            navigate('/');
            toast.info('Session expired due to inactivity.');
            setShowWarning(false);
        }
    };

    const handleContinue = () => {
        resetTimer();
    };

    useEffect(() => {
        // Events to track activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleActivity = () => {
            // Debounce slightly to avoid excessive resets
            if (!showWarning) {
                resetTimer();
            }
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        // Initial start
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, [showWarning, navigate]);

    return (
        <AlertDialog open={showWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you still there?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your session has been inactive for a while. To keep your table session active, please click Continue.
                        Your session will close in 1 minute.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleContinue}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

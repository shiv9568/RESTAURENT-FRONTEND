import { Check, X } from 'lucide-react';
import { useMemo } from 'react';

interface PasswordStrengthProps {
    password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
    const strength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: '' };

        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        };

        score = Object.values(checks).filter(Boolean).length;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', checks };
        if (score <= 3) return { score, label: 'Fair', color: 'bg-orange-500', checks };
        if (score <= 4) return { score, label: 'Good', color: 'bg-yellow-500', checks };
        return { score, label: 'Strong', color: 'bg-green-500', checks };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                </div>
                <span className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-500' :
                        strength.score <= 3 ? 'text-orange-500' :
                            strength.score <= 4 ? 'text-yellow-500' :
                                'text-green-500'
                    }`}>
                    {strength.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={`flex items-center gap-1 ${strength.checks?.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {strength.checks?.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1 ${strength.checks?.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {strength.checks?.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Uppercase</span>
                </div>
                <div className={`flex items-center gap-1 ${strength.checks?.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {strength.checks?.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Lowercase</span>
                </div>
                <div className={`flex items-center gap-1 ${strength.checks?.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {strength.checks?.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Number</span>
                </div>
            </div>
        </div>
    );
}

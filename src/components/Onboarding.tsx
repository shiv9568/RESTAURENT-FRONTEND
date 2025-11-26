import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OnboardingStep {
    title: string;
    description: string;
    target?: string; // CSS selector for the element to highlight
    action?: string; // Optional action text
    emoji?: string;
}

interface OnboardingProps {
    type?: 'user' | 'admin';
}

const USER_STEPS: OnboardingStep[] = [
    {
        title: 'Welcome to Foodie Dash! 🎉',
        description: 'Get ready for the best food ordering experience! Let\'s show you around in just 30 seconds.',
        emoji: '👋',
    },
    {
        title: 'Browse Our Menu 🍽️',
        description: 'Tap on any delicious item to view details, see ingredients, and add it to your cart with one click!',
        target: '.menu-section',
        action: 'Try clicking on a food item',
        emoji: '🔍',
    },
    {
        title: 'Your Shopping Cart 🛒',
        description: 'Click the cart icon anytime to see your items. Modify quantities, apply coupons, or remove items easily.',
        target: '[data-cart-icon]',
        action: 'Check your cart here',
        emoji: '🛍️',
    },
    {
        title: 'Your Profile & Orders 👤',
        description: 'Access your account, view order history, manage addresses, and track deliveries - all in one place!',
        target: '[data-profile-menu]',
        action: 'Click here to see options',
        emoji: '⚙️',
    },
    {
        title: 'Track Live Orders 📦',
        description: 'Watch your order progress in real-time! Get notifications at every step from preparation to delivery.',
        emoji: '🚚',
    },
    {
        title: 'You\'re All Set! 🎊',
        description: 'Start exploring our menu and enjoy hassle-free ordering. Tap anywhere to begin your food journey!',
        emoji: '✨',
    },
];

const ADMIN_STEPS: OnboardingStep[] = [
    {
        title: 'Welcome to Admin Dashboard! 👨‍💼',
        description: 'Your complete restaurant management hub. Let\'s take a quick tour of all the powerful features!',
        emoji: '🎯',
    },
    {
        title: 'Orders Management 📋',
        description: 'View and manage all incoming orders. Track status, update order progress, and communicate with customers.',
        target: '[data-nav-orders]',
        action: 'Click to view orders',
        emoji: '📦',
    },
    {
        title: 'Menu Management 📖',
        description: 'Add, edit, or remove menu items. Update prices, descriptions, images, and availability instantly.',
        target: '[data-nav-menu]',
        action: 'Manage your menu here',
        emoji: '🍕',
    },
    {
        title: 'Table Management 🪑',
        description: 'Manage dine-in tables, generate QR codes for table ordering, and track table status in real-time.',
        target: '[data-nav-tables]',
        action: 'Setup table ordering',
        emoji: '🏷️',
    },
    {
        title: 'Settings & Configuration ⚙️',
        description: 'Customize your restaurant info, operating hours, delivery zones, and special offers.',
        target: '[data-nav-settings]',
        action: 'Configure settings',
        emoji: '🔧',
    },
    {
        title: 'Ready to Go! 🚀',
        description: 'You\'re all set to manage your restaurant like a pro. Start accepting orders and growing your business!',
        emoji: '💼',
    },
];

export default function Onboarding({ type = 'user' }: OnboardingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

    const STEPS = type === 'admin' ? ADMIN_STEPS : USER_STEPS;
    const storageKey = type === 'admin' ? 'hasCompletedAdminOnboarding' : 'hasCompletedOnboarding';

    useEffect(() => {
        const hasCompleted = localStorage.getItem(storageKey);
        if (!hasCompleted) {
            // Small delay to let the page load
            setTimeout(() => setIsVisible(true), 500);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!isVisible) return;

        const step = STEPS[currentStep];
        if (step.target) {
            const element = document.querySelector(step.target) as HTMLElement;
            if (element) {
                setHighlightedElement(element);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setHighlightedElement(null);
        }
    }, [currentStep, isVisible, STEPS]);

    const handleSkip = () => {
        localStorage.setItem(storageKey, 'true');
        setIsVisible(false);
        setHighlightedElement(null);
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSkip();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <>
            {/* Overlay with spotlight effect */}
            <div
                className="fixed inset-0 bg-black/70 z-[100] backdrop-blur-sm transition-all duration-300"
                onClick={handleSkip}
                style={{
                    background: highlightedElement
                        ? `radial-gradient(circle at ${highlightedElement.getBoundingClientRect().left + highlightedElement.offsetWidth / 2}px ${highlightedElement.getBoundingClientRect().top + highlightedElement.offsetHeight / 2}px, transparent 0%, rgba(0,0,0,0.7) 150px)`
                        : undefined
                }}
            />

            {/* Highlighted element ring */}
            {highlightedElement && (
                <div
                    className="fixed z-[101] pointer-events-none rounded-lg"
                    style={{
                        top: highlightedElement.getBoundingClientRect().top - 8,
                        left: highlightedElement.getBoundingClientRect().left - 8,
                        width: highlightedElement.offsetWidth + 16,
                        height: highlightedElement.offsetHeight + 16,
                        border: '3px solid #FF6B35',
                        boxShadow: '0 0 0 4px rgba(255, 107, 53, 0.3), 0 0 30px rgba(255, 107, 53, 0.5)',
                        animation: 'pulse 2s infinite',
                    }}
                />
            )}

            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

            {/* Onboarding Card */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[102] w-full max-w-lg px-4 animate-fadeIn">
                <Card className="p-6 shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-white to-orange-50 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12" />

                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="mb-6 relative z-10">
                        <div className="text-6xl mb-4 animate-bounce">{step.emoji}</div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                            {step.title}
                            {currentStep === 0 && <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />}
                        </h2>
                        <p className="text-gray-700 leading-relaxed text-lg">{step.description}</p>
                        {step.action && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium animate-pulse">
                                <span className="w-2 h-2 bg-primary rounded-full" />
                                {step.action}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-3 bg-gray-200 rounded-full mb-6 overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                        </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex gap-2 mb-6 justify-center">
                        {STEPS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'w-8 bg-primary'
                                        : index < currentStep
                                            ? 'w-2 bg-primary/50'
                                            : 'w-2 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3 relative z-10">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            Skip Tour
                        </Button>

                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePrevious}
                                    className="hover:scale-110 transition-transform"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            )}

                            <Button
                                onClick={handleNext}
                                className="min-w-[120px] bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            >
                                {currentStep === STEPS.length - 1 ? (
                                    <>
                                        Let's Go! 🚀
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Step Counter */}
                    <div className="text-center mt-4 text-sm font-medium text-gray-600">
                        {currentStep + 1} of {STEPS.length}
                    </div>
                </Card>
            </div>
        </>
    );
}

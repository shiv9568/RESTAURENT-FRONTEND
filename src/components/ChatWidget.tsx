import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/utils/api';
import { toast } from 'sonner';
import { MenuItem } from '@/types';

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
    items?: MenuItem[];
    timestamp: Date;
}

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'bot',
            text: 'Hi there! 👋 I\'m your Foodie Concierge. Tell me what you\'re craving! (e.g., "spicy chicken under 300")',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await api.post('/chat', { message: userMsg.text });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                text: response.data.message,
                items: response.data.items,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'bot',
                text: "Sorry, I'm having trouble connecting to the kitchen right now. Please try again later.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (item: MenuItem) => {
        const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = currentCart.findIndex((c: any) => c.id === (item._id || item.id));

        if (existingItemIndex > -1) {
            currentCart[existingItemIndex].quantity += 1;
        } else {
            currentCart.push({
                id: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                image: item.image,
                isVeg: item.isVeg
            });
        }

        localStorage.setItem('cart', JSON.stringify(currentCart));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success(`${item.name} added to cart!`);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[350px] h-[500px] mb-4 shadow-2xl border-primary/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Foodie Concierge</h3>
                                <p className="text-[10px] opacity-80">Always here to help</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white/20 text-primary-foreground"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 bg-muted/30">
                        <div className="flex flex-col gap-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <Avatar className="w-8 h-8 border">
                                        {msg.role === 'bot' ? (
                                            <AvatarImage src="/bot-avatar.png" />
                                        ) : null}
                                        <AvatarFallback className={msg.role === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                                            {msg.role === 'bot' ? 'AI' : 'ME'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`flex flex-col gap-2 max-w-[80%]`}>
                                        <div
                                            className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-card border shadow-sm rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>

                                        {/* Suggested Items */}
                                        {msg.items && msg.items.length > 0 && (
                                            <div className="flex flex-col gap-2 mt-1">
                                                {msg.items.map(item => (
                                                    <div key={item._id || item.id} className="bg-card border rounded-lg p-2 flex gap-3 items-center shadow-sm">
                                                        <div className="w-12 h-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-xs truncate">{item.name}</h4>
                                                            <p className="text-xs text-muted-foreground">₹{item.price}</p>
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            className="h-8 w-8 flex-shrink-0"
                                                            onClick={() => addToCart(item)}
                                                        >
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <Avatar className="w-8 h-8 border">
                                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-card border shadow-sm p-3 rounded-2xl rounded-tl-none flex items-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 bg-background border-t flex gap-2">
                        <Input
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                size="lg"
                className={`h-14 w-14 rounded-full shadow-lg transition-transform duration-300 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                onClick={() => setIsOpen(true)}
            >
                <MessageCircle className="w-7 h-7" />
            </Button>

            {/* Hidden close button that appears when open to animate the transition nicely if we wanted, 
                but for now we just hide the main button and show the window. 
                Actually, let's keep the button visible but change icon? 
                No, the design usually has the window replace the button or sit above it. 
                I'll stick to the current design where the window opens and the button disappears or stays.
                Let's make the button disappear when open to avoid clutter, as the window has a close button.
            */}
        </div>
    );
};

export default ChatWidget;

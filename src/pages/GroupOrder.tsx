import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MenuItem } from '@/types';
import { foodItemsAPI } from '@/utils/apiService';
import api from '@/utils/api';
import { socket } from '@/utils/socket';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';

interface GroupOrder {
    code: string;
    items: {
        foodItem: MenuItem;
        name: string;
        price: number;
        quantity: number;
        addedBy: string;
    }[];
    deadline?: string;
    participants: { name: string; joinedAt: string }[];
    status: 'active' | 'closed' | 'ordered';
}

const GroupOrderPage: React.FC = () => {
    const { groupId } = useParams<{ groupId?: string }>(); // groupId is actually the code
    const navigate = useNavigate();

    const [group, setGroup] = useState<GroupOrder | null>(null);
    const [allItems, setAllItems] = useState<MenuItem[]>([]);
    const [deadline, setDeadline] = useState('');
    const [userName, setUserName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load menu items once
    useEffect(() => {
        const fetchItems = async () => {
            const res = await foodItemsAPI.getAll({ displayOnHomepage: true });
            setAllItems(res.data || []);
        };
        fetchItems();
    }, []);

    // Load group order and connect socket
    useEffect(() => {
        if (groupId) {
            fetchGroupOrder();

            // Connect socket
            socket.emit('join_group', groupId);

            socket.on('group_updated', (updatedGroup: GroupOrder) => {
                setGroup(updatedGroup);
                toast.info('Group order updated');
            });

            return () => {
                socket.off('group_updated');
            };
        }
    }, [groupId]);

    const fetchGroupOrder = async () => {
        try {
            const response = await api.get(`/group-orders/${groupId}`);
            setGroup(response.data);

            // Check if current user is already a participant
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const currentName = currentUser?.name;

            if (currentName) {
                const isParticipant = response.data.participants.some((p: any) => p.name === currentName);
                if (isParticipant) {
                    setHasJoined(true);
                    setUserName(currentName);
                }
            }
        } catch (error) {
            toast.error('Failed to load group order');
            navigate('/group-order');
        }
    };

    const createGroup = async () => {
        setLoading(true);
        try {
            const response = await api.post('/group-orders', { deadline });
            navigate(`/group-order/${response.data.code}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create group order');
        } finally {
            setLoading(false);
        }
    };

    const joinGroup = async () => {
        if (!userName) return;
        try {
            const response = await api.post(`/group-orders/${groupId}/join`, { name: userName });
            setGroup(response.data);
            setHasJoined(true);
            toast.success('Joined group order!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to join group');
        }
    };

    const addItem = async (item: MenuItem) => {
        if (!group || !hasJoined) return;
        try {
            await api.post(`/group-orders/${groupId}/items`, {
                foodItemId: item._id || item.id,
                name: item.name,
                price: item.price,
                quantity: 1,
                addedBy: userName
            });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add item');
        }
    };

    const total = group?.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0;
    const splitCount = group?.participants.length || 1;
    const perPerson = splitCount > 0 ? (total / splitCount).toFixed(2) : total.toFixed(2);

    const [joinCode, setJoinCode] = useState('');

    const handleCheckout = () => {
        if (!group || group.items.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        // Add all group items to local cart
        const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Map group items to cart format
        const newCartItems = group.items.map(item => ({
            id: item.foodItem._id || item.foodItem.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.foodItem.image,
            isVeg: item.foodItem.isVeg
        }));

        // Append logic (checking for duplicates)
        const updatedCart = [...currentCart];
        newCartItems.forEach(newItem => {
            const existingItemIndex = updatedCart.findIndex((c: any) => c.id === newItem.id);
            if (existingItemIndex > -1) {
                updatedCart[existingItemIndex].quantity += newItem.quantity;
            } else {
                updatedCart.push(newItem);
            }
        });

        localStorage.setItem('cart', JSON.stringify(updatedCart));

        // Trigger storage event to update Navbar cart count
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('cartUpdated'));

        toast.success('Group items added to your cart! Proceeding to checkout...');
        navigate('/cart');
    };

    if (!groupId) {
        // Creation view
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center">Group Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Create Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Start a New Order</h3>
                            <p className="text-xs text-muted-foreground">Create a shared cart and invite friends.</p>
                            <Input
                                type="datetime-local"
                                placeholder="Deadline (Optional)"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                            />
                            <Button onClick={createGroup} disabled={loading} className="w-full">
                                {loading ? 'Creating...' : 'Create Group Order'}
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or join existing</span>
                            </div>
                        </div>

                        {/* Join Section */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Join an Order</h3>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter Group Code"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(`/group-order/${joinCode}`)}
                                    disabled={!joinCode.trim()}
                                >
                                    Join
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!group) return <div>Loading...</div>;

    // Join view
    if (!hasJoined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Join Group Order #{group.code}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">Enter your name to join this order.</p>
                        <Input
                            placeholder="Your Name"
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                        />
                        <Button onClick={joinGroup} disabled={!userName}>Join Order</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Existing group view
    return (
        <div className="p-4 container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Group Order #{group.code}</h1>
                        <Button variant="outline" size="sm" onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard!');
                        }}>
                            <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>
                    </div>
                    <p className="text-muted-foreground">Status: <span className="uppercase font-semibold">{group.status}</span></p>
                </div>
                <div className="text-right w-full md:w-auto">
                    <p className="font-bold text-xl">Total: ₹{total}</p>
                    <p className="text-sm text-muted-foreground">₹{perPerson} per person</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Menu Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">Menu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allItems.map(item => (
                            <Card key={item.id} className="flex flex-col justify-between">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold">{item.name}</h3>
                                        <span className="font-bold">₹{item.price}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                                    <Button size="sm" className="w-full" onClick={() => addItem(item)}>
                                        Add to Order
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Participants & Cart */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Participants ({group.participants.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {group.participants.map((p, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                        <span>{p.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Group Cart</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {group.items.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No items added yet.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {group.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                                            <div>
                                                <span className="font-medium">{item.name}</span>
                                                <div className="text-xs text-muted-foreground">
                                                    Added by {item.addedBy}
                                                </div>
                                            </div>
                                            <span className="font-semibold">₹{item.price}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Button className="w-full" size="lg" onClick={handleCheckout}>Proceed to Checkout</Button>
                </div>
            </div>
        </div>
    );
};

export default GroupOrderPage;

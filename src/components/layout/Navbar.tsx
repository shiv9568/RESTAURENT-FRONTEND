import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShoppingCart, User, Search, MapPin, LogOut, Sun, Moon, Users, ChevronDown, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import profile from '@/assets/profile.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCartItemsCount } from '@/utils/cart';
import { useState, useEffect } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

import { TableSelectionDialog } from '@/components/TableSelectionDialog';

import { toast } from 'sonner';
import { encodeTableId, decodeTableId } from '@/utils/tableId';

const Navbar = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const { t } = useTranslation();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Load user from localStorage
    const loadUser = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        setIsSignedIn(true);
      } else {
        setUser(null);
        setIsSignedIn(false);
      }
    };

    loadUser();

    // Listen for auth changes (login/logout)
    window.addEventListener('authChanged', loadUser);
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('authChanged', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, [user, navigate]);

  useEffect(() => {
    // Initialize table number from URL or localStorage
    const searchParams = new URLSearchParams(window.location.search);
    const tableParam = searchParams.get('table');

    if (tableParam) {
      const decoded = decodeTableId(tableParam);
      setTableNumber(decoded);
      localStorage.setItem('tableNumber', decoded);
    } else {
      const stored = localStorage.getItem('tableNumber');
      if (stored) {
        setTableNumber(stored);
      }
    }
  }, []);

  const updateCartCount = () => {
    setCartCount(getCartItemsCount());
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    // Also listen for storage events in case cart is updated in another tab
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsSignedIn(false);

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('authChanged'));

    navigate('/');
  };

  const handleTableSelect = (table: string, userName: string, tableToken?: string) => {
    localStorage.setItem('tableNumber', table);
    // Scope user name to table
    localStorage.setItem(`dineInUserName_${table}`, userName);
    // Also set generic key for backward compatibility or current session
    localStorage.setItem('dineInUserName', userName);

    if (tableToken) {
      localStorage.setItem('tableToken', tableToken);
    }

    setTableNumber(table);

    // Update URL with encoded table ID and token
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('table', encodeTableId(table));
    if (tableToken) {
      newUrl.searchParams.set('token', tableToken);
    }
    window.history.pushState({}, '', newUrl);

    window.dispatchEvent(new Event('storage'));
  };

  const handleLeaveTable = () => {
    if (tableNumber) {
      localStorage.removeItem('tableNumber');
      localStorage.removeItem(`dineInUserName_${tableNumber}`);
      setTableNumber(null);
      navigate('/');
      toast.success('You have left the table.');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={tableNumber ? `/?table=${encodeTableId(tableNumber)}${localStorage.getItem('tableToken') ? `&token=${localStorage.getItem('tableToken')}` : ''}` : '/'} className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="D&G Restaurent"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="hidden md:block text-xl font-bold text-foreground">D&G Restaurent</span>
          </Link>

          {/* Delivery / Dine-in Toggle */}
          <div className="flex items-center space-x-2">
            {tableNumber ? (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center h-8 px-3 gap-2 text-xs font-medium border border-primary text-primary bg-primary/5 rounded-md cursor-pointer hover:bg-primary/10 transition-colors group">
                        <span className="text-sm">🍽️</span>
                        <span className="font-semibold">Table {decodeTableId(tableNumber)}</span>
                        <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to change name or switch table</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsTableDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Change Name / Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTableDialogOpen(true)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-sm">🍽️</span>
                Select Table
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground w-8 h-8 md:w-10 md:h-10"
            >
              {theme === 'light' ? <Moon className="h-4 w-4 md:h-5 md:w-5" /> : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              className="relative w-8 h-8 md:w-10 md:h-10"
              onClick={() => navigate('/group-order')}
              title="Group Order"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </Button> */}
            <Button
              variant="ghost"
              size="icon"
              className="relative w-8 h-8 md:w-10 md:h-10"
              onClick={() => navigate(tableNumber ? `/cart?table=${encodeTableId(tableNumber)}${localStorage.getItem('tableToken') ? `&token=${localStorage.getItem('tableToken')}` : ''}` : '/cart')}
              data-cart-icon
            >
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>


            {isSignedIn ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-profile-menu>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                        <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center gap-3 p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                        <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user?.email || 'user@example.com'}
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <TableSelectionDialog
        isOpen={isTableDialogOpen}
        onClose={() => setIsTableDialogOpen(false)}
        onSelect={handleTableSelect}
        initialUserName={user?.name || (tableNumber ? localStorage.getItem(`dineInUserName_${tableNumber}`) : localStorage.getItem('dineInUserName')) || ''}
        preselectedTable={tableNumber}
      />
    </nav>
  );
};

export default Navbar;

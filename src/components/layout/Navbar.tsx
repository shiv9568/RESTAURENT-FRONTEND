import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, LogOut, Sun, Moon, Users } from 'lucide-react';
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
import { getCartItemsCount } from '@/utils/cart';
import { useState, useEffect } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
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
  }, []);

  useEffect(() => {
    // Check for table number in URL
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table) {
      localStorage.setItem('tableNumber', table);
      setTableNumber(table);
    } else {
      const storedTable = localStorage.getItem('tableNumber');
      if (storedTable) {
        setTableNumber(storedTable);
      }
    }

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Also listen for custom cart update events
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const updateCartCount = () => {
    setCartCount(getCartItemsCount());
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsSignedIn(false);

    // Dispatch event to notify other components
    window.dispatchEvent(new Event('authChanged'));

    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="D&G Restaurent"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="hidden md:block text-xl font-bold text-foreground">D&G Restaurent</span>
          </Link>

          {/* Delivery / Dine-in Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                onClick={() => {
                  localStorage.removeItem('tableNumber');
                  setTableNumber(null);
                  window.dispatchEvent(new Event('storage'));
                }}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-medium rounded-md transition-all ${!tableNumber
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Delivery
              </button>
              <button
                onClick={() => {
                  const input = prompt('Enter Table Number (or scan QR code):');
                  if (input) {
                    localStorage.setItem('tableNumber', input);
                    setTableNumber(input);
                    window.dispatchEvent(new Event('storage'));
                  }
                }}
                className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-medium rounded-md transition-all ${tableNumber
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Dine-in
              </button>
            </div>

            {/* Location Display (only for Delivery) */}
            {!tableNumber && (
              <div className="hidden lg:flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="truncate max-w-[150px]">Muzaffarnagar...</span>
              </div>
            )}

            {/* Table Display (only for Dine-in) */}
            {tableNumber && (
              <div className="hidden lg:flex items-center text-sm font-medium text-primary">
                <span className="mr-1">🍽️</span> Table {tableNumber}
              </div>
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
              onClick={() => navigate('/cart')}
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
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-pink-600" data-profile-menu>
                      <img
                        src={user?.avatar || profile}
                        className="h-8 w-8 rounded-full object-cover border border-green-200"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center gap-3 p-3">
                      <img
                        src={user?.avatar || profile}
                        alt={user?.name || 'User'}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                      />
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
    </nav>
  );
};

export default Navbar;

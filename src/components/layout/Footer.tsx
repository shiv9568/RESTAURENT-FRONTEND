import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { restaurantBrandAPI } from '@/utils/api';

const Footer = () => {
  const [brand, setBrand] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await restaurantBrandAPI.get();
        setBrand(res.data || null);
      } catch { }
    })();
  }, []);

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.jpg" alt="logo" className="w-10 h-10 rounded" />
              <span className="text-xl font-bold">{brand?.name || 'D&G Restaurent'}</span>
            </div>
            {brand?.openTime && brand?.closeTime && (
              <div className="text-sm text-muted-foreground mb-2">
                Open {brand.openTime} - {brand.closeTime}
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Your favorite food delivered fast and fresh to your doorstep.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">About Us</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Careers</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Contact Us</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Blog</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Help Center</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Safety</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Terms & Conditions</span>
              </li>
              <li>
                <span className="text-muted-foreground cursor-not-allowed opacity-70">Privacy Policy</span>
              </li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h3 className="font-semibold mb-4">Download App</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get the app for exclusive offers and faster ordering
            </p>
            <div className="space-y-2">
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

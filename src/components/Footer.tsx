import { Crown, Facebook, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#E3F2FD] dark:bg-[#1E3A5F] border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          >
            <div className="relative">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0 drop-shadow-sm" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 -z-10" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] via-[hsl(263,70%,65%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent drop-shadow-sm">
              SwipeRush
            </span>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1877F2] dark:text-[#8AB4F8] hover:opacity-80 transition-opacity"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E4405F] dark:text-[#FF6B9D] hover:opacity-80 transition-opacity"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#000000] dark:text-[#FFFFFF] hover:opacity-80 transition-opacity"
              aria-label="TikTok"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm sm:text-base text-muted-foreground dark:text-muted-foreground">
            © {currentYear} SwipeRush. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


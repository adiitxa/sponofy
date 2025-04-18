
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  MapPin, 
  Phone 
} from "lucide-react";

const Footer = () => {
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle subscribe logic here
    console.log("Subscribe form submitted");
  };

  return (
    <footer className="bg-primary/10 dark:bg-primary/20 pt-16 pb-8 relative">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          <div className="space-y-4 text-left">
            <Link
              to="/"
              className="flex items-start text-2xl font-bold text-primary transition-all duration-300 hover:opacity-90"
            >
              <span>Sponofy</span>
            </Link>
            <p className="text-foreground/70">
              Connecting sponsors and clients for meaningful and impactful partnerships.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-foreground/60 hover:text-primary" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/sponofy?t=jv723NGEEzaHN0oFOO-Bdw&s=08" className="text-foreground/60 hover:text-primary" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/sponofy?utm_source=qr&igsh=MXY0aDc4ZnVmNGV1eQ==" className="text-foreground/60 hover:text-primary" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/sponofy-4208b3356?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" className="text-foreground/60 hover:text-primary" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-foreground/70 hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/#about" className="text-foreground/70 hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/#services" className="text-foreground/70 hover:text-primary transition-colors">Services</Link>
              </li>
              <li>
                <Link to="/#sponsorship-forms" className="text-foreground/70 hover:text-primary transition-colors">Sponsorship</Link>
              </li>
              <li>
                <Link to="/#faq" className="text-foreground/70 hover:text-primary transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <span className="text-foreground/70">Wagholi, Pune, Maharashtra 412207</span>
              </li>
              {/* <li className="flex items-start">
                <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <span className="text-foreground/70"></span>
              </li> */}
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <span className="text-foreground/70">sponofyweb@gmail.com</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold">Subscribe</h3>
            <p className="text-foreground/70">
              Stay updated with the latest sponsorship opportunities.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-background focus-visible:ring-primary" 
                required
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-left text-foreground/60">
          <p>© {new Date().getFullYear()} Sponofy. All rights reserved.</p>
          <div className="mt-2 space-x-4 text-sm">
            <Link to="/admin/login" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { Link } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={snapcutLogo} alt="SnapCut AI" className="h-8 w-8" />
              <span className="text-lg font-bold gradient-text">SnapCut AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered background removal in seconds.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/api-docs" className="hover:text-foreground transition-colors">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact-us" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
              <li><Link to="/service-delivery" className="hover:text-foreground transition-colors">Service Delivery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SnapCut AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

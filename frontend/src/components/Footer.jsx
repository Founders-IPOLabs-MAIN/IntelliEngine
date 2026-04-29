import { Link } from "react-router-dom";
import { Scale, FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <img src="/setu-logo.png" alt="SETU Labs" className="h-8 w-auto object-contain" data-testid="footer-logo" />
            <div>
              <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} IPO Labs Private Limited</p>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/legal-disclaimer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors"
              data-testid="footer-legal-disclaimer"
            >
              <Scale className="w-4 h-4" />
              Legal Disclaimer
            </Link>
            <Link
              to="/terms-of-use"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1DA1F2] transition-colors"
              data-testid="footer-terms-of-use"
            >
              <FileText className="w-4 h-4" />
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

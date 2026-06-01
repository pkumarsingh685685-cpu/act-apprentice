import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlaceholderImage } from './PlaceholderImage';

export function Footer() {
  const config = useStore((state) => state.config);
  const logos = useStore((state) => state.logos);
  
  return (
    <footer className="bg-[#1c3f60] text-gray-200 mt-12 py-8 mt-auto">
      <div className="w-full mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            Contact Information
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {config.contactAddress}
          </p>
          <div className="mt-4 text-sm">
            <p><strong>Mobile:</strong> {config.contactMobile}</p>
            <p><strong>Email:</strong> {config.contactEmail}</p>
          </div>
        </div>

        <div>
           <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            Important Links
          </h3>
          <ul className="text-sm space-y-2">
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/notifications" className="hover:text-white transition-colors">Apprentice Notification</Link></li>
            <li><Link to="/results" className="hover:text-white transition-colors">Results</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            About Portal
          </h3>
          <p className="text-sm leading-relaxed">
            Official recruitment portal for ACT Apprentices.
          </p>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-8 mt-8 pt-6 border-t border-[#15304a] flex flex-col md:flex-row justify-between items-center text-xs">
        <p>Copyright &copy; {new Date().getFullYear()} ACT Apprentice Cell. All rights reserved.</p>
        
        <div className="mt-4 md:mt-0 relative px-4 py-2 rounded flex items-center overflow-hidden">
          <style>{`
            @keyframes bg-bhuk-bhak {
              0%, 100% { background-color: transparent; }
              50% { background-color: rgba(220, 38, 38, 0.9); }
            }
          `}</style>
          <div className="absolute inset-0" style={{ animation: "bg-bhuk-bhak 1s infinite" }}></div>
          <p className="relative z-10 text-white font-bold text-base md:text-[17px] tracking-wide drop-shadow-md">
            Developer Credit: Prashant Kumar Singh, Sr.Clerk/Katihar Div.
          </p>
        </div>
      </div>
    </footer>
  );
}

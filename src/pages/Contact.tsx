import { useStore } from '../store/useStore';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Contact() {
  const config = useStore((state) => state.config);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#1c3f60] p-6 text-white">
          <h1 className="text-2xl font-bold">Contact Us</h1>
          <p className="opacity-80 mt-2">Get in touch with the ACT Apprentice Cell Katihar</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Office Detail</h2>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Address</h3>
                <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{config.contactAddress}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Mobile</h3>
                <p className="text-gray-600 text-sm mt-1">{config.contactMobile}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email</h3>
                <p className="text-gray-600 text-sm mt-1">{config.contactEmail}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Office Hours</h3>
                <p className="text-gray-600 text-sm mt-1">Monday - Friday: 10:00 AM - 06:00 PM<br/>Closed on Public Holidays</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 flex items-center justify-center min-h-[300px]">
            <div className="text-center text-gray-500">
               <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p className="font-medium">Map location is unavailable in preview.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

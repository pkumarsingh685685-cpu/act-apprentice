import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function Contact() {
  const config = useStore((state) => state.config) as any;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, "contact_submissions"), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        status: "New",
        createdAt: serverTimestamp(),
      });
      toast.success("Thank you! Your message has been sent successfully.");
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      console.error("Error submitting form:", err);
      toast.error(`Error: ${err.message || 'Failed to submit message.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      {/* Simple Back button */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#1c3f60] p-6 text-white">
          <h1 className="text-2xl font-bold">{t('nav_contact_us')}</h1>
          <p className="opacity-80 mt-2">{t('contact_subtitle')}</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">{t('contact_office_detail')}</h2>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('contact_address')}</h3>
                <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{config.contactAddress}</p>
              </div>
            </div>

            {config.contactMobile && config.contactMobile !== "8709796234" && (
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact_mobile')}</h3>
                  <p className="text-gray-600 text-sm mt-1">{config.contactMobile}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('contact_email')}</h3>
                <p className="text-gray-600 text-sm mt-1">{config.contactEmail}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{t('contact_office_hours')}</h3>
                <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{t('contact_office_hours_text')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name * / पूरा नाम *</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60]"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60]"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60]"
                    placeholder="Enter phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea 
                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-[#1c3f60] min-h-[120px]"
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1c3f60] hover:bg-blue-900 text-white font-medium py-3 rounded flex items-center justify-center gap-2 transition disabled:opacity-70"
              >
                {loading ? "Sending..." : "Submit Message"}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

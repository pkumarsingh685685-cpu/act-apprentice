import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PlaceholderImage } from './PlaceholderImage';
import { motion, AnimatePresence } from 'motion/react';

export function HeroSlider() {
  const sliderImages = useStore((state) => state.sliderImages);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeImages = sliderImages
    ?.filter((img) => img?.enabled)
    .sort((a, b) => a.order - b.order)
    .slice(0, 10) || [];

  useEffect(() => {
    if (activeImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, [activeImages.length]);

  if (activeImages.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200 relative bg-gray-900 aspect-[16/9] sm:aspect-[21/9]">
        <div className="w-full h-full flex items-center justify-center opacity-70">
          <PlaceholderImage text="Upload Slider Images in Admin Dashboard" className="border-none !bg-transparent text-gray-400 w-full h-full" />
        </div>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md border border-gray-200 relative bg-gray-900 aspect-[16/9] sm:aspect-[21/9] group">
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
          transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img 
            src={activeImages[currentIndex].image} 
            alt={activeImages[currentIndex].title} 
            className="w-full h-full object-fill object-center opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c3f60]/90 via-black/20 to-transparent flex items-end pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="p-4 sm:p-6 text-white text-shadow-sm pointer-events-auto"
            >
              {activeImages[currentIndex].title && (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{activeImages[currentIndex].title}</h2>
              )}
              {activeImages[currentIndex].description && (
                <p className="text-xs sm:text-sm md:text-base font-medium opacity-90 max-w-sm sm:max-w-2xl line-clamp-2 md:line-clamp-none">
                  {activeImages[currentIndex].description}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {activeImages.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {activeImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {activeImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

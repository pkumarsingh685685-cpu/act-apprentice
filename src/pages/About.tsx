import React from 'react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-gray-800 leading-relaxed">
         <div className="bg-[#1c3f60] p-6 text-white border-b-4 border-[#e31837]">
          <h1 className="text-2xl font-bold">About ACT Apprentice Cell Katihar</h1>
          <p className="opacity-90 mt-2 font-medium">Northeast Frontier Railway, Katihar Division</p>
        </div>
        
        <div className="p-6 md:p-8 space-y-6 text-sm md:text-base">
          <p>
            Welcome to the official portal of the ACT Apprentice Cell part of the Personnel Branch, Katihar Division (Northeast Frontier Railway). This portal has been designed to provide seamless access to recruitment notices, merit panels, circulars, and other updates relevant to Act Apprentices out of our division.
          </p>

          <h2 className="text-xl font-bold text-[#1c3f60] mt-8 mb-4 border-b pb-2">Our Objective</h2>
          <p>
            In alignment with the directives from the Ministry of Railways and the Apprentices Act, the cell is aimed at streamlining the engagement and training evaluation of trade apprentices at various workshops, sheds, and departments within the Katihar division boundaries to cultivate skilled manpower for the nation.
          </p>

          <h2 className="text-xl font-bold text-[#1c3f60] mt-8 mb-4 border-b pb-2">Location & Jurisdiction</h2>
          <p>
            Headquartered at the DRM Office set in the heart of Katihar (Bihar), the division covers a crucial stretch connecting vital parts of Eastern and Northeast India serving both passengers and freight channels actively.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-8 flex items-start gap-3">
             <div className="text-blue-600 shrink-0 mt-1">ℹ️</div>
             <p className="text-blue-900 text-sm font-medium">
               Candidates are advised to regularly check the "Notice Board" and "Apprentice Notification" tabs for the latest official updates. Do not fall prey to fraudulent job guarantees.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

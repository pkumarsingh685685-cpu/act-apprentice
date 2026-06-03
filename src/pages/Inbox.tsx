import React, { useState } from "react";
import { PlaceholderImage } from "../components/PlaceholderImage";
import { useStore } from "../store/useStore";
import { CheckCircle2, XCircle, FileText, Trash2 } from "lucide-react";

export default function Inbox() {
  const [activeTab, setActiveTab] = useState<"messages" | "sfDetails">("sfDetails");
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const toggleIssuedSFFinalised = useStore((state) => state.toggleIssuedSFFinalised);
  const deleteIssuedSF = useStore((state) => state.deleteIssuedSF);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 bg-gray-50 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#152060]">Inbox</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 shrink-0 overflow-x-auto">
        <button
          className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors relative ${activeTab === 'sfDetails' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}
          onClick={() => setActiveTab('sfDetails')}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            STANDARD FORM DETAILS
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-1">{issuedSFs.length}</span>
          </div>
        </button>
        <button
          className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors relative ${activeTab === 'messages' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}
          onClick={() => setActiveTab('messages')}
        >
          MESSAGES
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {activeTab === 'sfDetails' && (
          <div className="flex-1 overflow-auto">
            {issuedSFs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <PlaceholderImage text="No SF Records" className="mx-auto block bg-gray-100/50 w-40 h-40" />
                  <p className="text-gray-500 mt-6 text-base whitespace-pre-wrap leading-relaxed">
                    No standard forms have been generated and issued today. 
                    Generated forms will appear here automatically.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 sticky top-0 text-gray-700 font-semibold shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-200">Date Issued</th>
                    <th className="px-6 py-4 border-b border-gray-200">Type of SF</th>
                    <th className="px-6 py-4 border-b border-gray-200">Employee Name</th>
                    <th className="px-6 py-4 border-b border-gray-200">Designation</th>
                    <th className="px-6 py-4 border-b border-gray-200 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issuedSFs.map((sf) => (
                    <tr key={sf.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-800">{sf.issuedDate}</td>
                      <td className="px-6 py-4 font-medium text-indigo-600">{sf.sfType}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{sf.employeeName}</td>
                      <td className="px-6 py-4 text-gray-600">{sf.designation}</td>
                      <td className="px-6 py-4 justify-center flex items-center gap-2">
                        <button 
                          onClick={() => toggleIssuedSFFinalised(sf.id)}
                          className={`flex items-center gap-2 justify-center px-3 py-1.5 rounded-full hover:shadow transition-all border ${sf.isFinalised ? 'text-green-700 border-green-200 bg-green-50' : 'text-amber-600 border-amber-200 bg-amber-50'} font-medium`}
                          title={sf.isFinalised ? "Change to Pending" : "Mark as FINALLY ISSUED"}
                        >
                          {sf.isFinalised ? (
                            <><CheckCircle2 className="w-4 h-4" /> FINALLY ISSUED</>
                          ) : (
                            <><XCircle className="w-4 h-4" /> PENDING</>
                          )}
                        </button>
                        <button
                          onClick={() => deleteIssuedSF(sf.id)}
                          className="flex items-center justify-center p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <PlaceholderImage text="Inbox Empty" className="mx-auto block w-40 h-40" />
              <p className="text-gray-500 mt-6 text-base">There are currently no messages in your inbox.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

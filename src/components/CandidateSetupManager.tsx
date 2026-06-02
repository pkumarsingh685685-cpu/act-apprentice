import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { Link, Search, CheckCircle, Database } from 'lucide-react';

export function CandidateSetupManager() {
  const config = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);
  
  const [csvUrl, setCsvUrl] = useState(config.candidateDataCsvUrl || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfig('candidateDataCsvUrl', csvUrl);
      toast.success('Candidate Data source URL saved successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-500" />
          Candidate Dashboard Setup
        </h3>
        <p className="text-sm text-gray-500 mt-1">Configure the data source for candidate portal login.</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Sheet CSV / JSON Endpoint URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/e/2PACX.../pub?output=csv"
                  value={csvUrl}
                  onChange={(e) => setCsvUrl(e.target.value)}
                  className="pl-10 w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {loading ? "Saving..." : "Save Link"} <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mt-4 text-sm text-blue-800">
            <h4 className="font-semibold mb-2">How to host Candidate Data on Google Sheets:</h4>
            <ol className="list-decimal pl-5 space-y-1 mt-1">
              <li>Create a new Google Sheet with candidate data.</li>
              <li>Include column names exactly containing: <strong>"Employee"</strong> (or Emp/ID) and <strong>"DOB"</strong> (or Date of Birth) for login.</li>
              <li>Make sure the date formatting in the sheet matches how they will type it (e.g. YYYY-MM-DD or DD/MM/YYYY).</li>
              <li>In Google Sheets: Go to <strong>File</strong> {'>'} <strong>Share</strong> {'>'} <strong>Publish to web</strong>.</li>
              <li>Choose "Entire Document" and format as "Comma-separated values (.csv)".</li>
              <li>Copy the generated published link and paste it in the field above.</li>
            </ol>
          </div>
        </form>
      </div>
    </div>
  );
}

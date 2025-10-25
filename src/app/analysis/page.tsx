'use client';

import { useEffect, useState } from 'react';
import { analyzeAd, AdAnalysis } from '@/services/reka';
import ChatWindow from '@/components/ChatWindow';

const AnalysisPage = () => {
  const [adCreative, setAdCreative] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AdAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const creative = sessionStorage.getItem('adCreative');
    if (creative) {
      setAdCreative(creative);
      analyzeAd(creative)
        .then((result) => {
          setAnalysis(result);
        })
        .catch((error) => {
          console.error('Failed to analyze ad:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ad Creative</h2>
        {adCreative ? (
          adCreative.startsWith('data:image') ? (
            <img src={adCreative} alt="Ad Creative" className="max-w-full rounded" />
          ) : (
            <video src={adCreative} controls className="max-w-full rounded" />
          )
        ) : (
          <p>No ad creative found. Please upload one first.</p>
        )}
      </div>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>
          <div className="bg-gray-100 p-4 rounded">
            {isLoading ? (
              <p>Analyzing...</p>
            ) : analysis ? (
              <div className="space-y-2">
                <p><strong>Sentiment:</strong> {analysis.sentiment}</p>
                <p><strong>Tone:</strong> {analysis.tone.join(', ')}</p>
                <p><strong>Objects:</strong> {analysis.objects.join(', ')}</p>
                <p><strong>Predicted Demographic:</strong> {analysis.demographic}</p>
                <p><strong>Summary:</strong> {analysis.summary}</p>
              </div>
            ) : (
              <p>Could not analyze ad. Please check the console for errors.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Audience Simulation</h2>
          <ChatWindow analysis={analysis} />
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
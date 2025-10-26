'use client';

import { useState, useEffect } from 'react';
import { AdAnalysis, ChatTurn } from '@/lib/types';
import ChatWindow from '@/components/ChatWindow';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [adCreativeUrl, setAdCreativeUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AdAnalysis | null>(null);
  const [chat, setChat] = useState<ChatTurn[] | null>(null);
  const [displayedChat, setDisplayedChat] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setAdCreativeUrl(objectUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setIsLoading(true);
      setAnalysis(null);
      setChat(null);
      setDisplayedChat([]);

      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            const response = await fetch('/api/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ creative: event.target.result as string }),
            });

            if (!response.ok) {
              throw new Error('Failed to analyze ad');
            }

            const result = await response.json();
            setAnalysis(result.analysis);
            setChat(result.chat);
          } catch (error) {
            console.error('Failed to analyze ad:', error);
            setIsLoading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    console.log("Chat state updated:", chat);
    if (chat && chat.length > 0) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < chat.length) {
          console.log("Displaying chat message:", chat[currentIndex]);
          setDisplayedChat((prev) => [...prev, chat[currentIndex]]);
          currentIndex++;
        } else {
          setIsLoading(false);
          clearInterval(interval);
        }
      }, 2000); // 2-second delay

      return () => clearInterval(interval);
    } else if (analysis) {
      // If there's analysis but no chat, stop loading
      console.log("Analysis updated, but no chat. Stopping loading.");
      setIsLoading(false);
    }
  }, [chat, analysis]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Upload Your Ad</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ad-file" className="mb-2 block text-lg font-medium">
              Select an image or video file:
            </label>
            <input
              type="file"
              id="ad-file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
          <button
            type="submit"
            disabled={!file || isLoading}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Ad'}
          </button>
        </form>
      </div>

      {(isLoading || analysis || adCreativeUrl) && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold">Ad Creative</h2>
            {adCreativeUrl &&
              (file?.type.startsWith('image') ? (
                <img
                  src={adCreativeUrl}
                  alt="Ad Creative"
                  className="max-w-full rounded"
                />
              ) : (
                <video
                  src={adCreativeUrl}
                  controls
                  className="max-w-full rounded"
                />
              ))}
          </div>
          <div className="space-y-8">
            <div>
              <h2 className="mb-4 text-2xl font-bold">AI Analysis</h2>
              <div className="rounded bg-gray-100 p-4">
                {isLoading && !analysis ? (
                  <p>Analyzing...</p>
                ) : analysis ? (
                  <div className="space-y-2">
                    <p>
                      <strong>Sentiment:</strong> {analysis.sentiment}
                    </p>
                    <p>
                      <strong>Main Themes:</strong>{' '}
                      {analysis.main_themes.join(', ')}
                    </p>
                    <p>
                      <strong>Target Demographic:</strong>{' '}
                      {analysis.target_demographic}
                    </p>
                    <p>
                      <strong>Summary:</strong> {analysis.summary}
                    </p>
                  </div>
                ) : (
                  <p>Analysis will appear here.</p>
                )}
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-bold">Audience Simulation</h2>
              <ChatWindow chat={displayedChat} isSimulating={isLoading && !analysis} />
              <pre>{JSON.stringify(chat, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
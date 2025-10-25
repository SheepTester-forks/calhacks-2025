'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      // In a real application, you would upload the file to a server.
      // For this hackathon, we'll store it in session storage and
      // redirect to the analysis page.
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          sessionStorage.setItem('adCreative', event.target.result as string);
          router.push('/analysis');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Upload Your Ad</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ad-file" className="block text-lg font-medium mb-2">
            Select an image or video file:
          </label>
          <input
            type="file"
            id="ad-file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>
        <button
          type="submit"
          disabled={!file}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          Analyze Ad
        </button>
      </form>
    </div>
  );
};

export default UploadPage;
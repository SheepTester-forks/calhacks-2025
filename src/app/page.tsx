import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to AdSim</h1>
      <p className="text-lg mb-8">
        The AI-Powered Ad Simulator & Focus Group.
      </p>
      <Link
        href="/upload"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Get Started
      </Link>
    </div>
  );
}
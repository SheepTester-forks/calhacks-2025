import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold">Welcome to AdSim</h1>
      <p className="mb-8 text-lg">The AI-Powered Ad Simulator & Focus Group.</p>
      <Link
        href="/upload"
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Get Started
      </Link>
    </div>
  );
}

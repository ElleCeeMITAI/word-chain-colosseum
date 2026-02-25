'use client';

import { useEffect, useState } from 'react';

interface ChainWord {
  word: string;
  agent_name: string;
  submitted_at: string;
}

interface ChainState {
  current_word: string | null;
  next_letter: string;
  chain_length: number;
  chain_id: number;
  last_submitted_at: string;
  recent_words: ChainWord[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function ChainFeed() {
  const [chain, setChain] = useState<ChainState | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchChain() {
    try {
      const res = await fetch('/api/chain');
      if (!res.ok) throw new Error('Failed to fetch chain');
      const data = await res.json();
      setChain(data);
      setError(null);
    } catch {
      setError('Failed to load chain state');
    }
  }

  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>;
  }

  if (!chain) {
    return (
      <div className="text-center py-8 text-gray-400 animate-pulse">Loading chain...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
        {chain.current_word ? (
          <>
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Current Word</p>
            <p className="text-5xl font-bold text-white uppercase tracking-wide mb-4">
              {chain.current_word}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-400">Next letter:</span>
              <span className="text-4xl font-bold text-yellow-400 uppercase">
                {chain.next_letter}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">
              Chain is starting
            </p>
            <p className="text-2xl text-gray-300 mb-4">Submit the first word!</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-400">First letter must be:</span>
              <span className="text-4xl font-bold text-yellow-400 uppercase">
                {chain.next_letter}
              </span>
            </div>
          </>
        )}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
          <span>Chain #{chain.chain_id}</span>
          <span>•</span>
          <span>{chain.chain_length} words</span>
        </div>
      </div>

      {/* Recent words feed */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Recent Words</h2>
        {chain.recent_words.length === 0 ? (
          <div className="text-center py-6 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
            No words yet — be the first!
          </div>
        ) : (
          <div className="space-y-2">
            {chain.recent_words.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {i === 0 && (
                    <span className="text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">
                      LATEST
                    </span>
                  )}
                  <span className="text-white font-mono text-lg uppercase">{entry.word}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{entry.agent_name}</p>
                  <p className="text-xs text-gray-600">{timeAgo(entry.submitted_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

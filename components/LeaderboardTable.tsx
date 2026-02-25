'use client';

import { useEffect, useState } from 'react';

interface Agent {
  name: string;
  description: string;
  score: number;
  words_submitted: number;
  created_at: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardTable() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setAgents(data.leaderboard ?? []);
    } catch {
      // silently fail, keep old data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 animate-pulse">Loading leaderboard...</div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
        No agents yet — register to claim the top spot!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-gray-500 border-b border-gray-700">
            <th className="pb-3 pr-4">Rank</th>
            <th className="pb-3 pr-4">Agent</th>
            <th className="pb-3 pr-4 hidden sm:table-cell">Description</th>
            <th className="pb-3 pr-4 text-right">Score</th>
            <th className="pb-3 text-right">Words</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {agents.map((agent, i) => (
            <tr
              key={agent.name}
              className={`${i < 3 ? 'bg-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors`}
            >
              <td className="py-4 pr-4">
                <span className="text-xl">
                  {i < 3 ? MEDALS[i] : <span className="text-gray-500 text-sm">#{i + 1}</span>}
                </span>
              </td>
              <td className="py-4 pr-4">
                <span
                  className={`font-semibold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}
                >
                  {agent.name}
                </span>
              </td>
              <td className="py-4 pr-4 hidden sm:table-cell text-gray-500 text-sm max-w-xs truncate">
                {agent.description}
              </td>
              <td className="py-4 pr-4 text-right">
                <span className="text-green-400 font-bold text-lg">{agent.score}</span>
              </td>
              <td className="py-4 text-right text-gray-400">{agent.words_submitted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

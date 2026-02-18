"use client";

import { useState } from "react";
import NavigationBar from "@/widgets/navigation-bar/NavigationBar";
import GuestBanner from "@/widgets/guest-banner/GuestBanner";
import HistoryCard from "@/features/translation-history/ui/HistoryCard";
import Button from "@/shared/ui/Button";
import Modal from "@/shared/ui/Modal";
import type { GlossToken } from "@/entities/gloss/types";

interface HistoryEntry {
  id: string;
  inputText: string;
  glossTokens: GlossToken[];
  source: "typed" | "voice";
  platform: "web" | "extension";
  relativeTime: string;
}

// Demo data
const DEMO_HISTORY: HistoryEntry[] = [
  {
    id: "1",
    inputText: "Hello, how are you today? I hope everything is going well with your studies.",
    glossTokens: [
      { id: "h1", text: "HELLO", isSpelled: false, isActive: false },
      { id: "h2", text: "HOW", isSpelled: false, isActive: false },
      { id: "h3", text: "YOU", isSpelled: false, isActive: false },
      { id: "h4", text: "TODAY", isSpelled: false, isActive: false },
    ],
    source: "typed",
    platform: "web",
    relativeTime: "2 min ago",
  },
  {
    id: "2",
    inputText: "Thank you for helping me understand sign language better.",
    glossTokens: [
      { id: "h5", text: "THANK", isSpelled: false, isActive: false },
      { id: "h6", text: "YOU", isSpelled: false, isActive: false },
      { id: "h7", text: "HELP", isSpelled: false, isActive: false },
      { id: "h8", text: "ME", isSpelled: false, isActive: false },
      { id: "h9", text: "UNDERSTAND", isSpelled: false, isActive: false },
      { id: "h10", text: "SIGN", isSpelled: false, isActive: false },
      { id: "h11", text: "LANGUAGE", isSpelled: false, isActive: false },
    ],
    source: "voice",
    platform: "web",
    relativeTime: "15 min ago",
  },
  {
    id: "3",
    inputText: "I want to learn more about sign language.",
    glossTokens: [
      { id: "h12", text: "ME", isSpelled: false, isActive: false },
      { id: "h13", text: "WANT", isSpelled: false, isActive: false },
      { id: "h14", text: "LEARN", isSpelled: true, isActive: false },
      { id: "h15", text: "SIGN", isSpelled: false, isActive: false },
      { id: "h16", text: "LANGUAGE", isSpelled: false, isActive: false },
    ],
    source: "typed",
    platform: "extension",
    relativeTime: "1 hour ago",
  },
];

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>(DEMO_HISTORY);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAll = () => {
    setHistory([]);
    setShowClearModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <GuestBanner remaining={3} />

      <main className="flex-1 w-full max-w-[800px] mx-auto p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-text-1">Translation History</h1>
            <p className="text-sm text-text-2 mt-0.5">{history.length} translation{history.length !== 1 ? "s" : ""}</p>
          </div>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowClearModal(true)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Clear All
            </Button>
          )}
        </div>

        {/* History list */}
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-text-1 mb-1">No translations yet</h3>
            <p className="text-sm text-text-2 max-w-xs mb-4">
              Your translation history will appear here. Start translating to build your history.
            </p>
            <a href="/translate">
              <Button variant="primary" size="md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
                Start Translating
              </Button>
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <HistoryCard
                key={entry.id}
                inputText={entry.inputText}
                glossTokens={entry.glossTokens}
                source={entry.source}
                platform={entry.platform}
                relativeTime={entry.relativeTime}
                onReplay={() => console.log("Replay:", entry.id)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear All History"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowClearModal(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleClearAll}>Clear All</Button>
          </>
        }
      >
        <p className="text-sm text-text-2 leading-relaxed">
          Are you sure you want to clear all your translation history? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

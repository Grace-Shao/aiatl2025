"use client"

import React from "react";
import ThreadList from "./ThreadList";
import MemeFeed from "./MemeFeed";

export default function Forum() {
  return (
    <div className="flex gap-6 p-5">
      <div className="flex-[2] min-w-[320px]">
        <h2 className="text-2xl font-bold text-white mb-4">Live Discussion</h2>
        <ThreadList />
      </div>

      <div className="flex-1 min-w-[300px] sticky top-4">
        <h3 className="text-lg font-medium text-white mb-4">Trending Content</h3>
        <MemeFeed />
      </div>
    </div>
  );
}

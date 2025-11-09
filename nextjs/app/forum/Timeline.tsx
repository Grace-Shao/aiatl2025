"use client"

import React from "react";

const moments = [
  {id: 'k1', time: 'Q3 08:23', player: 'Player #23', desc: 'Step-back 3', thumb: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=60'},
  {id: 'k2', time: 'Q2 02:11', player: 'Player #7', desc: 'And-1 drive', thumb: 'https://images.unsplash.com/photo-1518599807932-4c3b6a2b1674?w=400&q=60'},
  {id: 'k3', time: 'Q1 11:09', player: 'Player #12', desc: 'Huge block', thumb: 'https://images.unsplash.com/photo-1521193550517-44b6f2f7c3a7?w=400&q=60'},
];

export default function Timeline() {
  function playMoment(m: typeof moments[number]) {
    // placeholder - in real app we'd open a player or seek to timestamp
    alert(`Replaying: ${m.player} — ${m.desc} (${m.time})`);
  }

  return (
    <div className="flex flex-col gap-2">
      {moments.map(m => (
        <div key={m.id} className="flex gap-2 items-center cursor-pointer" onClick={() => playMoment(m)}>
          <img src={m.thumb} alt={m.desc} className="w-[72px] h-[48px] object-cover rounded-md" />
          <div className="text-sm">
            <div className="font-semibold text-white">{m.player}</div>
            <div className="text-sm text-gray-300">{m.desc} · {m.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

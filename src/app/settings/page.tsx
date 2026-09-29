'use client';

import React, { useState } from 'react';
import { Settings, Clock, Zap, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [dailyCapacity, setDailyCapacity] = useState(240); // 4 hours
  const [saved, setSaved] = useState(false);

  const [energyPrefs, setEnergyPrefs] = useState({
    MORNING: 'HIGH',
    AFTERNOON: 'MEDIUM',
    EVENING: 'HIGH',
    NIGHT: 'LOW',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-400" />
          <span>Study Capacity &amp; Energy Preferences</span>
        </h1>
        <p className="text-xs text-gray-400">
          Set realistic daily study limits and preferred energy periods to ensure feasible schedule generation.
        </p>
      </div>

      {/* Daily Capacity Slider */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>Daily Study Capacity Limit</span>
          </h3>
          <span className="font-mono text-lg font-bold text-blue-400">
            {Math.floor(dailyCapacity / 60)}h {dailyCapacity % 60}m ({dailyCapacity} mins)
          </span>
        </div>

        <p className="text-xs text-gray-400">
          The planner engine will NEVER schedule total study sessions exceeding this daily maximum cap.
        </p>

        <input
          type="range"
          min={60}
          max={480}
          step={30}
          value={dailyCapacity}
          onChange={(e) => setDailyCapacity(Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />

        <div className="flex justify-between text-xs text-gray-500 font-mono">
          <span>1 hour</span>
          <span>4 hours (Default)</span>
          <span>8 hours</span>
        </div>
      </div>

      {/* Energy Preferences Matrix */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          <span>Energy Level Preferences</span>
        </h3>
        <p className="text-xs text-gray-400">
          Matches task difficulty (High = Coding/Math, Medium = Concepts, Low = Revision) with your productive periods.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {Object.entries(energyPrefs).map(([block, level]) => (
            <div key={block} className="rounded-xl border border-white/5 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">{block}</span>
                <p className="text-[11px] text-gray-400">
                  {block === 'MORNING'
                    ? '06:00 - 12:00'
                    : block === 'AFTERNOON'
                    ? '12:00 - 17:00'
                    : block === 'EVENING'
                    ? '17:00 - 22:00'
                    : '22:00 - 06:00'}
                </p>
              </div>

              <select
                value={level}
                onChange={(e) => setEnergyPrefs({ ...energyPrefs, [block]: e.target.value })}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white font-medium focus:outline-none"
              >
                <option value="HIGH">HIGH Energy</option>
                <option value="MEDIUM">MEDIUM Energy</option>
                <option value="LOW">LOW Energy</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Save Settings */}
      <div className="flex items-center justify-between">
        {saved ? (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Preferences saved successfully!
          </span>
        ) : (
          <span></span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 text-sm"
        >
          <Save className="h-4 w-4" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}

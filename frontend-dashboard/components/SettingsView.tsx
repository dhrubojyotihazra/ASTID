'use client';
import { useState } from 'react';
import { User, Bell, Palette, Check } from 'lucide-react';
import { useApp } from '@/lib/store';
import { ROLES } from '@/lib/roles';

export default function SettingsView() {
  const { say, role, dark, setDark } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'notify' | 'look'>('profile');

  // Profile form state
  const me = role ? ROLES[role] : { name: 'Noah Castell', label: 'Project Lead' };
  const [name, setName] = useState('Noah Castell');
  const [email, setEmail] = useState('noah@fernly.app');
  const [userRole, setUserRole] = useState('Project Lead');
  const [tz, setTz] = useState('GMT+7 · Jakarta');
  const [bio, setBio] = useState('Shipping calm software with a kind team.');

  // Notification toggles
  const [dailyDigest, setDailyDigest] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);

  // Appearance
  const [accent, setAccent] = useState<'forest' | 'emerald' | 'cobalt'>('forest');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    say('Settings saved successfully');
  };

  const handleDiscard = () => {
    setName('Noah Castell');
    setEmail('noah@fernly.app');
    setUserRole('Project Lead');
    setTz('GMT+7 · Jakarta');
    setBio('Shipping calm software with a kind team.');
    say('Discarded changes');
  };

  return (
    <div className="flex flex-col gap-5 page-transition">
      {/* Board Head matching Screen 5 */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-tx leading-tight">Settings</h1>
        <p className="text-[13.5px] text-mu mt-0.5">
          Your profile, notifications and how Fernly looks.
        </p>
      </div>

      {/* Main Grid: Left Tabs Nav + Right Content Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Tabs Nav */}
        <nav
          aria-label="Settings sections"
          className="md:col-span-3 flex md:flex-col gap-1.5 rounded-[24px] border border-bd/80 bg-card p-3 shadow-xs overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex min-h-[42px] items-center gap-2.5 rounded-2xl px-4 text-left text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-so text-ac border border-ac/20 shadow-xs'
                : 'text-mu hover:bg-so/40 hover:text-tx'
            }`}
          >
            <User size={16} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notify')}
            className={`flex min-h-[42px] items-center gap-2.5 rounded-2xl px-4 text-left text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'notify'
                ? 'bg-so text-ac border border-ac/20 shadow-xs'
                : 'text-mu hover:bg-so/40 hover:text-tx'
            }`}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('look')}
            className={`flex min-h-[42px] items-center gap-2.5 rounded-2xl px-4 text-left text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'look'
                ? 'bg-so text-ac border border-ac/20 shadow-xs'
                : 'text-mu hover:bg-so/40 hover:text-tx'
            }`}
          >
            <Palette size={16} />
            <span>Appearance</span>
          </button>
        </nav>

        {/* Right Settings Body Card */}
        <div className="md:col-span-9 rounded-[26px] border border-bd/80 bg-card p-6 md:p-8 shadow-xs">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-bd/60">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fed7aa] text-[18px] font-extrabold text-tx shadow-xs">
                  NC
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-tx">Profile</h2>
                  <p className="text-[12.5px] text-mu">
                    This is how teammates see you across the workspace.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-2xl border border-bd bg-card px-4 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-bd bg-card px-4 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1.5">Role</label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={e => setUserRole(e.target.value)}
                    className="w-full rounded-2xl border border-bd bg-card px-4 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-mu block mb-1.5">
                    Time zone
                  </label>
                  <select
                    value={tz}
                    onChange={e => setTz(e.target.value)}
                    className="w-full rounded-2xl border border-bd bg-card px-4 py-2.5 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac"
                  >
                    <option value="GMT+7 · Jakarta">GMT+7 · Jakarta</option>
                    <option value="GMT+5:30 · Kolkata / Mumbai">
                      GMT+5:30 · Kolkata / Mumbai
                    </option>
                    <option value="UTC+0 · London">UTC+0 · London</option>
                    <option value="UTC-5 · New York">UTC-5 · New York</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-mu block mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full rounded-2xl border border-bd bg-card p-4 text-[13.5px] text-tx focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac resize-y"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-bd/60">
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="flex min-h-[42px] items-center justify-center rounded-full border border-bd bg-card px-6 text-[13px] font-semibold text-tx hover:bg-so/40 active:scale-95 transition cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex min-h-[42px] items-center justify-center rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-6 text-[13px] font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notify' && (
            <div className="flex flex-col gap-5">
              <h2 className="text-[17px] font-bold text-tx">Notification Preferences</h2>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-bd/60 bg-so/20 cursor-pointer">
                  <div>
                    <div className="font-semibold text-tx text-[13.5px]">Daily Morning Digest</div>
                    <div className="text-[12px] text-mu">
                      Receive an executive summary of outstanding review queues at 8:00 AM.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={e => setDailyDigest(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0d3a23]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-bd/60 bg-so/20 cursor-pointer">
                  <div>
                    <div className="font-semibold text-tx text-[13.5px]">High-Severity SLA Alerts</div>
                    <div className="text-[12px] text-mu">
                      Immediate alert when an escalated case reaches 5 minutes before SLA breach.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={slaAlerts}
                    onChange={e => setSlaAlerts(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0d3a23]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-bd/60 bg-so/20 cursor-pointer">
                  <div>
                    <div className="font-semibold text-tx text-[13.5px]">Tactile Audio Feedback</div>
                    <div className="text-[12px] text-mu">
                      Soft subtle click sounds on decision confirmation and drag release.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={e => setSoundEffects(e.target.checked)}
                    className="h-5 w-5 rounded accent-[#0d3a23]"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-bd/60">
                <button
                  type="button"
                  onClick={() => say('Notification preferences updated')}
                  className="rounded-full bg-[#0d3a23] dark:bg-[#155a37] px-6 py-2.5 text-[13px] font-bold text-white shadow-xs"
                >
                  Save preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'look' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-[17px] font-bold text-tx">Appearance & Theme</h2>

              <div>
                <label className="text-[12.5px] font-semibold text-mu block mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDark(false)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-[13px] font-semibold transition cursor-pointer ${
                      !dark ? 'border-ac bg-so text-ac shadow-xs' : 'border-bd bg-card text-tx'
                    }`}
                  >
                    <span>Calm Light</span>
                    {!dark && <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDark(true)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-[13px] font-semibold transition cursor-pointer ${
                      dark ? 'border-ac bg-so text-ac shadow-xs' : 'border-bd bg-card text-tx'
                    }`}
                  >
                    <span>Forest Night</span>
                    {dark && <Check size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12.5px] font-semibold text-mu block mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {[
                    ['forest', '#0d3a23', 'Deep Forest'],
                    ['emerald', '#10b981', 'Emerald Calm'],
                    ['cobalt', '#2563eb', 'Cobalt Trust'],
                  ].map(([k, hex, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setAccent(k as any);
                        say(`Applied ${label} theme accent`);
                      }}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-2 border text-[12px] font-semibold transition cursor-pointer ${
                        accent === k
                          ? 'border-ac bg-so text-ac shadow-xs'
                          : 'border-bd bg-card text-tx hover:bg-so/40'
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

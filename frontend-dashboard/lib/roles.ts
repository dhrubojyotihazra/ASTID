import { Role } from './data';

export type Tab = { key: string; label: string; icon: string; badge?: string | number };

export const ROLES: Record<Role, { label: string; name: string; branch: string; roleDesc: string; tabs: Tab[] }> = {
  analyst: {
    label: 'Branch Analyst',
    name: 'Noah Castell',
    branch: 'Kolkata-SaltLake',
    roleDesc: 'Reviews flagged transactions within Kolkata-SaltLake branch scope',
    tabs: [
      { key: 'home', label: 'Dashboard', icon: 'home' },
      { key: 'cases', label: 'Cases', icon: 'cases', badge: 9 },
      { key: 'analytics', label: 'Analytics & Health', icon: 'chart' },
      { key: 'team', label: 'Team', icon: 'users' },
      { key: 'all', label: 'All Transactions', icon: 'search' },
      { key: 'mine', label: 'My Cases', icon: 'check' },
    ],
  },
  senior: {
    label: 'Senior Analyst',
    name: 'Demo Senior',
    branch: 'Multi-branch cluster',
    roleDesc: 'Supervises branch analysts and handles high-priority 15-minute SLA escalations',
    tabs: [
      { key: 'home', label: 'Dashboard', icon: 'home' },
      { key: 'cases', label: 'Cases', icon: 'cases', badge: 9 },
      { key: 'esc', label: 'Escalations', icon: 'clock' },
      { key: 'analytics', label: 'Analytics & Health', icon: 'chart' },
      { key: 'team', label: 'Team', icon: 'users' },
      { key: 'all', label: 'All Transactions', icon: 'search' },
    ],
  },
  lead: {
    label: 'Team Lead',
    name: 'Demo Lead',
    branch: 'All 5 branches',
    roleDesc: 'Oversees multi-branch risk operations, system stability, and SLA thresholds',
    tabs: [
      { key: 'home', label: 'Dashboard', icon: 'home' },
      { key: 'cases', label: 'Cases', icon: 'cases', badge: 9 },
      { key: 'analytics', label: 'Analytics & Health', icon: 'chart' },
      { key: 'team', label: 'Team', icon: 'users' },
      { key: 'branches', label: 'Branches', icon: 'building' },
      { key: 'sim', label: 'Threshold Simulator', icon: 'sliders' },
      { key: 'sla', label: 'Escalation SLA', icon: 'clock' },
    ],
  },
  admin: {
    label: 'Admin',
    name: 'Demo Admin',
    branch: 'System-wide',
    roleDesc: 'Full platform governance, batch dataset uploads, engine versions, and audit logs',
    tabs: [
      { key: 'home', label: 'Dashboard', icon: 'home' },
      { key: 'cases', label: 'Cases', icon: 'cases', badge: 9 },
      { key: 'analytics', label: 'Analytics & Health', icon: 'chart' },
      { key: 'team', label: 'Team', icon: 'users' },
      { key: 'users', label: 'Users & Branches', icon: 'users' },
      { key: 'upload', label: 'Batch Upload', icon: 'upload' },
      { key: 'registry', label: 'Engine Versions', icon: 'chart' },
      { key: 'audit', label: 'Audit Trail', icon: 'sliders' },
    ],
  },
};

export const canSeeHealth = (r: Role) => r === 'lead' || r === 'admin';

export const emailToRole = (e: string): Role => {
  const m = e.toLowerCase();
  return m.includes('admin')
    ? 'admin'
    : m.includes('lead')
    ? 'lead'
    : m.includes('senior')
    ? 'senior'
    : 'analyst';
};

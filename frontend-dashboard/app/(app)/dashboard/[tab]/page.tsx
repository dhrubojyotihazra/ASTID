'use client';
import { ReactElement } from 'react';
import { useApp } from '@/lib/store';
import { ROLES, canSeeHealth } from '@/lib/roles';
import * as V from '@/components/views';
import CasePanel from '@/components/CasePanel';
import PrimaryDashboard from '@/components/PrimaryDashboard';
import TasksKanban from '@/components/TasksKanban';
import AnalyticsView from '@/components/AnalyticsView';
import TeamView from '@/components/TeamView';
import SettingsView from '@/components/SettingsView';
import HelpView from '@/components/HelpView';

export default function Page({ params }: { params: { tab: string } }) {
  const { role } = useApp();
  const tab = params.tab;

  if (!role) return null;

  const allowedTabs = [
    'home',
    'tasks',
    'review',
    'analytics',
    'team',
    'settings',
    'help',
    'calendar',
    'all',
    'mine',
    'esc',
    'sla',
    'branches',
    'health',
    'sim',
    'users',
    'upload',
    'registry',
    'audit',
  ];

  const allowed =
    ROLES[role].tabs.some(t => t.key === tab) ||
    ['settings', 'help', 'tasks', 'analytics', 'team'].includes(tab) ||
    (tab === 'audit' && canSeeHealth(role));

  if (!allowed) return <V.Denied />;

  let view: ReactElement;
  let withPanel = false;

  switch (tab) {
    case 'home':
      view = <PrimaryDashboard />;
      break;
    case 'tasks':
    case 'review':
      view = <TasksKanban />;
      break;
    case 'analytics':
      view = <AnalyticsView />;
      break;
    case 'team':
      view = <TeamView />;
      break;
    case 'settings':
      view = <SettingsView />;
      break;
    case 'help':
      view = <HelpView />;
      break;
    case 'esc':
      view = <V.Escalations />;
      withPanel = true;
      break;
    case 'sla':
      view = <V.Escalations sla />;
      withPanel = true;
      break;
    case 'all':
      view = <V.Queue kind="all" />;
      withPanel = true;
      break;
    case 'mine':
      view = <V.Queue kind="mine" />;
      withPanel = true;
      break;
    case 'branches':
      view = <V.BranchTable />;
      break;
    case 'health':
      view = <V.Health />;
      break;
    case 'sim':
      view = <V.Simulator />;
      break;
    case 'users':
      view = <V.Users />;
      break;
    case 'upload':
      view = <V.BatchUpload />;
      break;
    case 'registry':
      view = <V.Registry />;
      break;
    case 'audit':
      view = <V.Audit />;
      break;
    default:
      view = <PrimaryDashboard />;
  }

  return (
    <div className="flex flex-wrap items-start gap-[18px]">
      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
        {view}
      </div>
      {withPanel && <CasePanel />}
    </div>
  );
}

'use client';
import { ReactElement } from 'react';
import { useApp } from '@/lib/store';
import { ROLES, canSeeHealth } from '@/lib/roles';
import * as V from '@/components/views';
import CasePanel from '@/components/CasePanel';

export default function Page({ params }: { params: { tab: string } }) {
  const { role } = useApp(); const tab = params.tab;
  if (!role) return null;
  const allowed = ROLES[role].tabs.some(t => t.key === tab) || tab === 'settings' || (tab === 'audit' && canSeeHealth(role));
  if (!allowed) return <V.Denied />;
  let view: ReactElement; let withPanel = true;
  switch (tab) {
    case 'home': view = role === 'analyst' ? <V.HomeAnalyst /> : role === 'senior' ? <V.HomeSenior /> : <V.HomeLead />; break;
    case 'review': case 'all': case 'mine': view = <V.Queue kind={tab} />; break;
    case 'esc': view = <V.Escalations />; break;
    case 'sla': view = <V.Escalations sla />; break;
    case 'branches': view = <V.BranchTable />; withPanel = false; break;
    case 'health': view = <V.Health />; withPanel = false; break;
    case 'sim': view = <V.Simulator />; withPanel = false; break;
    case 'users': view = <V.Users />; withPanel = false; break;
    case 'upload': view = <V.BatchUpload />; withPanel = false; break;
    case 'registry': view = <V.Registry />; withPanel = false; break;
    case 'audit': view = <V.Audit />; withPanel = false; break;
    default: view = <V.Settings />; withPanel = false;
  }
  const withCases = withPanel && ['home', 'review', 'all', 'mine', 'esc', 'sla'].includes(tab);
  return <div className="flex flex-wrap items-start gap-[18px]"><div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">{view}</div>{withCases && <CasePanel />}</div>;
}

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginPage } from '../pages/LoginPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectShell } from '../pages/project/ProjectShell';
import { RetrosTab } from '../pages/project/RetrosTab';
import { RetroBoardPage } from '../pages/project/RetroBoardPage';
import { HistoryTab } from '../pages/project/HistoryTab';
import { ActionItemsTab } from '../pages/project/ActionItemsTab';
import { ReportsTab } from '../pages/project/ReportsTab';
import { ReportPage } from '../pages/project/ReportPage';
import { SettingsTab } from '../pages/project/SettingsTab';
import { AppShell } from '../components/AppShell';
import { useAppStore } from '../stores/useAppStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const me = useAppStore((s) => s.currentUserId);
  const nav = useNavigate();
  useEffect(() => {
    if (!me) nav('/login', { replace: true });
  }, [me, nav]);
  if (!me) return null;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectShell />}>
          <Route index element={<Navigate to="retros" replace />} />
          <Route path="retros" element={<RetrosTab />} />
          <Route path="retros/:retroId" element={<RetroBoardPage />} />
          <Route path="history" element={<HistoryTab />} />
          <Route path="action-items" element={<ActionItemsTab />} />
          <Route path="reports" element={<ReportsTab />} />
          <Route path="reports/:reportId" element={<ReportPage />} />
          <Route path="settings" element={<SettingsTab />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

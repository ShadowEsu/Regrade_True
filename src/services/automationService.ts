import { apiFetch } from '../lib/api';
import { isPreviewMode } from '../lib/previewMode';
import { listConnections } from '../features/connect/store';
import { connectorImportService, IMPORTABLE_PLATFORMS } from './connectorImportService';
import { auth } from '../lib/firebase';
import { userService } from './userService';
import { notificationService } from './notificationService';

export type AutomationPreferences = {
  autoPrepare?: boolean;
  automaticGradeDetection?: boolean;
  notifications?: boolean;
};

export const automationService = {
  async update(preferences: AutomationPreferences): Promise<void> {
    if (isPreviewMode()) return;
    const response = await apiFetch('/v1/automation/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(payload?.error?.message ?? 'Automation preference could not be saved.');
    }
  },
  async runGradeDetection(): Promise<void> {
    if (isPreviewMode()) return;
    const user = auth.currentUser;
    if (!user) return;
    const profile = await userService.getProfile(user.uid);
    if (profile?.automaticGradeDetection !== true) return;
    const connections = await listConnections();
    const results = await Promise.allSettled(connections.filter((item) => IMPORTABLE_PLATFORMS.has(item.platformId)).map((item) => connectorImportService.runAutomatic(item.platformId)));
    const imported = results.reduce((sum, result) => sum + (result.status === 'fulfilled' ? result.value.imported : 0), 0);
    if (profile.analysisAlerts !== false && profile.notificationPreferences?.imports !== false) {
      await notificationService.automaticImportComplete(imported);
    }
  },
};

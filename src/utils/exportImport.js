/**
 * Export and Import Utilities for JSON backups and clipboard transfer
 */

export function exportDataToJsonFile(state) {
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: state,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `discipline-panel-backup-${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyDataToClipboard(state) {
  const exportPayload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: state,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  await navigator.clipboard.writeText(jsonStr);
}

export function parseBackupJson(rawString) {
  try {
    const parsed = JSON.parse(rawString);
    if (parsed && parsed.data) {
      return { ok: true, data: parsed.data };
    }
    // If user exported raw data object directly
    if (parsed && (parsed.habits || parsed.habitLogs)) {
      return { ok: true, data: parsed };
    }
    return { ok: false, error: 'Неверная структура JSON файла резервной копии.' };
  } catch (e) {
    return { ok: false, error: `Ошибка парсинга JSON: ${e.message}` };
  }
}

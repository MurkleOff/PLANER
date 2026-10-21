import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Check, 
  Copy, 
  RefreshCw, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle,
  Code
} from 'lucide-react';
import { SUPABASE_SQL_SETUP, testSupabaseConnection } from '../../services/supabaseSync';

export default function CloudSyncModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPushSync,
  onPullSync,
  syncStatus,
}) {
  const [url, setUrl] = useState(config.supabaseUrl || '');
  const [key, setKey] = useState(config.supabaseAnonKey || '');
  const [syncId, setSyncId] = useState(config.syncId || '');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection({
      supabaseUrl: url,
      supabaseAnonKey: key,
      syncId,
    });
    setTestResult(result);
    setIsTesting(false);
    if (result.ok) {
      onSaveConfig({ supabaseUrl: url, supabaseAnonKey: key, syncId });
    }
  };

  const handleSaveAndSync = () => {
    onSaveConfig({ supabaseUrl: url, supabaseAnonKey: key, syncId });
    onPushSync({ supabaseUrl: url, supabaseAnonKey: key, syncId });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Облачная синхронизация (Supabase)
              </h2>
              <p className="text-xs text-slate-400">
                Бесшовная связка ПК и смартфона по секретному кодовому слову (Sync ID)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs Form */}
        <div className="space-y-3.5 my-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              SUPABASE_URL
            </label>
            <input
              type="text"
              placeholder="https://xyzproject.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              SUPABASE_ANON_KEY (Public Key)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sync ID (Кодовое слово для связки ваших устройств)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="например: my-secret-discipline-code-2026"
                value={syncId}
                onChange={(e) => setSyncId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setSyncId(`panel-${Math.random().toString(36).substring(2, 10)}`)}
                className="px-2.5 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700"
                title="Сгенерировать случайный ID"
              >
                Сгенерировать
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Введите одинаковый Sync ID на ПК и телефоне, чтобы они видели общие привычки и задачи.
            </p>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              testResult.ok 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {testResult.ok ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleTest}
              disabled={isTesting || !url || !key || !syncId}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Проверить подключение</span>
            </button>

            <button
              onClick={handleSaveAndSync}
              disabled={!url || !key || !syncId}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Сохранить и выгрузить (Push)</span>
            </button>

            <button
              onClick={() => onPullSync({ supabaseUrl: url, supabaseAnonKey: key, syncId })}
              disabled={!url || !key || !syncId}
              className="px-3.5 py-2 bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Загрузить с облака (Pull)</span>
            </button>
          </div>
        </div>

        {/* SQL Script Accordion / Copy */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>SQL-скрипт создания таблицы (для Supabase SQL Editor):</span>
            </span>
            <button
              onClick={handleCopySql}
              className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Скопировано!' : 'Копировать SQL'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
            {SUPABASE_SQL_SETUP}
          </pre>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Откройте ваш проект в <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">supabase.com</a> &rarr; выберите <b>SQL Editor</b> &rarr; вставьте скрипт и нажмите <b>Run</b>. Это займёт 2 секунды.
          </p>
        </div>

      </div>
    </div>
  );
}

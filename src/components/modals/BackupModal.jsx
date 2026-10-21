import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  AlertCircle, 
  FileJson,
  ClipboardPaste,
  RotateCcw
} from 'lucide-react';
import { exportDataToJsonFile, copyDataToClipboard, parseBackupJson } from '../../utils/exportImport';

export default function BackupModal({
  isOpen,
  onClose,
  fullState,
  onRestoreState,
  onResetAllProgress,
}) {
  const [copied, setCopied] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleExportFile = () => {
    exportDataToJsonFile(fullState);
    setStatusMessage({ ok: true, text: 'Файл резервной копии успешно скачан на ваше устройство!' });
  };

  const handleCopyClipboard = async () => {
    try {
      await copyDataToClipboard(fullState);
      setCopied(true);
      setStatusMessage({ ok: true, text: 'Резервная копия скопирована в буфер обмена!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setStatusMessage({ ok: false, text: `Не удалось скопировать: ${e.message}` });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = parseBackupJson(content);
      if (res.ok) {
        onRestoreState(res.data);
        setStatusMessage({ ok: true, text: 'Данные успешно восстановлены из файла!' });
      } else {
        setStatusMessage({ ok: false, text: res.error });
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const res = parseBackupJson(pasteText.trim());
    if (res.ok) {
      onRestoreState(res.data);
      setStatusMessage({ ok: true, text: 'Данные успешно восстановлены из буфера обмена!' });
      setPasteText('');
    } else {
      setStatusMessage({ ok: false, text: res.error });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Резервная копия (JSON Экспорт / Импорт)
              </h2>
              <p className="text-xs text-slate-400">
                Полный контроль над своими данными без привязки к серверам
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

        {/* Status notification */}
        {statusMessage && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.ok 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-4 my-4">
          
          {/* Export Cluster */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Экспорт всех данных</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFile}
                className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать .json файл</span>
              </button>
              <button
                onClick={handleCopyClipboard}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'В буфер'}</span>
              </button>
            </div>
          </div>

          {/* Import Cluster */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Импорт и восстановление данных</span>
            </h3>

            {/* File Upload */}
            <label className="block mb-3">
              <span className="text-[11px] text-slate-400 mb-1 block">Загрузить файл .json:</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </label>

            {/* Paste from clipboard textarea */}
            <div>
              <span className="text-[11px] text-slate-400 mb-1 block">Или вставьте JSON текст из буфера:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='{"version": "1.0", ...}'
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleApplyPaste}
                  disabled={!pasteText.trim()}
                  className="px-3 py-1.5 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold hover:bg-emerald-600/40 disabled:opacity-50 transition-all"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>

          {/* Reset Progress Cluster */}
          <div className="p-3.5 bg-rose-950/20 rounded-xl border border-rose-500/30">
            <h3 className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить весь прогресс к 0%</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Обнуляет все серии (streak), снимает все галочки и сбрасывает цели на 0%. Все названия ваших привычек, задач и сфер сохраняются.
            </p>
            <button
              onClick={() => {
                if (onResetAllProgress) {
                  onResetAllProgress();
                  setStatusMessage({ ok: true, text: 'Весь прогресс успешно сброшен к 0%!' });
                }
              }}
              className="py-1.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Обнулить весь прогресс (0%)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

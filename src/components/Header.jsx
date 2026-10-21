import React from 'react';
import { 
  Flame, 
  Cloud, 
  Download, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  Calendar
} from 'lucide-react';
import { formatDisplayDate, getWeekLabel } from '../utils/dateUtils';

export default function Header({
  weekOffset,
  setWeekOffset,
  monday,
  isDark,
  setIsDark,
  onOpenSyncModal,
  onOpenBackupModal,
  onStartNewWeek,
  syncStatus,
}) {
  const isCurrentWeek = weekOffset === 0;

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          
          {/* Logo & Current Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    ДИСЦИПЛИНА <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRO</span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatDisplayDate(new Date())}</span>
                </p>
              </div>
            </div>

            {/* Mobile actions quick cluster */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenSyncModal}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Облачная синхронизация"
              >
                <Cloud className={`w-4 h-4 ${syncStatus.synced ? 'text-emerald-400' : 'text-slate-400'}`} />
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between sm:justify-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Предыдущая неделя"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center px-2 min-w-[170px] sm:min-w-[210px]">
              <div className="text-xs font-semibold text-slate-200">
                {getWeekLabel(monday)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {isCurrentWeek ? (
                  <span className="text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Текущая неделя
                  </span>
                ) : (
                  <span>Смещение: {weekOffset > 0 ? `+${weekOffset}` : weekOffset} нед.</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Следующая неделя"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[11px] px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 ml-1"
              >
                К текущей
              </button>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* New Week Reset / Finalize */}
            <button
              onClick={onStartNewWeek}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-medium border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Зафиксировать результаты и обнулить текущую неделю"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Новая неделя</span>
            </button>

            {/* Cloud Sync */}
            <button
              onClick={onOpenSyncModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                syncStatus.connected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/60 hover:bg-slate-700/90'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>{syncStatus.connected ? 'Облако (ON)' : 'Облако'}</span>
              {syncStatus.isSyncing && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </button>

            {/* Backup JSON */}
            <button
              onClick={onOpenBackupModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 text-xs font-medium border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Резервная копия и экспорт/импорт данных"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Бэкап JSON</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95"
              title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

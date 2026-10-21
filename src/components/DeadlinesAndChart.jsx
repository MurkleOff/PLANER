import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Minus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  BarChart2, 
  LineChart,
  Target
} from 'lucide-react';
import { CATEGORIES } from '../constants/initialData';
import { getDaysRemaining } from '../utils/dateUtils';

export default function DeadlinesAndChart({
  goals,
  onUpdateGoalProgress,
  onOpenAddGoalModal,
  onOpenEditGoalModal,
  onDeleteGoal,
  weekDynamics,
  selectedDayIndex,
  setSelectedDayIndex,
}) {
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG dimensions for week chart
  const width = 500;
  const height = 160;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // Compute SVG points
  const points = weekDynamics.map((d, i) => {
    const x = paddingX + (i / 6) * graphWidth;
    const y = paddingY + graphHeight - (d.percentage / 100) * graphHeight;
    return { ...d, x, y };
  });

  // Smooth Bezier Curve Path
  const makeSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = makeSmoothPath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="space-y-5">
      
      {/* 1. Big Goals and Deadlines */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Большие цели и Дедлайны
            </h2>
          </div>
          <button
            onClick={onOpenAddGoalModal}
            className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-all flex items-center gap-1 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новая цель</span>
          </button>
        </div>

        <div className="space-y-3">
          {goals.map(goal => {
            const category = CATEGORIES[goal.category] || CATEGORIES.training || Object.values(CATEGORIES)[0];
            const daysLeft = getDaysRemaining(goal.targetDate);

            return (
              <div
                key={goal.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${category.badgeClass}`}>
                        {category.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {daysLeft > 0 ? (
                          <span className={daysLeft <= 30 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                            Осталось {daysLeft} дн.
                          </span>
                        ) : daysLeft === 0 ? (
                          <span className="text-rose-400 font-bold">Дедлайн сегодня!</span>
                        ) : (
                          <span className="text-rose-400">Просрочено на {-daysLeft} дн.</span>
                        )}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200">
                      {goal.title}
                    </h3>
                  </div>

                  {/* Actions: Edit / Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onOpenEditGoalModal(goal)}
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                      title="Редактировать цель"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Удалить цель"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and numeric adjusters */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>Готовность:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateGoalProgress(goal.id, Math.max(0, goal.progress - 5))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      title="-5%"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-200 min-w-[36px] text-center">
                      {goal.progress}%
                    </span>
                    <button
                      onClick={() => onUpdateGoalProgress(goal.id, Math.min(100, goal.progress + 5))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      title="+5%"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${category.barClass}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive SVG Week Dynamics Chart */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Динамика недели (Пн – Вс)
            </h2>
          </div>

          {/* Switcher Line vs Bar */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'line'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Плавная линия"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                chartType === 'bar'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Столбчатая диаграмма"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines (0%, 50%, 100%) */}
            {[0, 50, 100].map(val => {
              const y = paddingY + graphHeight - (val / 100) * graphHeight;
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Render Bar Chart */}
            {chartType === 'bar' && (
              <g>
                {points.map((pt, i) => {
                  const barWidth = 24;
                  const barHeight = Math.max(4, (pt.percentage / 100) * graphHeight);
                  const x = pt.x - barWidth / 2;
                  const y = paddingY + graphHeight - barHeight;
                  const isSelected = i === selectedDayIndex;

                  return (
                    <g 
                      key={pt.dateKey} 
                      className="cursor-pointer group"
                      onClick={() => setSelectedDayIndex(i)}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="6"
                        fill={isSelected ? '#06b6d4' : pt.isToday ? '#6366f1' : '#334155'}
                        className="transition-all duration-300 hover:fill-cyan-300"
                      />
                      <text
                        x={pt.x}
                        y={height - 8}
                        fill={isSelected ? '#38bdf8' : pt.isToday ? '#a5b4fc' : '#94a3b8'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {pt.dayShort}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Render Smooth Line Chart */}
            {chartType === 'line' && (
              <g>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {points.map((pt, i) => {
                  const isSelected = i === selectedDayIndex;
                  return (
                    <g 
                      key={pt.dateKey}
                      className="cursor-pointer"
                      onClick={() => setSelectedDayIndex(i)}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Pulse circle for today */}
                      {pt.isToday && (
                        <circle cx={pt.x} cy={pt.y} r="8" fill="#06b6d4" opacity="0.2" className="animate-ping" />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#38bdf8' : pt.isToday ? '#6366f1' : '#070b14'}
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        className="transition-all duration-200 hover:r-7"
                      />
                      <text
                        x={pt.x}
                        y={height - 8}
                        fill={isSelected ? '#38bdf8' : pt.isToday ? '#a5b4fc' : '#94a3b8'}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {pt.dayShort}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Tooltip on Hover */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-950/95 border border-cyan-500/40 text-white px-2.5 py-1.5 rounded-xl shadow-xl text-xs z-20 backdrop-blur-md"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100}%`,
              }}
            >
              <div className="font-semibold text-cyan-300">
                {hoveredPoint.dayFull} ({hoveredPoint.percentage}%)
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {hoveredPoint.habitsDone} привычек · {hoveredPoint.tasksDone}/3 задач
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

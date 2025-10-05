'use client';

import { useState } from 'react';
import { Clock, Users, Timer, Zap, TrendingUp } from 'lucide-react';
import { responsive } from '../lib/responsive';

interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number;
  isBreak: boolean;
  breakName?: string;
}

interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'turbo' | 'regular' | 'deep-stack' | 'hyper-turbo' | 'slow';
  startingStack: number;
  levelDuration: number;
  blindLevels: BlindLevel[];
  recommended: {
    minPlayers: number;
    maxPlayers: number;
    estimatedDuration: string;
  };
}

interface Props {
  templates: TournamentTemplate[];
  onSelect: (template: TournamentTemplate) => void;
  selectedId?: string;
}

const typeIcons = {
  'hyper-turbo': Zap,
  'turbo': Timer,
  'regular': Clock,
  'deep-stack': TrendingUp,
  'slow': Users,
};

const typeColors = {
  'hyper-turbo': 'from-red-500 to-orange-500',
  'turbo': 'from-orange-500 to-yellow-500',
  'regular': 'from-blue-500 to-cyan-500',
  'deep-stack': 'from-green-500 to-emerald-500',
  'slow': 'from-purple-500 to-pink-500',
};

export function TournamentTemplateSelector({ templates, onSelect, selectedId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatChips = (amount: number) => {
    return new Intl.NumberFormat('tr-TR').format(amount);
  };

  return (
    <div className={responsive.container}>
      <div className="mb-4 md:mb-6">
        <h2 className={`${responsive.text.xl} font-bold text-gray-900`}>
          Turnuva Şablonu Seçin
        </h2>
        <p className={`${responsive.text.sm} text-gray-600 mt-1`}>
          Hazır yapılar veya özel ayarlar
        </p>
      </div>

      {/* Template Grid - Mobile First */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {templates.map((template) => {
          const Icon = typeIcons[template.type];
          const isSelected = template.id === selectedId;
          const isExpanded = template.id === expandedId;

          return (
            <div
              key={template.id}
              className={`
                ${responsive.card.mobile}
                border-2 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${responsive.touch.button}
              `}
              onClick={() => {
                onSelect(template);
                setExpandedId(isExpanded ? null : template.id);
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`
                    p-2 md:p-3 rounded-lg bg-gradient-to-br ${typeColors[template.type]}
                  `}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900">
                      {template.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      {template.levelDuration} dakikalık seviyeler
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs md:text-sm text-gray-700 mb-3">
                {template.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-600">Starting Stack</div>
                  <div className="text-sm md:text-base font-semibold text-gray-900">
                    {formatChips(template.startingStack)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-600">Seviye Süresi</div>
                  <div className="text-sm md:text-base font-semibold text-gray-900">
                    {template.levelDuration} dk
                  </div>
                </div>
              </div>

              {/* Recommended Players */}
              <div className="flex items-center justify-between text-xs md:text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {template.recommended.minPlayers}-{template.recommended.maxPlayers} oyuncu
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{template.recommended.estimatedDuration}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Blind Yapısı (İlk 6 seviye)
                  </h4>
                  <div className="space-y-1">
                    {template.blindLevels.slice(0, 6).map((level) => (
                      <div
                        key={level.level}
                        className="flex items-center justify-between text-xs md:text-sm"
                      >
                        {level.isBreak ? (
                          <span className="text-yellow-600 font-medium">
                            ☕ {level.breakName}
                          </span>
                        ) : (
                          <>
                            <span className="text-gray-600">
                              Seviye {level.level}
                            </span>
                            <span className="font-mono font-semibold text-gray-900">
                              {formatChips(level.smallBlind)}/{formatChips(level.bigBlind)}
                              {level.ante > 0 && ` (${formatChips(level.ante)})`}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {template.blindLevels.length > 6 && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      +{template.blindLevels.length - 6} seviye daha
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Template Option */}
      <div
        className={`
          ${responsive.card.mobile}
          border-2 border-dashed border-gray-300
          hover:border-blue-400 hover:bg-blue-50
          transition-all duration-200 cursor-pointer
          mt-3 md:mt-4
        `}
        onClick={() => {
          onSelect({
            id: 'custom',
            name: 'Özel Ayarlar',
            description: 'Kendi blind yapınızı oluşturun',
            type: 'regular',
            startingStack: 10000,
            levelDuration: 20,
            blindLevels: [],
            recommended: {
              minPlayers: 1,
              maxPlayers: 1000,
              estimatedDuration: 'Değişken',
            },
          });
        }}
      >
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <div className="text-base md:text-lg font-bold text-gray-900">
              Özel Turnuva Oluştur
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Kendi blind yapınızı tasarlayın
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      {selectedId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
          <button
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg
                     active:bg-blue-700 transition-colors min-h-[48px]"
            onClick={() => {
              const selected = templates.find(t => t.id === selectedId);
              if (selected) onSelect(selected);
            }}
          >
            {templates.find(t => t.id === selectedId)?.name} ile Devam Et
          </button>
        </div>
      )}
    </div>
  );
}

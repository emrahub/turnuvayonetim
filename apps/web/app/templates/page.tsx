'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Clock, Users, TrendingUp, Plus, Zap, Rocket, BarChart3, Target, Turtle } from 'lucide-react';

// Template types
interface TournamentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'turbo' | 'regular' | 'deep-stack' | 'hyper-turbo' | 'slow';
  startingStack: number;
  levelDuration: number;
  blindLevels: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number;
    isBreak: boolean;
    breakName?: string;
  }>;
  recommended: {
    minPlayers: number;
    maxPlayers: number;
    estimatedDuration: string;
  };
}

const ALL_TEMPLATES: TournamentTemplate[] = [
  {
    id: 'hyper-turbo',
    name: 'Hyper Turbo',
    description: 'Çok hızlı turnuva - 3 dakikalık seviyeler',
    type: 'hyper-turbo',
    startingStack: 3000,
    levelDuration: 3,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 3, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 3, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 3, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 3, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 3, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 5, isBreak: true, breakName: 'Kısa Mola' },
    ],
    recommended: { minPlayers: 10, maxPlayers: 50, estimatedDuration: '1-2 saat' },
  },
  {
    id: 'turbo',
    name: 'Turbo',
    description: 'Hızlı tempolu turnuva - 5 dakikalık seviyeler',
    type: 'turbo',
    startingStack: 5000,
    levelDuration: 5,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 5, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 5, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 5, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 5, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 5, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true, breakName: 'Mola' },
    ],
    recommended: { minPlayers: 20, maxPlayers: 100, estimatedDuration: '2-3 saat' },
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Standart turnuva yapısı - 20 dakikalık seviyeler',
    type: 'regular',
    startingStack: 10000,
    levelDuration: 20,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 20, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 20, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 20, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true, breakName: '15 Dakika Mola' },
    ],
    recommended: { minPlayers: 50, maxPlayers: 200, estimatedDuration: '4-6 saat' },
  },
  {
    id: 'deep-stack',
    name: 'Deep Stack',
    description: 'Derin stack turnuva - 30 dakikalık seviyeler',
    type: 'deep-stack',
    startingStack: 20000,
    levelDuration: 30,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 30, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 30, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 30, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 30, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 30, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 20, isBreak: true, breakName: '20 Dakika Mola' },
    ],
    recommended: { minPlayers: 50, maxPlayers: 300, estimatedDuration: '6-8 saat' },
  },
  {
    id: 'slow',
    name: 'Slow Structure',
    description: 'Yavaş yapı - 45 dakikalık seviyeler',
    type: 'slow',
    startingStack: 30000,
    levelDuration: 45,
    blindLevels: [
      { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 45, isBreak: false },
      { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 45, isBreak: false },
      { level: 3, smallBlind: 75, bigBlind: 150, ante: 25, duration: 45, isBreak: false },
      { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 45, isBreak: false },
      { level: 5, smallBlind: 150, bigBlind: 300, ante: 50, duration: 45, isBreak: false },
      { level: 6, smallBlind: 0, bigBlind: 0, ante: 0, duration: 30, isBreak: true, breakName: '30 Dakika Mola' },
    ],
    recommended: { minPlayers: 100, maxPlayers: 500, estimatedDuration: '8+ saat' },
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const typeBorderColors = {
    'hyper-turbo': 'border-error-500/30',
    'turbo': 'border-warning-500/30',
    'regular': 'border-success-500/30',
    'deep-stack': 'border-brand-500/30',
    'slow': 'border-purple-500/30'
  };

  const getTypeIcon = (type: TournamentTemplate['type']) => {
    const iconClass = 'icon-xl';
    switch(type) {
      case 'hyper-turbo': return <Rocket className={iconClass} />;
      case 'turbo': return <Zap className={iconClass} />;
      case 'regular': return <BarChart3 className={iconClass} />;
      case 'deep-stack': return <Target className={iconClass} />;
      case 'slow': return <Turtle className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-black via-gray-900 to-poker-black">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-400/20 rounded-lg">
                <FileText className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Turnuva Şablonları</h1>
                <p className="text-sm text-gray-400">Hazır blind yapıları ve turnuva ayarları</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="icon-md" />
              Yeni Turnuva
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;
            const isExpanded = showDetails === template.id;

            return (
              <div
                key={template.id}
                className={`
                  card-hover p-6 border-2 ${typeBorderColors[template.type]} cursor-pointer
                  ${isSelected ? 'card-elevated' : ''}
                `}
                onClick={() => setSelectedTemplate(template.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-brand-400">{getTypeIcon(template.type)}</div>
                  {isSelected && (
                    <div className="text-brand-400 font-bold">✓ Seçili</div>
                  )}
                </div>

                {/* Info */}
                <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                <p className="text-sm text-gray-300 mb-4">{template.description}</p>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="icon-md text-brand-400" />
                    <span className="text-gray-300">{template.levelDuration} dakikalık seviyeler</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="icon-md text-brand-400" />
                    <span className="text-gray-300">{template.startingStack.toLocaleString('tr-TR')} başlangıç chip</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="icon-md text-brand-400" />
                    <span className="text-gray-300">{template.recommended.minPlayers}-{template.recommended.maxPlayers} oyuncu</span>
                  </div>
                </div>

                {/* Details Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(isExpanded ? null : template.id);
                  }}
                  className="text-brand-400 hover:text-brand-300 text-sm font-medium"
                >
                  {isExpanded ? 'Detayları Gizle' : 'Detayları Göster'} →
                </button>

                {/* Blind Structure Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-2">Blind Yapısı:</h4>
                    <div className="space-y-1 text-xs">
                      {template.blindLevels.slice(0, 6).map((level) => (
                        <div key={level.level} className="flex justify-between text-gray-300">
                          {level.isBreak ? (
                            <span className="text-brand-400 flex items-center gap-1">
                              <Clock className="icon-sm" /> {level.breakName}
                            </span>
                          ) : (
                            <>
                              <span>Seviye {level.level}:</span>
                              <span>{level.smallBlind}/{level.bigBlind} (Ante: {level.ante})</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Template Action */}
        {selectedTemplate && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className="text-white">
                <div className="text-sm text-gray-400">Seçili Şablon:</div>
                <div className="font-bold">
                  {ALL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </div>
              </div>
              <button
                onClick={() => {
                  // TODO: Şablonu kullanarak turnuva oluştur
                  router.push('/');
                }}
                className="btn-primary"
              >
                Bu Şablonu Kullan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

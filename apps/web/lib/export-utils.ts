/**
 * Export Utilities
 * Excel, PDF, and CSV export functionality
 */

import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Excel Export (using SheetJS)
export async function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    // Dynamically import xlsx to reduce bundle size
    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw new Error('Excel export failed');
  }
}

// CSV Export
export function exportToCSV(data: any[], filename: string) {
  try {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special characters and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvContent += values.join(',') + '\n';
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('CSV export failed');
  }
}

// PDF Export (using jsPDF)
export async function exportToPDF(
  content: {
    title: string;
    subtitle?: string;
    data: any[];
    columns?: { header: string; dataKey: string }[];
  },
  filename: string
) {
  try {
    // Dynamically import jsPDF and autoTable
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(content.title, 14, 20);

    // Add subtitle if provided
    if (content.subtitle) {
      doc.setFontSize(12);
      doc.text(content.subtitle, 14, 30);
    }

    // Prepare table data
    const columns = content.columns || Object.keys(content.data[0] || {}).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1),
      dataKey: key
    }));

    // Add table
    autoTable(doc, {
      startY: content.subtitle ? 35 : 25,
      head: [columns.map(col => col.header)],
      body: content.data.map(row => columns.map(col => row[col.dataKey] ?? '')),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [13, 121, 56] }, // poker-green
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('PDF export failed');
  }
}

// Analytics Report Export
export async function exportAnalyticsReport(
  data: {
    tournamentHistory: any[];
    playerStats: any[];
    topPlayers: any[];
    timeRange: string;
  },
  format: 'excel' | 'pdf' | 'csv'
) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: tr });
  const filename = `analytics-report-${data.timeRange}-${timestamp}`;

  if (format === 'excel') {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    // Tournament History Sheet
    if (data.tournamentHistory.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(data.tournamentHistory);
      XLSX.utils.book_append_sheet(workbook, ws1, 'Turnuva Geçmişi');
    }

    // Player Stats Sheet
    if (data.playerStats.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(data.playerStats);
      XLSX.utils.book_append_sheet(workbook, ws2, 'Oyuncu İstatistikleri');
    }

    // Top Players Sheet
    if (data.topPlayers.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(data.topPlayers);
      XLSX.utils.book_append_sheet(workbook, ws3, 'En İyi Oyuncular');
    }

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } else if (format === 'pdf') {
    await exportToPDF({
      title: 'Analitik Raporu',
      subtitle: `Dönem: ${data.timeRange.toUpperCase()} | Tarih: ${format(new Date(), 'dd MMMM yyyy', { locale: tr })}`,
      data: data.tournamentHistory,
      columns: [
        { header: 'Tarih', dataKey: 'date' },
        { header: 'Turnuva', dataKey: 'tournaments' },
        { header: 'Oyuncu', dataKey: 'players' },
        { header: 'Ödül', dataKey: 'prizePool' }
      ]
    }, filename);
  } else if (format === 'csv') {
    exportToCSV(data.tournamentHistory, filename);
  }
}

// Leaderboard Export
export async function exportLeaderboard(
  players: any[],
  format: 'excel' | 'pdf' | 'csv',
  sortBy: string,
  timeRange: string
) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: tr });
  const filename = `leaderboard-${sortBy}-${timeRange}-${timestamp}`;

  const exportData = players.map((p, index) => ({
    'Sıra': index + 1,
    'Oyuncu': p.name,
    'Puan': p.points,
    'Kazanç': p.totalWinnings?.toLocaleString('tr-TR') || '0',
    'Turnuva': p.totalTournaments || 0,
    'Kazanma': p.wins || 0,
    'ROI %': p.roi?.toFixed(2) || '0.00',
    'Ort. Sıra': p.avgFinish?.toFixed(1) || '-'
  }));

  if (format === 'excel') {
    await exportToExcel(exportData, filename, 'Sıralama Tablosu');
  } else if (format === 'pdf') {
    await exportToPDF({
      title: 'Oyuncu Sıralama Tablosu',
      subtitle: `${sortBy.toUpperCase()} - ${timeRange.toUpperCase()} | ${format(new Date(), 'dd MMMM yyyy', { locale: tr })}`,
      data: exportData
    }, filename);
  } else if (format === 'csv') {
    exportToCSV(exportData, filename);
  }
}

// Tournament Results Export
export async function exportTournamentResults(
  tournament: any,
  players: any[],
  format: 'excel' | 'pdf' | 'csv'
) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm', { locale: tr });
  const filename = `tournament-results-${tournament.id}-${timestamp}`;

  const exportData = players.map(p => ({
    'Sıra': p.position || '-',
    'Oyuncu': p.name,
    'Chip': p.chips?.toLocaleString('tr-TR') || '0',
    'Durum': p.status,
    'Ödül': p.prize?.toLocaleString('tr-TR') || '-'
  }));

  if (format === 'excel') {
    await exportToExcel(exportData, filename, tournament.name);
  } else if (format === 'pdf') {
    await exportToPDF({
      title: `Turnuva Sonuçları: ${tournament.name}`,
      subtitle: format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr }),
      data: exportData
    }, filename);
  } else if (format === 'csv') {
    exportToCSV(exportData, filename);
  }
}

// Hand History Export (already exists in HandHistoryViewer, but centralized here)
export function exportHandHistoryText(hand: any): void {
  let text = `***** Hand #${hand.handNumber} *****\n`;
  text += `Timestamp: ${hand.timestamp.toISOString()}\n`;
  text += `Pot: ${hand.potSize}\n\n`;

  // Players
  text += `Players:\n`;
  hand.players.forEach((p: any) => {
    text += `  Seat ${p.position}: ${p.name} (${p.chips} chips)\n`;
  });

  // Actions
  text += `\n*** Actions ***\n`;
  hand.actions.forEach((action: any) => {
    const player = hand.players.find((p: any) => p.id === action.playerId);
    text += `${action.street}: ${player?.name} ${action.type}`;
    if (action.amount) text += ` ${action.amount}`;
    text += `\n`;
  });

  // Download
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hand-${hand.handNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

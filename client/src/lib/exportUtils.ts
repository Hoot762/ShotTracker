import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Database } from '@/lib/supabase';

type Session = Database['public']['Tables']['sessions']['Row'];

// CSV Export Functions
export function exportToCSV(sessions: Session[], filename: string = 'shooting_sessions') {
  // Define headers
  const headers = [
    'Date',
    'Name',
    'Rifle',
    'Calibre',
    'Bullet Weight (gr)',
    'Distance (yards)',
    'Elevation (MOA)',
    'Windage (MOA)',
    'Total Score',
    'V Count',
    'Shot 1', 'Shot 2', 'Shot 3', 'Shot 4', 'Shot 5', 'Shot 6',
    'Shot 7', 'Shot 8', 'Shot 9', 'Shot 10', 'Shot 11', 'Shot 12',
    'Notes'
  ];

  // Convert sessions to CSV rows
  const rows = sessions.map(session => [
    new Date(session.date).toLocaleDateString(),
    session.name || '',
    session.rifle || '',
    session.calibre || '',
    session.bullet_weight?.toString() || '',
    session.distance?.toString() || '',
    session.elevation?.toString() || '',
    session.windage?.toString() || '',
    session.total_score?.toString() || '',
    session.v_count?.toString() || '',
    ...(session.shots || Array(12).fill('')).map((shot: any) => shot?.toString() || ''),
    session.notes || ''
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    )
  ].join('\n');

  // Download the file
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// PDF Export Functions
export function exportToPDF(sessions: Session[], filename: string = 'shooting_sessions') {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Shooting Sessions Report', 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Sessions: ${sessions.length}`, 14, 35);

  // Prepare table data
  const tableHeaders = [
    'Date',
    'Name',
    'Rifle',
    'Calibre',
    'Distance',
    'Total Score',
    'V Count'
  ];

  const tableData = sessions.map(session => [
    new Date(session.date).toLocaleDateString(),
    session.name || '',
    session.rifle || '',
    session.calibre || '',
    `${session.distance || ''} yds`,
    session.total_score?.toString() || '',
    session.v_count?.toString() || ''
  ]);

  // Generate table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 45, left: 14, right: 14, bottom: 20 },
  });

  // Add detailed session breakdown if there are few sessions
  if (sessions.length <= 5) {
    let currentY = (doc as any).lastAutoTable.finalY + 20;
    
    sessions.forEach((session, index) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      // Session header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Session ${index + 1}: ${session.name || 'Unnamed'}`, 14, currentY);
      currentY += 8;

      // Session details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const details = [
        `Date: ${new Date(session.date).toLocaleDateString()}`,
        `Rifle: ${session.rifle || 'N/A'} | Calibre: ${session.calibre || 'N/A'}`,
        `Bullet Weight: ${session.bullet_weight || 'N/A'} gr | Distance: ${session.distance || 'N/A'} yards`,
        `Elevation: ${session.elevation || 'N/A'} MOA | Windage: ${session.windage || 'N/A'} MOA`,
        `Total Score: ${session.total_score || 0} | V Count: ${session.v_count || 0}`
      ];

      details.forEach(detail => {
        doc.text(detail, 14, currentY);
        currentY += 5;
      });

      // Shots breakdown
      if (session.shots && session.shots.length > 0) {
        currentY += 3;
        doc.text('Shots:', 14, currentY);
        currentY += 5;
        
        const shotsText = session.shots
          .map((shot: any, i: number) => `${i + 1}: ${shot || 'M'}`)
          .join(' | ');
        
        // Split long shots text into multiple lines
        const maxWidth = 180;
        const lines = doc.splitTextToSize(shotsText, maxWidth);
        lines.forEach((line: string) => {
          doc.text(line, 20, currentY);
          currentY += 4;
        });
      }

      // Notes
      if (session.notes) {
        currentY += 3;
        doc.text('Notes:', 14, currentY);
        currentY += 5;
        const noteLines = doc.splitTextToSize(session.notes, 180);
        noteLines.forEach((line: string) => {
          doc.text(line, 20, currentY);
          currentY += 4;
        });
      }

      currentY += 10; // Space between sessions
    });
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
}

// Utility function to download files
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export filtered sessions based on current filters
export function exportFilteredSessions(
  sessions: Session[], 
  filters: any, 
  format: 'csv' | 'pdf',
  filename?: string
) {
  // Apply filters to sessions
  let filteredSessions = sessions;

  if (filters.name) {
    filteredSessions = filteredSessions.filter(s => 
      s.name?.toLowerCase().includes(filters.name.toLowerCase())
    );
  }

  if (filters.rifle) {
    filteredSessions = filteredSessions.filter(s => 
      s.rifle?.toLowerCase().includes(filters.rifle.toLowerCase())
    );
  }

  if (filters.distance) {
    filteredSessions = filteredSessions.filter(s => s.distance === filters.distance);
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredSessions = filteredSessions.filter(s => new Date(s.date) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filteredSessions = filteredSessions.filter(s => new Date(s.date) <= toDate);
  }

  // Generate filename based on filters
  const defaultFilename = generateFilename(filters);
  const finalFilename = filename || defaultFilename;

  // Export based on format
  if (format === 'csv') {
    exportToCSV(filteredSessions, finalFilename);
  } else {
    exportToPDF(filteredSessions, finalFilename);
  }

  return filteredSessions.length;
}

function generateFilename(filters: any): string {
  const parts = ['shooting_sessions'];
  
  if (filters.rifle) {
    parts.push(filters.rifle.replace(/[^a-zA-Z0-9]/g, '_'));
  }
  
  if (filters.distance) {
    parts.push(`${filters.distance}yds`);
  }
  
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : '';
    const to = filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : '';
    if (from && to) {
      parts.push(`${from}_to_${to}`);
    } else if (from) {
      parts.push(`from_${from}`);
    } else if (to) {
      parts.push(`to_${to}`);
    }
  }
  
  return parts.join('_');
}
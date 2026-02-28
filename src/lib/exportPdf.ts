import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnamneseRecord {
  id: string;
  patientName: string;
  createdAt: string | Date;
  template?: { name: string };
  data: Record<string, any>;
}

export function exportAnamneseToPDF(
  record: AnamneseRecord,
  doctorProfile: { fullName: string, crm: string, specialty: string, signatureAlign?: string, showLogoText?: boolean } | null = null,
  mode: 'compact' | 'full' = 'compact'
) {
  // Cria o documento em formato A4, retrato (portrait), com medidas em mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // Opcional: Texto "Anamnese Inteligente PWA"
  if (doctorProfile?.showLogoText !== false) {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Anamnese Inteligente PWA', pageWidth - marginX, 10, { align: 'right' });
    doc.setTextColor(0); // Volta pro preto
  }

  // 1. Cabeçalho / Título do Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleStr = record.template?.name ? `RELATÓRIO CLÍNICO - ${record.template.name.toUpperCase()}` : 'RELATÓRIO CLÍNICO DE ANAMNESE';
  doc.text(titleStr, pageWidth / 2, 20, { align: 'center' });

  // 1b. Metadados do Médico (Se existir)
  if (doctorProfile && doctorProfile.fullName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const nome = doctorProfile.fullName || '';
    const infoStr = [
      doctorProfile.specialty ? doctorProfile.specialty : null,
      doctorProfile.crm ? `CRM: ${doctorProfile.crm}` : null
    ].filter(Boolean).join(' | ');

    doc.text(nome, pageWidth / 2, 26, { align: 'center' });
    if (infoStr) {
      doc.text(infoStr, pageWidth / 2, 30, { align: 'center' });
    }
  }

  // 2. Metadados do Paciente
  const currentY = doctorProfile && doctorProfile.fullName ? 40 : 35;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Paciente: ${record.patientName}`, marginX, currentY);
  doc.text(`Data da Consulta: ${new Date(record.createdAt).toLocaleDateString('pt-BR')}`, marginX, currentY + 7);
  doc.text(`Template Utilizado: ${record.template?.name || "Padrão"}`, marginX, currentY + 14);

  // Linha Separadora
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY + 18, pageWidth - marginX, currentY + 18);

  // 3. Montagem da Tabela com os Dados (Extraídos pelo Gemini)
  // Converte a chave (que é kebab-case ou camelCase) para Capitalizada para fins de apresentação
  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const tableBody = Object.entries(record.data).map(([key, value]) => {
    // Se o valor for array (ex: cid_sugerido), join com quebra ou vírgula.
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return [formatKey(key), displayValue];
  });

  const bodyStylesConfig = mode === 'full' ? {
    font: 'helvetica',
    textColor: [51, 65, 85], // text-slate-700
    fontSize: 10,
    cellPadding: 8, // Maior no Full
  } : {
    font: 'helvetica',
    textColor: [51, 65, 85], // text-slate-700
    fontSize: 10,
    cellPadding: 4, // Compacto no Compact
  };

  autoTable(doc, {
    startY: currentY + 23,
    head: [['Campo Clínico', 'Descrição / Relato']],
    body: tableBody,
    theme: mode === 'full' ? 'striped' : 'grid', // No full temos linhas zebradas sem borda pesada
    headStyles: {
      fillColor: [30, 41, 59], // bg-slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      font: 'helvetica'
    },
    bodyStyles: bodyStylesConfig as any,
    columnStyles: {
      0: { cellWidth: mode === 'full' ? 60 : 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    margin: { left: marginX, right: marginX },
    // Quebra palavras muito longas
    styles: { overflow: 'linebreak' }
  });

  // 4. Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'Documento gerado via Anamnese Inteligente PWA - Processamento Local e Privado',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // 4b. Assinatura no final da última página
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  // Se o final da tabela estiver muito perto do fim da página, adicione uma nova
  if (finalY > pageHeight - 50) {
    doc.addPage();
  }

  if (doctorProfile && doctorProfile.fullName) {
    const sigY = finalY > pageHeight - 50 ? 40 : finalY + 40;
    doc.setLineWidth(0.5);

    const align = doctorProfile.signatureAlign || 'center';
    const sigWidth = 60;
    let startX = pageWidth / 2 - sigWidth / 2;
    let textX = pageWidth / 2;

    if (align === 'left') {
      startX = marginX;
      textX = marginX + (sigWidth / 2);
    } else if (align === 'right') {
      startX = pageWidth - marginX - sigWidth;
      textX = pageWidth - marginX - (sigWidth / 2);
    }

    doc.line(startX, sigY, startX + sigWidth, sigY);

    doc.setFontSize(10);
    doc.text(doctorProfile.fullName, textX, sigY + 5, { align: 'center' });
    if (doctorProfile.crm) {
      doc.text(`CRM: ${doctorProfile.crm}`, textX, sigY + 10, { align: 'center' });
    }
  }

  // 5. Download do PDF
  const safeFilename = record.patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Anamnese_${mode}_${safeFilename}.pdf`);
}

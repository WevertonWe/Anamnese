import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnamneseRecord {
  id: string;
  patientName: string;
  createdAt: string | Date;
  date?: string | Date;
  template?: { name: string; schema?: any };
  data: Record<string, any>;
}

export function exportAnamneseToPDF(
  record: AnamneseRecord,
  doctorProfile: { fullName: string, crm: string, specialty: string, signatureAlign?: string, showLogoText?: boolean } | null = null,
  mode: 'compact' | 'full' = 'compact',
  locale: string = 'pt',
  translations: Record<string, string> = {}
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

  const isEn = locale === 'en';
  const isEs = locale === 'es';

  // Opcional: Texto "Anamnese Inteligente PWA"
  if (doctorProfile?.showLogoText !== false) {
    doc.setFontSize(8);
    doc.setTextColor(150);
    const appName = isEn ? 'Intelligent Anamnesis PWA' : isEs ? 'Anamnesis Inteligente PWA' : 'Anamnese Inteligente PWA';
    doc.text(appName, pageWidth - marginX, 10, { align: 'right' });
    doc.setTextColor(0); // Volta pro preto
  }

  // 1. Cabeçalho / Título do Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titlePrefix = isEn ? 'CLINICAL REPORT' : isEs ? 'INFORME CLÍNICO' : 'RELATÓRIO CLÍNICO';
  const titleStr = record.template?.name ? `${titlePrefix} - ${record.template.name.toUpperCase()}` : titlePrefix;
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
  doc.text(`${isEn ? 'Patient' : isEs ? 'Paciente' : 'Paciente'}: ${record.patientName}`, marginX, currentY);
  const dataHistorica = record.date ? record.date : record.createdAt;
  const dateLocaleStr = isEn ? 'en-US' : isEs ? 'es-ES' : 'pt-BR';
  doc.text(`${isEn ? 'Date' : isEs ? 'Fecha' : 'Data'}: ${new Date(dataHistorica).toLocaleDateString(dateLocaleStr)}`, marginX, currentY + 7);
  doc.text(`Template: ${record.template?.name || (isEn ? "Standard" : isEs ? "Padrão" : "Padrão")}`, marginX, currentY + 14);

  // Linha Separadora
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY + 18, pageWidth - marginX, currentY + 18);

  // Montagem da Tabela com os Dados
  const formatKey = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const fieldLabels: Record<string, string> = {
    'observacoes_gerais': translations['observacoes_gerais'] || (isEn ? 'General Notes' : isEs ? 'Notas Generales' : 'Observações Gerais'),
    'cid_sugerido': translations['cid_sugerido'] || (isEn ? 'Suggested ICD-10' : isEs ? 'Diagnóstico Sugerido (CIE-10)' : 'Sugestão de CID-10'),
    'hipotese_diagnostica': translations['hipotese_diagnostica'] || (isEn ? 'Diagnostic Hypothesis' : isEs ? 'Hipótesis Diagnóstica' : 'Hipótese Diagnóstica'),
    'conduta_sugerida': translations['conduta_sugerida'] || (isEn ? 'Suggested Conduct' : isEs ? 'Conducta Sugerida' : 'Conduta Sugerida')
  };

  if (record.template && typeof record.template.schema === 'string') {
    try {
      const parsed = JSON.parse(record.template.schema);
      if (parsed.fields) {
        parsed.fields.forEach((f: any) => {
          if (f.id) fieldLabels[f.id] = translations[f.id] || f.label || formatKey(f.id);
        });
      }
    } catch (e) { }
  } else if (record.template && typeof record.template.schema === 'object') {
    const schemaObj: any = record.template.schema;
    if (schemaObj.fields) {
      schemaObj.fields.forEach((f: any) => {
        if (f.id) fieldLabels[f.id] = translations[f.id] || f.label || formatKey(f.id);
      });
    }
  }

  const hiddenFields = ['patient_name_extracted', 'consult_date_extracted'];

  const tableBody = Object.entries(record.data)
    .filter(([key]) => !hiddenFields.includes(key))
    .map(([key, value]) => {
      // Tentar traduzir as opções se for multiple choice armazenado como CSV
      let displayValue = String(value);
      if (typeof value === 'string' && value.includes(',') && translations[`${key}-options`]) {
        const parts = value.split(',').map(s => s.trim());
        const trParts = translations[`${key}-options`].split(',').map(s => s.trim());
        // Como não temos mapeamento exato 1:1 chave-valor nas opções, vamos fazer um replace se existir
        // Mas sem arriscar muito, vamos deixar o valor original
      }
      const finalLabel = fieldLabels[key] || formatKey(key);
      return [finalLabel, displayValue];
    });

  const bodyStylesConfig = mode === 'full' ? {
    font: 'helvetica',
    textColor: [51, 65, 85],
    fontSize: 10,
    cellPadding: 8,
  } : {
    font: 'helvetica',
    textColor: [51, 65, 85],
    fontSize: 10,
    cellPadding: 4,
  };

  const headLabel1 = isEn ? 'Clinical Field' : isEs ? 'Campo Clínico' : 'Campo Clínico';
  const headLabel2 = isEn ? 'Description / Report' : isEs ? 'Descripción / Relato' : 'Descrição / Relato';

  autoTable(doc, {
    startY: currentY + 23,
    head: [[headLabel1, headLabel2]],
    body: tableBody,
    theme: mode === 'full' ? 'striped' : 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
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

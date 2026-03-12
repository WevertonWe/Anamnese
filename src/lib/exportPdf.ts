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
  doctorProfile: { fullName: string, crm: string, specialty: string, signatureAlign?: string, showLogoText?: boolean, signatureImage?: string | null } | null = null,
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
    'cid': translations['cid_sugerido'] || (isEn ? 'Suggested ICD-10' : isEs ? 'Diagnóstico Sugerido (CIE-10)' : 'Sugestão de CID-10'),
    'hipotese_diagnostica': translations['hipotese_diagnostica'] || (isEn ? 'Diagnostic Hypothesis' : isEs ? 'Hipótesis Diagnóstica' : 'Hipótese Diagnóstica'),
    'conduta_sugerida': translations['conduta_sugerida'] || (isEn ? 'Suggested Conduct' : isEs ? 'Conducta Sugerida' : 'Conduta Sugerida'),
    'conduta': translations['conduta_sugerida'] || (isEn ? 'Suggested Conduct' : isEs ? 'Conducta Sugerida' : 'Conduta Sugerida'),
    'imc_calculado': isEn ? 'BMI (Calculated)' : isEs ? 'IMC (Calculado)' : 'IMC (Calculado)',
    'exames_sugeridos': translations['exames_sugeridos'] || (isEn ? 'Suggested Exams' : isEs ? 'Exámenes Sugeridos' : 'Exames Sugeridos'),
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

  const insightFields = ['hipotese_diagnostica', 'conduta_sugerida', 'cid_sugerido', 'cid', 'observacoes_gerais', 'imc_calculado', 'exames_sugeridos'];
  const hiddenFields = ['patient_name_extracted', 'consult_date_extracted'];

  const tableBody = Object.entries(record.data)
    .filter(([key]) => !hiddenFields.includes(key) && !insightFields.includes(key))
    .map(([key, value]) => {
      let displayValue = String(value);
      if (typeof value === 'string' && value.includes(',') && translations[`${key}-options`]) {
          // Translation logic placeholder
      }
      const finalLabel = fieldLabels[key] || formatKey(key);
      return [finalLabel, displayValue];
    });

  // 2b. IMC info (if exists) - Prominent but clean text
  const imcValue = record.data['imc_calculado'];
  let imcY = currentY + 18;
  if (imcValue) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`IMC: ${imcValue}`, marginX, currentY + 21);
      doc.setFont('helvetica', 'normal');
      imcY = currentY + 26;
  }

  // Linha Separadora
  doc.setLineWidth(0.5);
  doc.line(marginX, imcY, pageWidth - marginX, imcY);

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
    startY: imcY + 5,
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

  // 3b. Insights section (Hypothesis, Conduct, etc)
  const insightsData = insightFields
    .filter(key => key !== 'imc_calculado')
    .filter(key => record.data[key])
    .map(key => [fieldLabels[key] || formatKey(key), String(record.data[key])]);

  if (insightsData.length > 0) {
      const insightsHeadLabel = isEn ? 'Clinical Insights & Conduct' : isEs ? 'Insights y Conducta' : 'Insights Clínicos e Conduta';
      autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [[insightsHeadLabel, isEn ? 'Details' : isEs ? 'Detalles' : 'Detalhes']],
          body: insightsData,
          theme: 'grid',
          headStyles: {
              fillColor: [5, 150, 105],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              font: 'helvetica'
          },
          bodyStyles: {
              font: 'helvetica',
              textColor: [51, 65, 85],
              fontSize: 10,
              cellPadding: 6,
              fontStyle: 'italic'
          } as any,
          columnStyles: {
              0: { cellWidth: mode === 'full' ? 60 : 50, fontStyle: 'bold' },
              1: { cellWidth: 'auto' }
          },
          margin: { left: marginX, right: marginX},
          styles: { overflow: 'linebreak' }
      });
  }

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
  if (finalY > pageHeight - 65) {
    doc.addPage();
  }

  if (doctorProfile && doctorProfile.fullName) {
    const sigY = finalY > pageHeight - 65 ? 50 : finalY + 50;
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

    if (doctorProfile.signatureImage) {
      try {
        const base64Parts = doctorProfile.signatureImage.split(';');
        if (base64Parts.length > 0 && base64Parts[0].startsWith('data:image/')) {
          let format = base64Parts[0].split('/')[1].toUpperCase();
          if (format === 'JPG') format = 'JPEG';
          const imgW = 40;
          const imgH = 15;
          const imgX = startX + (sigWidth / 2) - (imgW / 2);
          const imgY = sigY - imgH - 1;
          doc.addImage(doctorProfile.signatureImage, format, imgX, imgY, imgW, imgH);
        }
      } catch (e) {
        console.error("Erro ao adicionar assinatura na exportação", e);
      }
    }

    doc.line(startX, sigY, startX + sigWidth, sigY);

    doc.setFontSize(10);
    doc.text(doctorProfile.fullName, textX, sigY + 5, { align: 'center' });
    if (doctorProfile.crm) {
      doc.text(`CRM: ${doctorProfile.crm}`, textX, sigY + 10, { align: 'center' });
    }

    // Selo de Autenticidade
    doc.setFontSize(6);
    doc.setTextColor(120);
    const dateStr = new Date().toLocaleString(isEn ? 'en-US' : isEs ? 'es-ES' : 'pt-BR');
    const sealPrefix = isEn ? 'Digitally Signed on' : isEs ? 'Firmado Digitalmente el' : 'Assinado Digitalmente em';
    const sealBy = isEn ? 'by' : isEs ? 'por' : 'por';
    doc.text(`${sealPrefix} ${dateStr} ${sealBy} ${doctorProfile.fullName}`, textX, sigY + 14, { align: 'center' });
    doc.setTextColor(0);
  }

  // 5. Download do PDF
  const safeFilename = record.patientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`Anamnese_${mode}_${safeFilename}.pdf`);
}

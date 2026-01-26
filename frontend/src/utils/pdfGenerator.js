import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

console.log('PDF Generator loaded - autoTable:', typeof autoTable);

/**
 * Generate a comprehensive PDF report for Email scan results
 */
export const generateEmailPDF = (scanData) => {
  console.log('generateEmailPDF called with:', scanData);
  
  try {
    const { subject, senderEmail, content, result } = scanData;
    const doc = new jsPDF();
    
    console.log('jsPDF instance created');
    console.log('doc.autoTable type:', typeof doc.autoTable);
    console.log('autoTable function:', typeof autoTable);
    
  // Title
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('PhishGuard - Email Analysis Report', 105, 20, { align: 'center' });
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  // Verdict Box
  doc.setFontSize(16);
  const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94]; // Red or Green
  doc.setFillColor(...verdictColor);
  doc.roundedRect(15, yPos, 180, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(
    result.is_phishing ? 'WARNING: PHISHING DETECTED' : 'SAFE CONTENT',
    105,
    yPos + 13,
    { align: 'center' }
  );
  yPos += 30;
  
  // Risk Score & Confidence
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos);
  doc.text(`Confidence: ${(result.confidence * 100).toFixed(2)}%`, 120, yPos);
  doc.text(`Severity: ${result.severity.toUpperCase()}`, 20, yPos + 7);
  yPos += 20;
  
  // Email Details Section
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('Email Details', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Email details table
  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Subject', subject || 'N/A'],
      ['Sender Email', senderEmail || 'N/A'],
      ['Email Body', content.substring(0, 200) + (content.length > 200 ? '...' : '')]
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 130 }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Detected Indicators Section
  if (result.explanation) {
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Detected Indicators', 20, yPos);
    yPos += 10;
    
    // Show Red Flags ONLY if phishing
    if (result.is_phishing && result.explanation.red_flags && result.explanation.red_flags.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text(`Phishing Indicators Found (${result.explanation.red_flag_count || result.explanation.red_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const redFlagRows = result.explanation.red_flags.map(flag => ['X', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Warning Sign']],
        body: redFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [239, 68, 68], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Show Green Flags ONLY if safe
    if (!result.is_phishing && result.explanation.green_flags && result.explanation.green_flags.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`Safety Indicators Found (${result.explanation.green_flag_count || result.explanation.green_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const greenFlagRows = result.explanation.green_flags.map(flag => ['OK', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Safety Sign']],
        body: greenFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [34, 197, 94], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Keywords Found
    if (result.explanation.keywords_found && result.explanation.keywords_found.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('Suspicious Keywords Detected:', 20, yPos);
      yPos += 7;
      
      const keywordRows = result.explanation.keywords_found.map(kw => [kw]);
      autoTable(doc, {
        startY: yPos,
        head: [['Keyword']],
        body: keywordRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Suspicious URLs
    if (result.explanation.suspicious_urls && result.explanation.suspicious_urls.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('Suspicious Links Detected:', 20, yPos);
      yPos += 7;
      
      const urlRows = result.explanation.suspicious_urls.map(item => [
        item.url,
        `${item.risk}%`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['URL', 'Risk']],
        body: urlRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 140 },
          1: { cellWidth: 30, halign: 'center' }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // Recommendation
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('Recommendation', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  const recommendation = result.is_phishing
    ? 'This content shows signs of phishing. Do not click any links, provide personal information, or respond. Delete it immediately and report if possible.'
    : 'This content appears to be legitimate. However, always verify sender identity and be cautious with sensitive information.';
  
  const splitRec = doc.splitTextToSize(recommendation, 170);
  doc.text(splitRec, 20, yPos);
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `PhishGuard Report - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`PhishGuard_Email_Report_${new Date().getTime()}.pdf`);
  console.log('PDF saved successfully');
  
  } catch (error) {
    console.error('Error generating Email PDF:', error);
    alert('Failed to generate PDF report. Please check the console for details.');
  }
};

/**
 * Generate a comprehensive PDF report for SMS scan results
 */
export const generateSMSPDF = (scanData) => {
  console.log('generateSMSPDF called with:', scanData);
  
  try {
    const { message, result } = scanData;
    const doc = new jsPDF();
    
    console.log('jsPDF instance created for SMS');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(147, 51, 234); // Purple
  doc.text('PhishGuard - SMS Analysis Report', 105, 20, { align: 'center' });
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  // Verdict Box
  doc.setFontSize(16);
  const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94];
  doc.setFillColor(...verdictColor);
  doc.roundedRect(15, yPos, 180, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(
    result.is_phishing ? 'WARNING: SMISHING DETECTED' : 'SAFE MESSAGE',
    105,
    yPos + 13,
    { align: 'center' }
  );
  yPos += 30;
  
  // Risk Score & Confidence
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos);
  doc.text(`Confidence: ${(result.confidence * 100).toFixed(2)}%`, 120, yPos);
  doc.text(`Severity: ${result.severity.toUpperCase()}`, 20, yPos + 7);
  yPos += 20;
  
  // Message Details Section
  doc.setFontSize(14);
  doc.setTextColor(147, 51, 234);
  doc.text('SMS Message Details', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // Message content
  autoTable(doc, {
    startY: yPos,
    head: [['Message Content']],
    body: [[message]],
    theme: 'striped',
    headStyles: { fillColor: [147, 51, 234] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 170 }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Detected Indicators Section
  if (result.explanation) {
    doc.setFontSize(14);
    doc.setTextColor(147, 51, 234);
    doc.text('Detected Indicators', 20, yPos);
    yPos += 10;
    
    // Show Red Flags ONLY if phishing
    if (result.is_phishing && result.explanation.red_flags && result.explanation.red_flags.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text(`Smishing Indicators Found (${result.explanation.red_flag_count || result.explanation.red_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const redFlagRows = result.explanation.red_flags.map(flag => ['X', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Warning Sign']],
        body: redFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [239, 68, 68], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Show Green Flags ONLY if safe
    if (!result.is_phishing && result.explanation.green_flags && result.explanation.green_flags.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`Safety Indicators Found (${result.explanation.green_flag_count || result.explanation.green_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const greenFlagRows = result.explanation.green_flags.map(flag => ['OK', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Safety Sign']],
        body: greenFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [34, 197, 94], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Keywords Found
    if (result.explanation.keywords_found && result.explanation.keywords_found.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text('Suspicious Keywords Detected:', 20, yPos);
      yPos += 7;
      
      const keywordRows = result.explanation.keywords_found.map(kw => [kw]);
      autoTable(doc, {
        startY: yPos,
        head: [['Keyword']],
        body: keywordRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 20, right: 20 }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // Recommendation
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(147, 51, 234);
  doc.text('Recommendation', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  const recommendation = result.is_phishing
    ? 'This SMS shows signs of smishing (SMS phishing). Do not click any links, provide personal information, or respond. Delete it immediately and report if possible.'
    : 'This SMS appears to be legitimate. However, always verify sender identity and be cautious with sensitive information.';
  
  const splitRec = doc.splitTextToSize(recommendation, 170);
  doc.text(splitRec, 20, yPos);
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `PhishGuard Report - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`PhishGuard_SMS_Report_${new Date().getTime()}.pdf`);
  console.log('SMS PDF saved successfully');
  
  } catch (error) {
    console.error('Error generating SMS PDF:', error);
    alert('Failed to generate PDF report. Please check the console for details.');
  }
};

/**
 * Generate a comprehensive PDF report for URL scan results
 */
export const generateURLPDF = (scanData) => {
  console.log('generateURLPDF called with:', scanData);
  
  try {
    const { url, result } = scanData;
    const doc = new jsPDF();
    
    console.log('jsPDF instance created for URL');
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // Orange
  doc.text('PhishGuard - URL Analysis Report', 105, 20, { align: 'center' });
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
  
  let yPos = 40;
  
  // Verdict Box
  doc.setFontSize(16);
  const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94];
  doc.setFillColor(...verdictColor);
  doc.roundedRect(15, yPos, 180, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(
    result.is_phishing ? 'WARNING: MALICIOUS URL DETECTED' : 'SAFE URL',
    105,
    yPos + 13,
    { align: 'center' }
  );
  yPos += 30;
  
  // Risk Score & Confidence
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos);
  doc.text(`Confidence: ${(result.confidence * 100).toFixed(2)}%`, 120, yPos);
  doc.text(`Severity: ${result.severity.toUpperCase()}`, 20, yPos + 7);
  yPos += 20;
  
  // URL Details Section
  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12);
  doc.text('URL Details', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  // URL table
  autoTable(doc, {
    startY: yPos,
    head: [['Analyzed URL']],
    body: [[url]],
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 170 }
    }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // URL Features
  if (result.explanation) {
    // Technical Metrics
    const metrics = [];
    
    if (result.explanation.url_length !== undefined) {
      metrics.push(['URL Length', `${result.explanation.url_length} characters`]);
    }
    if (result.explanation.has_ip !== undefined) {
      metrics.push(['Contains IP Address', result.explanation.has_ip ? 'Yes (Warning)' : 'No']);
    }
    if (result.explanation.suspicious_tld !== undefined) {
      metrics.push(['Suspicious Domain', result.explanation.suspicious_tld ? 'Yes (Warning)' : 'No']);
    }
    if (result.explanation.https !== undefined) {
      metrics.push(['HTTPS Enabled', result.explanation.https ? 'Yes' : 'No (Warning)']);
    }
    
    if (metrics.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(234, 88, 12);
      doc.text('Technical Metrics', 20, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: metrics,
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: 'bold' },
          1: { cellWidth: 100 }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Detected Indicators
    const indicators = [];
    
    // Show Red Flags ONLY if phishing
    if (result.is_phishing && result.explanation.red_flags && result.explanation.red_flags.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(234, 88, 12);
      doc.text('Detected Indicators', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(239, 68, 68);
      doc.text(`Phishing Indicators Found (${result.explanation.red_flag_count || result.explanation.red_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const redFlagRows = result.explanation.red_flags.map(flag => ['X', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Warning Sign']],
        body: redFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [239, 68, 68], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Show Green Flags ONLY if safe
    if (!result.is_phishing && result.explanation.green_flags && result.explanation.green_flags.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(234, 88, 12);
      doc.text('Detected Indicators', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94);
      doc.text(`Safety Indicators Found (${result.explanation.green_flag_count || result.explanation.green_flags.length}):`, 20, yPos);
      yPos += 10;
      
      const greenFlagRows = result.explanation.green_flags.map(flag => ['OK', flag]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['', 'Safety Sign']],
        body: greenFlagRows,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', textColor: [34, 197, 94], fontStyle: 'bold' },
          1: { cellWidth: 155, textColor: [60, 60, 60] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
  }
  
  // Recommendation
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(234, 88, 12);
  doc.text('Recommendation', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  const recommendation = result.is_phishing
    ? 'This URL shows signs of being malicious or a phishing site. Do not click this link or enter any personal information. Avoid visiting this website.'
    : 'This URL appears to be safe. However, always verify the domain and be cautious when entering sensitive information online.';
  
  const splitRec = doc.splitTextToSize(recommendation, 170);
  doc.text(splitRec, 20, yPos);
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `PhishGuard Report - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`PhishGuard_URL_Report_${new Date().getTime()}.pdf`);
  console.log('URL PDF saved successfully');
  
  } catch (error) {
    console.error('Error generating URL PDF:', error);
    alert('Failed to generate PDF report. Please check the console for details.');
  }
};

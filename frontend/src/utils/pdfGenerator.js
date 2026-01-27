import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

console.log('PDF Generator loaded - autoTable:', typeof autoTable);

/**
 * Add professional header with logo placeholder and user info
 */
const addPDFHeader = (doc, title, color, userInfo) => {
  // Header background
  doc.setFillColor(...color);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Logo/Brand section
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 8, 20, 20, 2, 2, 'F');
  doc.setFontSize(18);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text('PG', 20, 21, { align: 'center' });
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 18, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Phishing Detection & Analysis', 105, 25, { align: 'center' });
  
  // User info on right
  if (userInfo?.userName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`User: ${userInfo.userName}`, 200, 15, { align: 'right' });
  }
  if (userInfo?.userEmail) {
    doc.setFontSize(8);
    doc.text(userInfo.userEmail, 200, 20, { align: 'right' });
  }
  
  // Timestamp
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 30, { align: 'right' });
};

/**
 * Add professional footer with page numbers
 */
const addPDFFooter = (doc, reportType) => {
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 282, 195, 282);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('PhishGuard - Your Security Partner', 20, 287);
    doc.text(`${reportType} Report`, 105, 287, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
  }
};

/**
 * Create all indicators section showing complete list
 */
const addAllIndicatorsSection = (doc, result, yPos, themeColor) => {
  if (!result.explanation) return yPos;
  
  // Collect ALL indicators
  const allIndicators = [];
  const isPhishing = result.is_phishing === true;
  
  // Red flags (phishing indicators) - only show for phishing results
  if (isPhishing && result.explanation.red_flags && result.explanation.red_flags.length > 0) {
    result.explanation.red_flags.forEach(flag => {
      allIndicators.push({
        type: 'DANGER',
        indicator: flag,
        icon: 'X'
      });
    });
  }
  
  // Green flags (safety indicators) - only show for safe results
  if (!isPhishing && result.explanation.green_flags && result.explanation.green_flags.length > 0) {
    result.explanation.green_flags.forEach(flag => {
      allIndicators.push({
        type: 'SAFE',
        indicator: flag,
        icon: 'OK'
      });
    });
  }
  
  // Keywords found
  if (result.explanation.keywords_found && result.explanation.keywords_found.length > 0) {
    result.explanation.keywords_found.forEach(keyword => {
      allIndicators.push({
        type: 'KEYWORD',
        indicator: `Suspicious keyword: "${keyword}"`,
        icon: '!'
      });
    });
  }
  
  // Suspicious URLs
  if (result.explanation.suspicious_urls && result.explanation.suspicious_urls.length > 0) {
    result.explanation.suspicious_urls.forEach(urlItem => {
      allIndicators.push({
        type: 'URL',
        indicator: `Malicious link: ${urlItem.url} (Risk: ${urlItem.risk}%)`,
        icon: 'X'
      });
    });
  }
  
  // URL-specific indicators
  if (result.explanation.url_length !== undefined) {
    const status = result.explanation.url_length > 75 ? 'DANGER' : 'INFO';
    allIndicators.push({
      type: status,
      indicator: `URL length: ${result.explanation.url_length} characters ${result.explanation.url_length > 75 ? '(Suspicious)' : ''}`,
      icon: result.explanation.url_length > 75 ? '!' : 'i'
    });
  }
  
  if (result.explanation.has_ip !== undefined && result.explanation.has_ip) {
    allIndicators.push({
      type: 'DANGER',
      indicator: 'URL contains IP address instead of domain name',
      icon: 'X'
    });
  }
  
  if (result.explanation.suspicious_tld !== undefined && result.explanation.suspicious_tld) {
    allIndicators.push({
      type: 'DANGER',
      indicator: 'Suspicious top-level domain detected',
      icon: 'X'
    });
  }
  
  if (result.explanation.https !== undefined && !result.explanation.https) {
    allIndicators.push({
      type: 'DANGER',
      indicator: 'No HTTPS encryption detected',
      icon: 'X'
    });
  }
  
  // If we have indicators, display them all
  if (allIndicators.length > 0) {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 45;
    }
    
    doc.setFontSize(16);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Complete Indicators Analysis', 20, yPos);
    yPos += 5;
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Indicators Found: ${allIndicators.length}`, 20, yPos);
    yPos += 10;
    
    // Create table rows with color coding
    const indicatorRows = allIndicators.map(item => {
      let color;
      switch(item.type) {
        case 'DANGER': color = [239, 68, 68]; break;
        case 'SAFE': color = [34, 197, 94]; break;
        case 'KEYWORD': color = [251, 146, 60]; break;
        case 'URL': color = [239, 68, 68]; break;
        case 'INFO': color = [59, 130, 246]; break;
        default: color = [100, 100, 100];
      }
      
      return {
        icon: item.icon,
        type: item.type,
        indicator: item.indicator,
        color: color
      };
    });
    
    // Draw table with custom styling
    autoTable(doc, {
      startY: yPos,
      head: [['', 'Type', 'Indicator Detail']],
      body: indicatorRows.map(row => [row.icon, row.type, row.indicator]),
      theme: 'striped',
      headStyles: { 
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { 
          cellWidth: 12, 
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 11
        },
        1: { 
          cellWidth: 28,
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 9
        },
        2: { 
          cellWidth: 135,
          fontSize: 9
        }
      },
      didParseCell: function(data) {
        // Color code the icon and type columns
        if (data.column.index === 0 || data.column.index === 1) {
          if (data.row.index >= 0 && data.row.index < indicatorRows.length) {
            const rowColor = indicatorRows[data.row.index].color;
            data.cell.styles.textColor = rowColor;
          }
        }
      },
      styles: {
        cellPadding: 4,
        fontSize: 9,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  return yPos;
};

/**
 * Generate a comprehensive PDF report for Email scan results
 */
export const generateEmailPDF = (scanData, userInfo = null) => {
  console.log('generateEmailPDF called with:', scanData, 'User:', userInfo);
  
  try {
    const { subject, senderEmail, content, result } = scanData;
    const doc = new jsPDF();
    
    const themeColor = [37, 99, 235]; // Blue
    
    // Add professional header
    addPDFHeader(doc, 'Email Analysis Report', themeColor, userInfo);
    
    let yPos = 45;
    
    // Verdict Box with enhanced styling
    doc.setFontSize(16);
    const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94];
    doc.setFillColor(...verdictColor);
    doc.roundedRect(15, yPos, 180, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(
      result.is_phishing ? 'WARNING: PHISHING DETECTED' : 'SAFE CONTENT',
      105,
      yPos + 14,
      { align: 'center' }
    );
    yPos += 32;
    
    // Risk Summary Card
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos, 180, 28, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment', 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos + 16);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, 80, yPos + 16);
    doc.text(`Severity: ${result.severity.toUpperCase()}`, 140, yPos + 16);
    
    // Risk score bar
    const barWidth = (result.risk_score / 100) * 160;
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(20, yPos + 20, 160, 4, 1, 1, 'F');
    doc.setFillColor(...verdictColor);
    doc.roundedRect(20, yPos + 20, barWidth, 4, 1, 1, 'F');
    
    yPos += 38;
    
    // Email Details Section
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Email Details', 20, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Field', 'Value']],
      body: [
        ['Subject', subject || 'N/A'],
        ['Sender Email', senderEmail || 'N/A'],
        ['Email Body', content.substring(0, 300) + (content.length > 300 ? '...' : '')]
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold', fontSize: 9 },
        1: { cellWidth: 140, fontSize: 9 }
      },
      styles: {
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Add ALL indicators section
    yPos = addAllIndicatorsSection(doc, result, yPos, themeColor);
    
    // Recommendation Section
    if (yPos > 240) {
      doc.addPage();
      yPos = 45;
    }
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(15, yPos, 180, 35, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Security Recommendation', 20, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const recommendation = result.is_phishing
      ? 'This content shows strong signs of phishing. Do NOT click any links, provide personal information, or respond to this email. Delete it immediately and report it to your IT security team if applicable.'
      : 'This content appears to be legitimate. However, always verify sender identity through alternative channels before sharing sensitive information or clicking links.';
    
    const splitRec = doc.splitTextToSize(recommendation, 170);
    doc.text(splitRec, 20, yPos + 16);
    
    // Add professional footer
    addPDFFooter(doc, 'Email Analysis');
    
    // Save with timestamp
    doc.save(`PhishGuard_Email_Report_${new Date().getTime()}.pdf`);
    console.log('Email PDF saved successfully');
    
  } catch (error) {
    console.error('Error generating Email PDF:', error);
    alert('Failed to generate PDF report. Please check the console for details.');
  }
};

/**
 * Generate a comprehensive PDF report for SMS scan results
 */
export const generateSMSPDF = (scanData, userInfo = null) => {
  console.log('generateSMSPDF called with:', scanData, 'User:', userInfo);
  
  try {
    const { message, result } = scanData;
    const doc = new jsPDF();
    
    const themeColor = [147, 51, 234]; // Purple
    
    // Add professional header
    addPDFHeader(doc, 'SMS Analysis Report', themeColor, userInfo);
    
    let yPos = 45;
    
    // Verdict Box with enhanced styling
    doc.setFontSize(16);
    const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94];
    doc.setFillColor(...verdictColor);
    doc.roundedRect(15, yPos, 180, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(
      result.is_phishing ? 'WARNING: SMISHING DETECTED' : 'SAFE MESSAGE',
      105,
      yPos + 14,
      { align: 'center' }
    );
    yPos += 32;
    
    // Risk Summary Card
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos, 180, 28, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment', 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos + 16);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, 80, yPos + 16);
    doc.text(`Severity: ${result.severity.toUpperCase()}`, 140, yPos + 16);
    
    // Risk score bar
    const barWidth = (result.risk_score / 100) * 160;
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(20, yPos + 20, 160, 4, 1, 1, 'F');
    doc.setFillColor(...verdictColor);
    doc.roundedRect(20, yPos + 20, barWidth, 4, 1, 1, 'F');
    
    yPos += 38;
    
    // SMS Message Details
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SMS Message Details', 20, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Message Content']],
      body: [[message]],
      theme: 'grid',
      headStyles: { 
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 175, fontSize: 9 }
      },
      styles: {
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Add ALL indicators section
    yPos = addAllIndicatorsSection(doc, result, yPos, themeColor);
    
    // Recommendation Section
    if (yPos > 240) {
      doc.addPage();
      yPos = 45;
    }
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(15, yPos, 180, 35, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Security Recommendation', 20, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const recommendation = result.is_phishing
      ? 'This SMS shows strong signs of smishing (SMS phishing). Do NOT click any links, provide personal information, or respond to this message. Delete it immediately and report to your mobile carrier if possible.'
      : 'This SMS appears to be legitimate. However, always verify sender identity through official channels before clicking links or sharing sensitive information.';
    
    const splitRec = doc.splitTextToSize(recommendation, 170);
    doc.text(splitRec, 20, yPos + 16);
    
    // Add professional footer
    addPDFFooter(doc, 'SMS Analysis');
    
    // Save with timestamp
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
export const generateURLPDF = (scanData, userInfo = null) => {
  console.log('generateURLPDF called with:', scanData, 'User:', userInfo);
  
  try {
    const { url, result } = scanData;
    const doc = new jsPDF();
    
    const themeColor = [234, 88, 12]; // Orange
    
    // Add professional header
    addPDFHeader(doc, 'URL Analysis Report', themeColor, userInfo);
    
    let yPos = 45;
    
    // Verdict Box with enhanced styling
    doc.setFontSize(16);
    const verdictColor = result.is_phishing ? [239, 68, 68] : [34, 197, 94];
    doc.setFillColor(...verdictColor);
    doc.roundedRect(15, yPos, 180, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(
      result.is_phishing ? 'WARNING: MALICIOUS URL DETECTED' : 'SAFE URL',
      105,
      yPos + 14,
      { align: 'center' }
    );
    yPos += 32;
    
    // Risk Summary Card
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos, 180, 28, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment', 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Risk Score: ${result.risk_score}/100`, 20, yPos + 16);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(1)}%`, 80, yPos + 16);
    doc.text(`Severity: ${result.severity.toUpperCase()}`, 140, yPos + 16);
    
    // Risk score bar
    const barWidth = (result.risk_score / 100) * 160;
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(20, yPos + 20, 160, 4, 1, 1, 'F');
    doc.setFillColor(...verdictColor);
    doc.roundedRect(20, yPos + 20, barWidth, 4, 1, 1, 'F');
    
    yPos += 38;
    
    // URL Details
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('URL Details', 20, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Analyzed URL']],
      body: [[url]],
      theme: 'grid',
      headStyles: { 
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 175, fontSize: 9 }
      },
      styles: {
        cellPadding: 5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
    
    // Technical Analysis
    if (result.explanation) {
      const metrics = [];
      
      if (result.explanation.url_length !== undefined) {
        metrics.push([
          'URL Length', 
          `${result.explanation.url_length} characters`,
          result.explanation.url_length > 75 ? 'Suspicious' : 'Normal'
        ]);
      }
      if (result.explanation.has_ip !== undefined) {
        metrics.push([
          'IP Address', 
          result.explanation.has_ip ? 'Yes' : 'No',
          result.explanation.has_ip ? 'Warning' : 'OK'
        ]);
      }
      if (result.explanation.suspicious_tld !== undefined) {
        metrics.push([
          'Domain Type', 
          result.explanation.suspicious_tld ? 'Suspicious TLD' : 'Standard TLD',
          result.explanation.suspicious_tld ? 'Warning' : 'OK'
        ]);
      }
      if (result.explanation.https !== undefined) {
        metrics.push([
          'HTTPS Encryption', 
          result.explanation.https ? 'Enabled' : 'Disabled',
          result.explanation.https ? 'OK' : 'Warning'
        ]);
      }
      
      if (metrics.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(...themeColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Technical Analysis', 20, yPos);
        yPos += 8;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value', 'Status']],
          body: metrics,
          theme: 'grid',
          headStyles: { 
            fillColor: themeColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
          },
          margin: { left: 15, right: 15 },
          columnStyles: {
            0: { cellWidth: 55, fontStyle: 'bold', fontSize: 9 },
            1: { cellWidth: 80, fontSize: 9 },
            2: { cellWidth: 40, halign: 'center', fontSize: 9, fontStyle: 'bold' }
          },
          styles: {
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1
          },
          didParseCell: function(data) {
            // Color code status column
            if (data.column.index === 2 && data.row.index >= 0) {
              const status = data.cell.text[0];
              if (status === 'Warning' || status === 'Suspicious') {
                data.cell.styles.textColor = [239, 68, 68];
              } else if (status === 'OK' || status === 'Normal') {
                data.cell.styles.textColor = [34, 197, 94];
              }
            }
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
      }
    }
    
    // Add ALL indicators section
    yPos = addAllIndicatorsSection(doc, result, yPos, themeColor);
    
    // Recommendation Section
    if (yPos > 240) {
      doc.addPage();
      yPos = 45;
    }
    
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(15, yPos, 180, 35, 2, 2, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Security Recommendation', 20, yPos + 8);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const recommendation = result.is_phishing
      ? 'This URL shows strong signs of being malicious or a phishing site. Do NOT click this link or enter any personal information. Avoid visiting this website and report it if you received it via email or SMS.'
      : 'This URL appears to be safe. However, always verify the domain matches the expected website and use caution when entering sensitive information online.';
    
    const splitRec = doc.splitTextToSize(recommendation, 170);
    doc.text(splitRec, 20, yPos + 16);
    
    // Add professional footer
    addPDFFooter(doc, 'URL Analysis');
    
    // Save with timestamp
    doc.save(`PhishGuard_URL_Report_${new Date().getTime()}.pdf`);
    console.log('URL PDF saved successfully');
    
  } catch (error) {
    console.error('Error generating URL PDF:', error);
    alert('Failed to generate PDF report. Please check the console for details.');
  }
};

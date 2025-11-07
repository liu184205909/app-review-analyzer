'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, Loader2, CheckCircle, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  analysisData: any;
  appName: string;
}

export default function ExportDropdown({ analysisData, appName }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const generatePDFReport = async () => {
    // 动态导入jspdf和html2canvas
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // 添加标题
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('App Review Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // 添加应用信息
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`App: ${appName}`, 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Platform: ${analysisData.result?.app?.platform || 'N/A'}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Total Reviews: ${analysisData.result?.reviewCount || 0}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Analysis Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // 添加情感分析
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sentiment Analysis', 20, yPosition);
    yPosition += 10;

    const sentiment = analysisData.result?.analysis?.sentiment;
    if (sentiment) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Positive: ${sentiment.positive}%`, 30, yPosition);
      yPosition += 6;
      pdf.text(`Neutral: ${sentiment.neutral}%`, 30, yPosition);
      yPosition += 6;
      pdf.text(`Negative: ${sentiment.negative}%`, 30, yPosition);
      yPosition += 6;
    }

    // 添加关键问题
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Critical Issues', 20, yPosition);
    yPosition += 10;

    const criticalIssues = analysisData.result?.analysis?.criticalIssues || [];
    if (criticalIssues.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      criticalIssues.forEach((issue: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${issue.title}`, 25, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`   Frequency: ${issue.frequency} | Severity: ${issue.severity}`, 25, yPosition);
        yPosition += 6;

        // 添加示例（限制长度）
        if (issue.examples && issue.examples.length > 0) {
          pdf.text(`   Examples:`, 25, yPosition);
          yPosition += 5;
          issue.examples.slice(0, 2).forEach((example: string) => {
            const wrappedText = pdf.splitTextToSize(`   • ${example.substring(0, 80)}...`, pageWidth - 50);
            wrappedText.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 5;
            });
          });
        }
        yPosition += 3;
      });
    }

    // 添加体验问题
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Experience Issues', 20, yPosition);
    yPosition += 10;

    const experienceIssues = analysisData.result?.analysis?.experienceIssues || [];
    if (experienceIssues.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      experienceIssues.forEach((issue: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${issue.title}`, 25, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`   Frequency: ${issue.frequency}`, 25, yPosition);
        yPosition += 8;
      });
    }

    // 添加功能请求
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Feature Requests', 20, yPosition);
    yPosition += 10;

    const featureRequests = analysisData.result?.analysis?.featureRequests || [];
    if (featureRequests.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      featureRequests.forEach((request: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${request.title}`, 25, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`   Frequency: ${request.frequency}`, 25, yPosition);
        yPosition += 8;
      });
    }

    // 添加建议操作
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Priority Actions', 20, yPosition);
    yPosition += 10;

    const priorityActions = analysisData.result?.analysis?.priorityActions || [];
    if (priorityActions.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      priorityActions.forEach((action: string, index: number) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        const wrappedText = pdf.splitTextToSize(`${index + 1}. ${action}`, pageWidth - 40);
        wrappedText.forEach((line: string) => {
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
      });
    }

    // 保存PDF
    pdf.save(`${appName}-analysis-report.pdf`);
  };

  const generateJSONReport = () => {
    const reportData = {
      metadata: {
        appName,
        platform: analysisData.result?.app?.platform,
        generatedAt: new Date().toISOString(),
        reportVersion: '1.0'
      },
      summary: {
        totalReviews: analysisData.result?.reviewCount,
        analyzedReviews: analysisData.result?.analyzedCount,
        appRating: analysisData.result?.app?.rating,
        reviewCount: analysisData.result?.app?.reviewCount
      },
      sentiment: analysisData.result?.analysis?.sentiment,
      criticalIssues: analysisData.result?.analysis?.criticalIssues,
      experienceIssues: analysisData.result?.analysis?.experienceIssues,
      featureRequests: analysisData.result?.analysis?.featureRequests,
      priorityActions: analysisData.result?.analysis?.priorityActions,
      insights: analysisData.result?.analysis?.insights,
      reviews: analysisData.result?.reviews?.slice(0, 100) // 限制前100条评论
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appName}-analysis-report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = () => {
    let csvContent = '';

    // 添加标题行
    csvContent += 'App Review Analysis Report\n';
    csvContent += `App Name,${appName}\n`;
    csvContent += `Platform,${analysisData.result?.app?.platform || 'N/A'}\n`;
    csvContent += `Analysis Date,${new Date().toISOString()}\n`;
    csvContent += `Total Reviews,${analysisData.result?.reviewCount || 0}\n`;
    csvContent += `Analyzed Reviews,${analysisData.result?.analyzedCount || 0}\n\n`;

    // 添加情感分析
    const sentiment = analysisData.result?.analysis?.sentiment;
    if (sentiment) {
      csvContent += 'Sentiment Analysis\n';
      csvContent += 'Type,Percentage\n';
      csvContent += `Positive,${sentiment.positive}%\n`;
      csvContent += `Neutral,${sentiment.neutral}%\n`;
      csvContent += `Negative,${sentiment.negative}%\n\n`;
    }

    // 添加关键问题
    const criticalIssues = analysisData.result?.analysis?.criticalIssues || [];
    if (criticalIssues.length > 0) {
      csvContent += 'Critical Issues\n';
      csvContent += 'Title,Frequency,Severity,Example\n';
      criticalIssues.forEach((issue: any) => {
        const example = issue.examples?.[0] || '';
        csvContent += `"${issue.title}",${issue.frequency},${issue.severity},"${example.replace(/"/g, '""')}"\n`;
      });
      csvContent += '\n';
    }

    // 添加体验问题
    const experienceIssues = analysisData.result?.analysis?.experienceIssues || [];
    if (experienceIssues.length > 0) {
      csvContent += 'Experience Issues\n';
      csvContent += 'Title,Frequency,Example\n';
      experienceIssues.forEach((issue: any) => {
        const example = issue.examples?.[0] || '';
        csvContent += `"${issue.title}",${issue.frequency},"${example.replace(/"/g, '""')}"\n`;
      });
      csvContent += '\n';
    }

    // 添加功能请求
    const featureRequests = analysisData.result?.analysis?.featureRequests || [];
    if (featureRequests.length > 0) {
      csvContent += 'Feature Requests\n';
      csvContent += 'Title,Frequency,Example\n';
      featureRequests.forEach((request: any) => {
        const example = request.examples?.[0] || '';
        csvContent += `"${request.title}",${request.frequency},"${example.replace(/"/g, '""')}"\n`;
      });
    }

    // 创建并下载CSV文件
    const BOM = '\uFEFF'; // 添加BOM以支持中文显示
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${appName}-analysis-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'pdf' | 'json' | 'csv') => {
    setExportFormat(format);
    setIsExporting(true);
    setIsOpen(false);

    try {
      switch (format) {
        case 'pdf':
          setExportStatus('Generating PDF report...');
          await generatePDFReport();
          break;
        case 'json':
          setExportStatus('Generating JSON report...');
          generateJSONReport();
          break;
        case 'csv':
          setExportStatus('Generating CSV report...');
          generateCSVReport();
          break;
      }

      setExportStatus('Report exported successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 主按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
        {!isExporting && <ChevronDown className="w-4 h-4" />}
      </button>

      {/* 下拉菜单 */}
      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Export Format
            </div>

            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              <div className="text-left">
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-gray-500">Complete analysis report</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Table className="w-4 h-4 text-blue-500" />
              <div className="text-left">
                <div className="font-medium">JSON Data</div>
                <div className="text-xs text-gray-500">Raw structured data</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Table className="w-4 h-4 text-green-500" />
              <div className="text-left">
                <div className="font-medium">CSV Spreadsheet</div>
                <div className="text-xs text-gray-500">For Excel/Google Sheets</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 导出状态提示 */}
      {exportStatus && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className={`flex items-center gap-3 p-3 ${
            exportStatus.includes('successfully')
              ? 'text-green-700'
              : 'text-yellow-700'
          }`}>
            {exportStatus.includes('successfully') ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{exportStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Download, FileText, Table, Loader2, CheckCircle } from 'lucide-react';

interface ExportReportProps {
  analysisData: any;
  appName: string;
  className?: string;
}

export default function ExportReport({ analysisData, appName, className = "" }: ExportReportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

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

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('Preparing report...');

    try {
      switch (exportFormat) {
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

      setExportStatus('Report generated successfully!');
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
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
      </div>

      <div className="space-y-4">
        {/* 格式选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">PDF</div>
              <div className="text-xs text-gray-500">Complete report</div>
            </button>

            <button
              onClick={() => setExportFormat('json')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'json'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Table className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">JSON</div>
              <div className="text-xs text-gray-500">Raw data</div>
            </button>

            <button
              onClick={() => setExportFormat('csv')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                exportFormat === 'csv'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Table className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">CSV</div>
              <div className="text-xs text-gray-500">Spreadsheet</div>
            </button>
          </div>
        </div>

        {/* 导出按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {exportFormat.toUpperCase()} Report</span>
              </>
            )}
          </button>
        </div>

        {/* 状态提示 */}
        {exportStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            exportStatus.includes('successfully')
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {exportStatus.includes('successfully') ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            <span className="text-sm">{exportStatus}</span>
          </div>
        )}

        {/* 报告内容说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <div className="font-medium mb-2">Report includes:</div>
          <ul className="space-y-1 text-xs">
            <li>• App information and review statistics</li>
            <li>• Sentiment analysis breakdown</li>
            <li>• Critical issues with frequency and examples</li>
            <li>• Experience issues and feature requests</li>
            <li>• Priority action recommendations</li>
            <li>• Sample user reviews (first 100)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Lightbulb, MessageSquare, BarChart3, Eye, EyeOff } from 'lucide-react';

interface IssueItem {
  title: string;
  frequency: number;
  severity?: string;
  examples: string[];
  category: 'critical' | 'experience' | 'feature';
}

interface IssueHeatmapProps {
  analysis: {
    criticalIssues?: Array<{
      title: string;
      frequency: number;
      severity: string;
      examples: string[];
    }>;
    experienceIssues?: Array<{
      title: string;
      frequency: number;
      examples: string[];
    }>;
    featureRequests?: Array<{
      title: string;
      frequency: number;
      examples: string[];
    }>;
  };
  title?: string;
  className?: string;
}

export default function IssueHeatmap({ analysis, title = "🔍 问题主题热力图", className = "" }: IssueHeatmapProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'critical' | 'experience' | 'feature'>('all');
  const [showFrequency, setShowFrequency] = useState(true);

  // 将所有问题合并并分类
  const allIssues: IssueItem[] = [
    ...(analysis.criticalIssues?.map(issue => ({
      ...issue,
      category: 'critical' as const
    })) || []),
    ...(analysis.experienceIssues?.map(issue => ({
      ...issue,
      severity: 'medium' as const,
      category: 'experience' as const
    })) || []),
    ...(analysis.featureRequests?.map(issue => ({
      ...issue,
      severity: 'low' as const,
      category: 'feature' as const
    })) || [])
  ];

  // 按频率排序
  const sortedIssues = allIssues.sort((a, b) => b.frequency - a.frequency);

  // 过滤问题
  const filteredIssues = selectedCategory === 'all'
    ? sortedIssues
    : sortedIssues.filter(issue => issue.category === selectedCategory);

  // 计算统计
  const stats = {
    total: allIssues.length,
    critical: analysis.criticalIssues?.length || 0,
    experience: analysis.experienceIssues?.length || 0,
    feature: analysis.featureRequests?.length || 0
  };

  // 获取问题样式
  const getIssueStyle = (issue: IssueItem) => {
    const maxFrequency = Math.max(...allIssues.map(i => i.frequency));
    const intensity = issue.frequency / maxFrequency;

    // 基于类别的颜色
    const categoryColors = {
      critical: `bg-red-500 hover:bg-red-600`,
      experience: `bg-orange-500 hover:bg-orange-600`,
      feature: `bg-blue-500 hover:bg-blue-600`
    };

    // 基于严重程度的透明度
    const opacity = 0.3 + (intensity * 0.7); // 0.3 到 1.0

    return `${categoryColors[issue.category]} text-white transition-all duration-200 hover:scale-105 cursor-pointer relative overflow-hidden`;
  };

  // 获取问题大小
  const getIssueSize = (issue: IssueItem) => {
    const maxFrequency = Math.max(...allIssues.map(i => i.frequency));
    const intensity = issue.frequency / maxFrequency;

    // 根据频率调整大小
    if (intensity > 0.8) return 'px-6 py-4 text-lg font-bold';
    if (intensity > 0.6) return 'px-5 py-3 text-base font-semibold';
    if (intensity > 0.4) return 'px-4 py-2 text-sm font-medium';
    return 'px-3 py-2 text-xs font-medium';
  };

  // 获取类别图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'experience': return <TrendingDown className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return null;
    }
  };

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'experience': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'feature': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* 标题和描述 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => setShowFrequency(!showFrequency)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showFrequency ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showFrequency ? '隐藏频率' : '显示频率'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          基于AI分析显示最常见的问题主题。大小和颜色代表问题的重要程度和出现频率。点击查看详细信息。
        </p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="font-semibold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-600">总问题数</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="font-semibold text-red-600">{stats.critical}</div>
          <div className="text-xs text-red-600">严重问题</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="font-semibold text-orange-600">{stats.experience}</div>
          <div className="text-xs text-orange-600">体验问题</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="font-semibold text-blue-600">{stats.feature}</div>
          <div className="text-xs text-blue-600">功能请求</div>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部 ({stats.total})
        </button>
        <button
          onClick={() => setSelectedCategory('critical')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          严重问题 ({stats.critical})
        </button>
        <button
          onClick={() => setSelectedCategory('experience')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'experience'
              ? 'bg-orange-600 text-white'
              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-1" />
          体验问题 ({stats.experience})
        </button>
        <button
          onClick={() => setSelectedCategory('feature')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'feature'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <Lightbulb className="w-4 h-4 inline mr-1" />
          功能请求 ({stats.feature})
        </button>
      </div>

      {/* 问题热力图 */}
      <div className="min-h-[300px] bg-gray-50 rounded-lg p-6">
        {filteredIssues.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            没有找到对应类别的问题
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredIssues.map((issue, index) => (
              <div key={index} className="relative group">
                <div
                  className={`rounded-lg ${getIssueStyle(issue)} ${getIssueSize(issue)} shadow-md`}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(issue.category)}
                    <span className="truncate max-w-[200px]">{issue.title}</span>
                    {showFrequency && (
                      <span className="text-xs opacity-75 bg-black/20 px-2 py-1 rounded">
                        {issue.frequency}
                      </span>
                    )}
                  </div>
                </div>

                {/* 悬停显示详细信息 */}
                <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white p-4 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full left-0 mb-2 w-64">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(issue.category)}
                    <span className="font-semibold capitalize">{issue.category}</span>
                    {issue.severity && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">
                        {issue.severity}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mb-2">
                    <span className="font-medium">频率:</span> {issue.frequency} 次提及
                  </div>
                  <div className="text-xs text-gray-300">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    {issue.examples.length} 条相关评论
                  </div>
                  <div className="absolute bottom-0 left-4 transform translate-y-full">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 说明 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>严重问题 - 需要立即解决</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>体验问题 - 影响用户满意度</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>功能请求 - 用户期望的功能</span>
          </div>
        </div>
      </div>
    </div>
  );
}
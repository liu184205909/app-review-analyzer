'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, TrendingUp, Save, Download } from 'lucide-react';

interface SignupPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

/**
 * Modal shown to guests after their first analysis
 * Encourages them to sign up for more features
 */
export default function SignupPromoModal({ isOpen, onClose, onSignup }: SignupPromoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSignup = () => {
    onClose();
    onSignup();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            喜欢这个工具吗？
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            创建免费账户以保存分析历史、导出结果，并获得每月 <strong className="text-blue-600">3 次免费分析</strong>！
          </p>

          {/* Features Grid */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Save className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">保存分析历史</h3>
                <p className="text-xs text-gray-600">随时查看您的所有分析报告</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Download className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">导出完整报告</h3>
                <p className="text-xs text-gray-600">下载 PDF 或 Excel 格式</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">每月 3 次免费分析</h3>
                <p className="text-xs text-gray-600">比访客多 3 倍的使用次数</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignup}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              立即免费注册
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              稍后再说
            </button>
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-xs text-gray-400">
            注册仅需 30 秒 · 无需信用卡
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


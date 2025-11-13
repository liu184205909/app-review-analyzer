'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Mail,
  Settings,
  Save,
  CheckCircle,
  XCircle,
  Shield,
  Megaphone,
  BarChart3,
  User,
  ChevronLeft
} from 'lucide-react';

// Force dynamic rendering - do not prerender at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UserSettings {
  emailNotifications: boolean;
  analysisCompletedNotifications: boolean;
  marketingEmails: boolean;
  securityNotifications: boolean;
  name: string;
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    analysisCompletedNotifications: true,
    marketingEmails: false,
    securityNotifications: true,
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user settings');
      }

      const data = await response.json();
      const user = data.user;

      setSettings({
        emailNotifications: user.emailNotifications ?? true,
        analysisCompletedNotifications: user.analysisCompletedNotifications ?? true,
        marketingEmails: user.marketingEmails ?? false,
        securityNotifications: user.securityNotifications ?? true,
        name: user.name || '',
        email: user.email,
      });

    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          analysisCompletedNotifications: settings.analysisCompletedNotifications,
          marketingEmails: settings.marketingEmails,
          securityNotifications: settings.securityNotifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save settings');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/test-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setSuccessMessage('Test email sent successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (error) {
      console.error('Error sending test email:', error);
      setErrorMessage('Failed to send test email');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              </div>
              <p className="text-sm text-gray-500">Manage your account information</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={settings.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Name cannot be changed here</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-1">
                <Mail className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Email Notifications</h2>
              </div>
              <p className="text-sm text-gray-500">Control which emails you receive</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Master Toggle */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                    <p className="text-sm text-gray-500">Enable or disable all email notifications</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    emailNotifications: !settings.emailNotifications
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Analysis Completed Notifications */}
              <div className={`flex items-center justify-between py-3 ${!settings.emailNotifications ? 'opacity-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">Analysis Completion</label>
                    <p className="text-sm text-gray-500">Get notified when your analysis is complete</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    analysisCompletedNotifications: !settings.analysisCompletedNotifications
                  })}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.analysisCompletedNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                  } ${!settings.emailNotifications ? 'cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.analysisCompletedNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className={`flex items-center justify-between py-3 ${!settings.emailNotifications ? 'opacity-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <Megaphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">Marketing Emails</label>
                    <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    marketingEmails: !settings.marketingEmails
                  })}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails ? 'bg-indigo-600' : 'bg-gray-200'
                  } ${!settings.emailNotifications ? 'cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Security Notifications */}
              <div className={`flex items-center justify-between py-3 ${!settings.emailNotifications ? 'opacity-50' : ''}`}>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">Security Notifications</label>
                    <p className="text-sm text-gray-500">Important alerts about your account security</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    securityNotifications: !settings.securityNotifications
                  })}
                  disabled={!settings.emailNotifications}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.securityNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                  } ${!settings.emailNotifications ? 'cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.securityNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Test Email Button */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleSendTestEmail}
                  disabled={!settings.emailNotifications}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    settings.emailNotifications
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send Test Email
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
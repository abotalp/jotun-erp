import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('admin@jotun-store.com')
  const [password, setPassword] = useState('Jotun@Admin2025')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? '❌ بيانات الدخول غير صحيحة'
          : `❌ ${error.message}`
      )
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #1B2E4B 0%, #1B3A6B 50%, #0D1B2A 100%)'
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div
            className="p-8 text-center"
            style={{ background: 'linear-gradient(to left, #1B2E4B, #1B3A6B)' }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg text-4xl"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8960C)' }}
            >
              🎨
            </div>
            <h1 className="text-2xl font-black text-white mb-1">
              معرض جوتن للدهانات
            </h1>
            <p className="text-blue-200 text-sm">نظام الإدارة المتكامل</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
              تسجيل الدخول
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jotun-store.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                  >
                    {showPassword ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(to left, #D4AF37, #B8960C)'
                }}
              >
                {loading ? '⏳ جاري الدخول...' : '🔓 دخول'}
              </button>
            </form>

            <div className="mt-6 p-3 bg-blue-50 rounded-xl text-center">
              <p className="text-xs text-blue-700">
                <strong>للتجربة:</strong><br />
                admin@jotun-store.com<br />
                Jotun@Admin2025
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300 text-xs mt-4">
          Jotun Paint ERP © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
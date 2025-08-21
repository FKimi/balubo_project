"use client"

import type React from "react"
import Link from "next/link"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Menu, X, Search, Video, Code2, Target, Lightbulb, FileText, Bot } from "lucide-react"

export default function BaluboSite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "お名前は必須項目です"
    }
    if (!formData.email.trim()) {
      newErrors.email = "メールアドレスは必須項目です"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください"
    }
    if (!formData.message.trim()) {
      newErrors.message = "お問い合わせ内容は必須項目です"
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      alert("お問い合わせを送信しました。ありがとうございます。")
      setFormData({ name: "", company: "", email: "", message: "" })
    }
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground smooth-scroll">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600 tracking-tight">balubo</div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection("service")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              事業内容
            </button>
            <button
              onClick={() => scrollToSection("strength")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              強み
            </button>
            <button
              onClick={() => scrollToSection("company")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              会社概要
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              お問い合わせ
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100">
            <nav className="flex flex-col space-y-4 p-4">
              <button
                onClick={() => scrollToSection("service")}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                事業内容
              </button>
              <button
                onClick={() => scrollToSection("strength")}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                強み
              </button>
              <button
                onClick={() => scrollToSection("company")}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                会社概要
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                お問い合わせ
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Key Visual */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
            「物語」の力で、
            <br />
            <span className="text-blue-200">ビジネスを動かす。</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light leading-relaxed">
            コンテンツの力で企業の成長を支援します
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 text-gray-900 tracking-tight">ISSUES</h2>
          <h3 className="text-xl text-blue-600 font-semibold text-center mb-4">こんなお悩みはありませんか？</h3>
          <div className="grid gap-8 md:gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start space-x-6">
              <div className="bg-red-50 p-3 rounded-xl flex-shrink-0">
                <Search className="text-red-500" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">技術領域に精通したライターが見つからない</h3>
                <p className="text-lg leading-relaxed text-gray-700">
                  エンジニア採用やテックブログに必要な専門知識を持つライターや編集者の確保に苦労していませんか？
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start space-x-6">
              <div className="bg-orange-50 p-3 rounded-xl flex-shrink-0">
                <Target className="text-orange-500" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">コンテンツマーケティング戦略の立案</h3>
                <p className="text-lg leading-relaxed text-gray-700">
                  戦略設計から実行まで一貫してサポートできるパートナーがおらず、場当たり的な施策になってしまう...
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start space-x-6">
              <div className="bg-purple-50 p-3 rounded-xl flex-shrink-0">
                <Video className="text-purple-500" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">多様なコンテンツ形式での展開</h3>
                <p className="text-lg leading-relaxed text-gray-700">
                  記事だけでなく、動画・ウェビナー・イベントなど複数のメディアを組み合わせた統合的な企画を実現したい...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution & Strength */}
      <section id="strength" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 text-gray-900 tracking-tight">SOLUTIONS</h2>
          <h3 className="text-xl text-blue-600 font-semibold text-center mb-4">baluboができること</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 border border-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <Code2 className="text-blue-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">技術領域・エンジニア採用の専門性</h3>
              </div>
              <p className="leading-relaxed text-gray-700 text-lg mb-4">
                技術者向けメディア「CodeZine」や日経クロステックでの豊富な編集・企画経験を活かし、エンジニアに響くコンテンツを制作します。
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-blue-500 mr-2" />
                  技術ブログ・記事制作
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-blue-500 mr-2" />
                  エンジニア採用広報
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-blue-500 mr-2" />
                  技術カンファレンス企画
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-10 border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-gray-100 p-3 rounded-xl mr-4">
                  <Lightbulb className="text-gray-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">戦略的企画力と多様なアウトプット</h3>
              </div>
              <p className="leading-relaxed text-gray-700 text-lg mb-4">
                事業課題に合わせて最適なコンテンツ戦略を設計し、記事・動画・イベントを組み合わせた統合的なアプローチを提供します。
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-gray-500 mr-2" />
                  コンテンツ戦略設計
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-gray-500 mr-2" />
                  オウンドメディア運営
                </li>
                <li className="flex items-center">
                  <CheckCircle size={16} className="text-gray-500 mr-2" />
                  ウェビナー・イベント企画
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Service */}
      <section id="service" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 text-gray-900 tracking-tight">OUR BUSINESS</h2>
          <h3 className="text-xl text-blue-600 font-semibold text-center mb-4">事業内容</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-blue-50 p-3 rounded-xl mr-4">
                  <FileText className="text-blue-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">コンテンツ企画・制作事業</h3>
              </div>
              <div className="mb-6">
                <p className="text-lg font-semibold text-blue-600 mb-3">「物語」の力で、ビジネスを動かす。</p>
                <p className="leading-relaxed text-gray-700 text-lg">
                  私たちは、戦略的なコンテンツ制作とクリエイター支援の両輪で、企業のブランディングから採用課題までを解決するプロフェッショナル集団です。
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>記事・動画・イベントなどのコンテンツ企画から制作まで一貫してサポート</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>企業のブランディングや採用広報に特化したコンテンツ制作</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>スタートアップから大手企業まで幅広い業界での実績</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Link
                  href="/services/content-planning"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  詳細を見る →
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-purple-50 p-3 rounded-xl mr-4">
                  <Bot className="text-purple-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">AIポートフォリオサービス「balubo」</h3>
              </div>
              <div className="mb-6">
                <p className="text-lg font-semibold text-purple-600 mb-3">すべての才能に、最高の舞台を。</p>
                <p className="leading-relaxed text-gray-700 text-lg">
                  AIがあなたの作品を分析し、強みを客観的に発見・証明するポートフォリオサービスです。主観的だったポートフォリオに「客観性」をもたらし、クリエイターと企業の最適なマッチングを実現します。
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <a
                  href="https://www.balubo.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  詳細を見る →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company */}
      <section id="company" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 text-gray-900 tracking-tight">COMPANY</h2>
          <h3 className="text-xl text-blue-600 font-semibold text-center mb-4">会社概要</h3>
          <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100">
            <dl className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center">
                <dt className="font-bold mb-2 md:mb-0 md:w-32 text-gray-900 text-lg">社名</dt>
                <dd className="leading-relaxed text-gray-700 text-lg">株式会社balubo</dd>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <dt className="font-bold mb-2 md:mb-0 md:w-32 text-gray-900 text-lg">代表取締役</dt>
                <dd className="leading-relaxed text-gray-700 text-lg">君和田 郁弥</dd>
              </div>
              <div className="flex flex-col md:flex-row md:items-start">
                <dt className="font-bold mb-2 md:mb-0 md:w-32 text-gray-900 text-lg">所在地</dt>
                <dd className="leading-relaxed text-gray-700 text-lg">
                  〒150-0001 東京都 渋谷区 神宮前六丁目23番4号 桑野ビル2階
                </dd>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <dt className="font-bold mb-2 md:mb-0 md:w-32 text-gray-900 text-lg">設立年月日</dt>
                <dd className="leading-relaxed text-gray-700 text-lg">2024年4月1日</dd>
              </div>
              <div className="flex flex-col md:flex-row md:items-start">
                <dt className="font-bold mb-2 md:mb-0 md:w-32 text-gray-900 text-lg">事業内容</dt>
                <dd className="leading-relaxed text-gray-700 text-lg">
                  コンテンツ企画・制作事業
                  <br />
                  AIポートフォリオサービス「balubo」の開発・運営
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-2 text-gray-900 tracking-tight">CONTACT</h2>
          <h3 className="text-xl text-blue-600 font-semibold text-center mb-4">お問い合わせ</h3>
          <p className="text-center text-xl mb-16 leading-relaxed text-gray-600">
            コンテンツ制作のご相談、サービスに関するご質問など、お気軽にお問い合わせください。
          </p>

          <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-3 text-gray-900">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-semibold mb-3 text-gray-900">
                  会社名
                </label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-3 text-gray-900">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-3 text-gray-900">
                  お問い合わせ内容 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.message ? "border-red-500" : ""}`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-2">{errors.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-colors"
              >
                送信する
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="text-2xl font-bold mb-4 md:mb-0 text-blue-400 tracking-tight">balubo</div>
          <div className="text-sm text-gray-400">© balubo Inc. All Rights Reserved.</div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileDown, Mail } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  reportData?: any
}

export function ExportModal({ isOpen, onClose, reportData }: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'email'>('pdf')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleExport = async () => {
    setLoading(true)
    setStatus('idle')

    try {
      if (activeTab === 'pdf') {
        await generatePDF()
      } else {
        await sendEmail()
      }
      setStatus('success')
    } catch (error) {
      console.error('Export error:', error)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    // First fetch the report data from API (same as email)
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'pdf' })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)
      throw new Error('Failed to generate report')
    }
    
    const data = await response.json()
    console.log('PDF Data received:', data) // Debug log
    
    if (!data.success || !data.reportData) {
      throw new Error('Invalid report data received')
    }
    
    // Create PDF from the report data
    const pdf = new jsPDF('p', 'mm', 'a4')
    const reportData = data.reportData
    
    // Add content to PDF
    addPDFContent(pdf, reportData)
    
    // Download the PDF
    const fileName = `${reportData.companyInfo?.name || 'market-report'}-report.pdf`
    pdf.save(fileName)
  }

  const sendEmail = async () => {
    if (!email) {
      throw new Error('Email is required')
    }

    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'email', email })
    })

    if (!response.ok) throw new Error('Failed to send email')
  }

  const addPDFContent = (pdf: jsPDF, data: any) => {
    console.log('Adding PDF content with data:', data) // Debug log
    const { companyInfo, summary, newsAnalysis, competitorAnalysis, topCompetitors, factualSummary } = data
    
    let y = 20
    const pageWidth = 190
    const margin = 20

    // Header - with safe fallbacks
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(companyInfo?.name || 'Market Intelligence Report', margin, y)
    y += 10
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    const reportDate = summary?.reportDate ? new Date(summary.reportDate).toLocaleDateString() : new Date().toLocaleDateString()
    pdf.text(`Market Intelligence Report • ${reportDate}`, margin, y)
    y += 20

    // Executive Summary
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Executive Summary', margin, y)
    y += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    // Stats grid - handle undefined values
    const stats = [
      ['News Articles', summary?.newsArticles || 0],
      ['Competitors', summary?.competitorsTracked || 0],
      ['Critical Threats', summary?.criticalThreats || 0],
      ['High Threats', summary?.highThreats || 0]
    ]
    
    let x = margin
    stats.forEach(([label, value], index) => {
      pdf.setFont('helvetica', 'bold')
      pdf.text((value || 0).toString(), x, y)
      pdf.setFont('helvetica', 'normal')
      pdf.text(label || '', x, y + 5)
      x += 45
    })
    y += 20

    // Company details - handle undefined values
    pdf.text(`Industry: ${companyInfo?.industry || 'Unknown'} • Stage: ${companyInfo?.stage || 'Unknown'} • Target: ${companyInfo?.targetMarket || 'Unknown'}`, margin, y)
    y += 15

    // Top Competitors - only show if data exists
    if (topCompetitors && topCompetitors.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Top Competitors', margin, y)
      y += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      topCompetitors.slice(0, 5).forEach((comp: any) => {
        if (comp && comp.name) {
          pdf.setFont('helvetica', 'bold')
          pdf.text(comp.name, margin, y)
          y += 5
          
          pdf.setFont('helvetica', 'normal')
          const details = [
            comp.valuation ? `Valuation: ${comp.valuation}` : null,
            comp.stage ? `Stage: ${comp.stage}` : null,
            comp.employeeCount ? `Employees: ${comp.employeeCount}` : null
          ].filter(Boolean).join(' • ')
          
          if (details) {
            pdf.text(details, margin, y)
          }
          y += 8
        }
      })
    }
    y += 10

    // Market Analysis - handle undefined values
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Data Summary', margin, y)
    y += 10

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    const marketStats = [
      `Funding News: ${newsAnalysis?.funding || 0}`,
      `High-Risk Competitors: ${(competitorAnalysis?.critical || 0) + (competitorAnalysis?.high || 0)}`,
      `Valued Companies: ${competitorAnalysis?.withValuation || 0}`,
      `Risk Alerts: ${newsAnalysis?.riskAlerts || 0}`
    ]
    
    marketStats.forEach(stat => {
      pdf.text(`• ${stat}`, margin, y)
      y += 6
    })
    y += 10

    // Key Findings - handle undefined values
    if (factualSummary && factualSummary.length > 0) {
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Findings', margin, y)
      y += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      factualSummary.forEach((finding: string) => {
        const lines = pdf.splitTextToSize(`• ${finding}`, pageWidth - margin * 2)
        pdf.text(lines, margin, y)
        y += lines.length * 5 + 3
      })
    } else {
      // Show message if no findings
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Key Findings', margin, y)
      y += 10
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('• Fetching market intelligence data...', margin, y)
    }

    // Footer
    y = 280
    pdf.setFontSize(8)
    pdf.text('Generated by Kill My Startup • Market Intelligence Platform', margin, y)
    pdf.text(`Report generated on ${new Date().toLocaleDateString()}`, margin, y + 5)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-black rounded-2xl p-6 w-full max-w-md border border-white/10 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Export Report</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'pdf'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'email'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            {activeTab === 'pdf' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileDown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-medium mb-2">Download PDF Report</h3>
                <p className="text-white/60 text-sm">
                  Generate a comprehensive market intelligence report with charts and analysis.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 rounded-lg bg-black text-white border border-white/15 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                />
                <p className="text-white/50 text-xs mt-2">The report will be sent as a formatted HTML email.</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-400/30 rounded-lg">
              <p className="text-green-300 text-sm">
                {activeTab === 'pdf' ? 'PDF downloaded successfully!' : 'Email sent successfully!'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">
                Failed to {activeTab === 'pdf' ? 'generate PDF' : 'send email'}. Please try again.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-white/20 text-white/80 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading || (activeTab === 'email' && !email)}
              className="flex-1 py-2 px-4 bg-white text-black rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : activeTab === 'pdf' ? 'Download' : 'Send Email'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}



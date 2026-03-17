'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExtractedData {
  general?: { height?: number; weight?: number; bmi?: number; waist?: number }
  bloodTest?: {
    hemoglobin?: number; glucose?: number; cholesterol?: number
    hdl?: number; ldl?: number; triglyceride?: number
  }
  bloodPressure?: { systolic?: number; diastolic?: number }
  liver?: { ast?: number; alt?: number; ggt?: number }
  kidney?: { creatinine?: number; gfr?: number }
  findings?: string[]
  recommendations?: string[]
}

interface CheckupRecord {
  id: string
  fileName: string
  checkupDate: string
  institution: string | null
  extractedData: ExtractedData | null
  summary: string | null
}

export function CheckupUpload() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [checkupDate, setCheckupDate] = useState('')
  const [institution, setInstitution] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckupRecord | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF 파일만 업로드 가능합니다')
      return
    }

    if (selected.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하만 가능합니다')
      return
    }

    setFile(selected)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !checkupDate) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('checkupDate', checkupDate)
      if (institution) formData.append('institution', institution)

      const res = await fetch('/api/checkup', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || '업로드에 실패했습니다')
      }

      const body = await res.json()
      setResult(body.record)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>건강검진 PDF 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pdf-file">PDF 파일 *</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              <p className="text-xs text-muted-foreground">최대 20MB, PDF 형식만 가능</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkup-date">검진 날짜 *</Label>
                <Input
                  id="checkup-date"
                  type="date"
                  value={checkupDate}
                  onChange={(e) => setCheckupDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution">검진 기관</Label>
                <Input
                  id="institution"
                  type="text"
                  placeholder="예: 서울대학교병원"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading || !file || !checkupDate}>
              {loading ? '분석 중... (1-2분 소요)' : '업로드 및 분석'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 분석 결과 표시 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>분석 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.summary && (
              <div>
                <h4 className="font-medium mb-1">요약</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>
            )}

            {result.extractedData && (
              <div className="space-y-3">
                {/* 신체 계측 */}
                {result.extractedData.general && (
                  <DataSection title="신체 계측" data={{
                    '신장': result.extractedData.general.height ? `${result.extractedData.general.height} cm` : null,
                    '체중': result.extractedData.general.weight ? `${result.extractedData.general.weight} kg` : null,
                    'BMI': result.extractedData.general.bmi,
                    '허리둘레': result.extractedData.general.waist ? `${result.extractedData.general.waist} cm` : null,
                  }} />
                )}

                {/* 혈액 검사 */}
                {result.extractedData.bloodTest && (
                  <DataSection title="혈액 검사" data={{
                    '헤모글로빈': result.extractedData.bloodTest.hemoglobin ? `${result.extractedData.bloodTest.hemoglobin} g/dL` : null,
                    '혈당': result.extractedData.bloodTest.glucose ? `${result.extractedData.bloodTest.glucose} mg/dL` : null,
                    '콜레스테롤': result.extractedData.bloodTest.cholesterol ? `${result.extractedData.bloodTest.cholesterol} mg/dL` : null,
                    'HDL': result.extractedData.bloodTest.hdl ? `${result.extractedData.bloodTest.hdl} mg/dL` : null,
                    'LDL': result.extractedData.bloodTest.ldl ? `${result.extractedData.bloodTest.ldl} mg/dL` : null,
                    '중성지방': result.extractedData.bloodTest.triglyceride ? `${result.extractedData.bloodTest.triglyceride} mg/dL` : null,
                  }} />
                )}

                {/* 혈압 */}
                {result.extractedData.bloodPressure && (
                  <DataSection title="혈압" data={{
                    '수축기': result.extractedData.bloodPressure.systolic ? `${result.extractedData.bloodPressure.systolic} mmHg` : null,
                    '이완기': result.extractedData.bloodPressure.diastolic ? `${result.extractedData.bloodPressure.diastolic} mmHg` : null,
                  }} />
                )}

                {/* 간 기능 */}
                {result.extractedData.liver && (
                  <DataSection title="간 기능" data={{
                    'AST': result.extractedData.liver.ast ? `${result.extractedData.liver.ast} U/L` : null,
                    'ALT': result.extractedData.liver.alt ? `${result.extractedData.liver.alt} U/L` : null,
                    'GGT': result.extractedData.liver.ggt ? `${result.extractedData.liver.ggt} U/L` : null,
                  }} />
                )}

                {/* 신장 기능 */}
                {result.extractedData.kidney && (
                  <DataSection title="신장 기능" data={{
                    '크레아티닌': result.extractedData.kidney.creatinine ? `${result.extractedData.kidney.creatinine} mg/dL` : null,
                    'GFR': result.extractedData.kidney.gfr ? `${result.extractedData.kidney.gfr} mL/min` : null,
                  }} />
                )}

                {/* 소견 */}
                {result.extractedData.findings && result.extractedData.findings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">소견</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {result.extractedData.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 권고 사항 */}
                {result.extractedData.recommendations && result.extractedData.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">권고 사항</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {result.extractedData.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DataSection({ title, data }: { title: string; data: Record<string, string | number | null | undefined> }) {
  const entries = Object.entries(data).filter(([, v]) => v != null)
  if (entries.length === 0) return null

  return (
    <div>
      <h4 className="font-medium mb-1">{title}</h4>
      <div className="grid grid-cols-3 gap-2">
        {entries.map(([label, value]) => (
          <div key={label} className="text-sm">
            <span className="text-muted-foreground">{label}: </span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

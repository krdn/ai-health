import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { PDFParse } from 'pdf-parse'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { chatWithZhipu } from '@/lib/zhipu'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const CHECKUP_SYSTEM_PROMPT = `당신은 건강검진 결과 분석 AI 전문가입니다.
건강검진 PDF에서 추출된 텍스트를 분석하여 다음 JSON 형태로 구조화해주세요:
{
  "general": { "height": number, "weight": number, "bmi": number, "waist": number },
  "bloodTest": { "hemoglobin": number, "glucose": number, "cholesterol": number, "hdl": number, "ldl": number, "triglyceride": number },
  "bloodPressure": { "systolic": number, "diastolic": number },
  "liver": { "ast": number, "alt": number, "ggt": number },
  "kidney": { "creatinine": number, "gfr": number },
  "findings": ["소견1", "소견2"],
  "recommendations": ["권고1", "권고2"]
}
수치가 없는 항목은 null로 표시하세요. 추가로 전체 요약을 한국어 3-5문장으로 작성하세요.
JSON과 요약을 구분자 "---SUMMARY---"로 분리하세요.`

// POST /api/checkup - PDF 업로드 및 분석
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const checkupDate = formData.get('checkupDate') as string | null
    const institution = formData.get('institution') as string | null

    if (!file) {
      return NextResponse.json({ error: 'PDF 파일이 필요합니다' }, { status: 400 })
    }

    if (!checkupDate) {
      return NextResponse.json({ error: '검진 날짜가 필요합니다' }, { status: 400 })
    }

    // PDF 검증
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하만 가능합니다' }, { status: 400 })
    }

    // 파일 저장
    const userId = session.user.id
    const timestamp = Date.now()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    const uploadDir = path.join(process.cwd(), 'uploads', userId)
    await mkdir(uploadDir, { recursive: true })

    const fileName = `${timestamp}-${safeFileName}`
    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // PDF 텍스트 추출
    let pdfText: string
    try {
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      pdfText = result.text
      await parser.destroy()
    } catch {
      return NextResponse.json(
        { error: 'PDF 텍스트 추출에 실패했습니다. 올바른 PDF인지 확인해주세요.' },
        { status: 400 }
      )
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'PDF에서 텍스트를 추출할 수 없습니다. 스캔된 이미지 PDF는 지원하지 않습니다.' },
        { status: 400 }
      )
    }

    // AI 분석
    let extractedData: object | null = null
    let summary: string | null = null

    try {
      const aiResponse = await chatWithZhipu([
        { role: 'system', content: CHECKUP_SYSTEM_PROMPT },
        { role: 'user', content: `다음은 건강검진 PDF에서 추출된 텍스트입니다:\n\n${pdfText.slice(0, 8000)}` },
      ])

      const parts = aiResponse.split('---SUMMARY---')
      if (parts.length >= 2) {
        // JSON 부분 파싱
        const jsonMatch = parts[0].match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            extractedData = JSON.parse(jsonMatch[0])
          } catch {
            extractedData = null
          }
        }
        summary = parts[1].trim()
      } else {
        // 구분자가 없으면 전체를 요약으로 처리
        summary = aiResponse.trim()
      }
    } catch {
      // AI 분석 실패 시에도 레코드는 저장
      summary = 'AI 분석에 실패했습니다. 나중에 다시 시도해주세요.'
    }

    // DB 저장
    const record = await prisma.checkupRecord.create({
      data: {
        userId,
        fileName: file.name,
        filePath: `uploads/${userId}/${fileName}`,
        fileSize: file.size,
        checkupDate: new Date(checkupDate),
        institution: institution || null,
        extractedData: extractedData as object,
        summary,
      },
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '건강검진 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// GET /api/checkup - 건강검진 기록 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const userId = searchParams.get('userId')

    // 가족 구성원의 기록만 조회 가능
    const familyMembers = await prisma.user.findMany({
      where: { familyId: session.user.familyId },
      select: { id: true },
    })
    const familyMemberIds = familyMembers.map((m) => m.id)

    let targetUserIds: string[]
    if (userId) {
      if (!familyMemberIds.includes(userId)) {
        return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
      }
      targetUserIds = [userId]
    } else {
      targetUserIds = familyMemberIds
    }

    const where = { userId: { in: targetUserIds } }

    const [records, total] = await Promise.all([
      prisma.checkupRecord.findMany({
        where,
        orderBy: { checkupDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.checkupRecord.count({ where }),
    ])

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json(
      { error: '건강검진 기록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

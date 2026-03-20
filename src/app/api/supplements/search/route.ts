import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { auth } from '@/shared/lib/auth'
import { chatWithZhipu } from '@/shared/api/zhipu'
import { searchKoreanDrugs } from '@/features/supplements/lib/korean-drugs'

interface OpenFDAResult {
  openfda?: {
    brand_name?: string[]
    generic_name?: string[]
    manufacturer_name?: string[]
    route?: string[]
  }
  purpose?: string[]
  dosage_and_administration?: string[]
  warnings?: string[]
  active_ingredient?: string[]
}

interface KFDAResult {
  itemName?: string
  entpName?: string
  efcyQesitm?: string
  useMethodQesitm?: string
  atpnQesitm?: string
  intrcQesitm?: string
  seQesitm?: string
  itemIngr?: string
}

interface SearchResult {
  name: string
  category: 'PRESCRIPTION' | 'OTC' | 'SUPPLEMENT' | 'HERB'
  manufacturer?: string
  ingredients?: string
  usage?: string
  warnings?: string
  source: 'local' | 'kfda' | 'openfda' | 'ai' | 'dsld'
}

// GET /api/supplements/search - 약품 통합 검색
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const isKorean = /[가-힣]/.test(query)

    // 병렬로 로컬 DB + 외부 API 검색
    const [localResults, externalResults] = await Promise.all([
      searchLocal(query, session.user.familyId),
      searchExternal(query, isKorean),
    ])

    // 로컬 결과 우선, 중복 제거
    const localNames = new Set(localResults.map((r) => r.name.toLowerCase()))
    const dedupedExternal = externalResults.filter(
      (r) => !localNames.has(r.name.toLowerCase())
    )

    return NextResponse.json({
      results: [...localResults, ...dedupedExternal].slice(0, 20),
    })
  } catch {
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다' }, { status: 500 })
  }
}

// 로컬 DB 검색 (가족 카탈로그)
async function searchLocal(query: string, familyId: string): Promise<SearchResult[]> {
  const supplements = await prisma.familySupplement.findMany({
    where: {
      familyId,
      name: { contains: query, mode: 'insensitive' },
    },
    take: 5,
  })

  return supplements.map((s) => ({
    name: s.name,
    category: s.category,
    source: 'local' as const,
  }))
}

// 외부 API 검색
async function searchExternal(query: string, isKorean: boolean): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  // 내장 약품/보조제 데이터에서 즉시 검색 (한글/영문 모두)
  const builtinResults = searchKoreanDrugs(query).map((drug) => ({
    name: drug.name,
    category: drug.category,
    manufacturer: drug.manufacturer,
    ingredients: drug.ingredients,
    source: 'kfda' as const,
  }))
  results.push(...builtinResults)

  const promises: Promise<SearchResult[]>[] = []

  // 한국 식약처 API (키가 있는 경우)
  const kfdaKey = process.env.KFDA_API_KEY
  if (kfdaKey) {
    promises.push(searchKFDA(query, kfdaKey).catch(() => []))
  }

  // 영문이면 NIH DSLD + OpenFDA 병렬 검색
  if (!isKorean) {
    promises.push(searchDSLD(query).catch(() => []))
    promises.push(searchOpenFDA(query).catch(() => []))
  }

  // 내장 데이터에 결과가 없고 한글이면 AI 검색 시도
  if (isKorean && results.length === 0) {
    promises.push(searchWithAI(query).catch(() => []))
  }

  const apiResults = await Promise.all(promises)
  const apiFlat = apiResults.flat()

  // 중복 제거 (내장 데이터 우선)
  const existingNames = new Set(results.map((r) => r.name.toLowerCase()))
  const dedupedApi = apiFlat.filter((r) => !existingNames.has(r.name.toLowerCase()))
  results.push(...dedupedApi)

  return results
}

// NIH DSLD (Dietary Supplement Label Database) 검색 - 키 불필요, 9만7천+ 보조제 라벨
async function searchDSLD(query: string): Promise<SearchResult[]> {
  const searchTerm = encodeURIComponent(query)
  const url = `https://api.ods.od.nih.gov/dsld/v8/search-filter?q=${searchTerm}&size=8`

  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) return []

  const data = await res.json()

  // DSLD API 응답: { hits: [{ _id, _source: { productName, brand, ... } }] }
  interface DSLDHit {
    _id?: string
    _source?: {
      productName?: string
      brand?: string
      langualProductType?: string
      langualSupplementForm?: string
      netContentQuantities?: string
    }
  }
  const hits: DSLDHit[] = data?.hits || []

  // 중복 제품명 제거 (같은 이름 다른 사이즈)
  const seen = new Set<string>()

  return hits
    .filter((h) => {
      const name = h._source?.productName?.toLowerCase()
      if (!name || seen.has(name)) return false
      seen.add(name)
      return true
    })
    .slice(0, 8)
    .map((h) => {
      const src = h._source!
      // 제품 유형에서 카테고리 추출 (표시용, 성분이 아님)
      const productType = src.langualProductType
        ?.replace(/\[.*?\]/g, '')
        .replace('DIETARY SUPPLEMENT, ', '')
        .trim()

      return {
        name: src.productName!,
        category: 'SUPPLEMENT' as const,
        manufacturer: src.brand,
        // 성분은 비움 - 카테고리를 성분으로 오해하지 않도록
        ingredients: productType ? `분류: ${productType}` : undefined,
        source: 'dsld' as const,
      }
    })
}

// AI 기반 한글 약품 검색
async function searchWithAI(query: string): Promise<SearchResult[]> {
  const prompt = `"${query}"와 관련된 한국에서 판매되는 의약품/건강기능식품을 최대 5개 찾아주세요.

반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

[
  {
    "name": "정확한 제품명",
    "category": "PRESCRIPTION 또는 OTC 또는 SUPPLEMENT 또는 HERB",
    "manufacturer": "제조사명",
    "ingredients": "주요 성분 (간략히)"
  }
]

규칙:
- 실제 한국에서 판매되는 제품만 포함
- "${query}"를 포함하거나 관련된 제품만
- category 분류: PRESCRIPTION(처방약), OTC(일반의약품), SUPPLEMENT(건강기능식품), HERB(한방)
- 존재하지 않는 제품을 만들어내지 마세요
- JSON 배열만 출력하세요`

  const response = await chatWithZhipu([
    { role: 'system', content: '당신은 한국 의약품 데이터베이스입니다. JSON만 출력합니다.' },
    { role: 'user', content: prompt },
  ])

  let items: { name: string; category?: string; manufacturer?: string; ingredients?: string }[]
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || response.match(/(\[[\s\S]*\])/)
    const jsonStr = jsonMatch?.[1]?.trim() || response.trim()
    items = JSON.parse(jsonStr)
  } catch {
    return []
  }

  if (!Array.isArray(items)) return []

  const validCategories = ['PRESCRIPTION', 'OTC', 'SUPPLEMENT', 'HERB'] as const

  return items
    .filter((item) => item.name)
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      category: (validCategories.includes(item.category as typeof validCategories[number])
        ? item.category
        : 'OTC') as SearchResult['category'],
      manufacturer: item.manufacturer,
      ingredients: item.ingredients,
      source: 'ai' as const,
    }))
}

// 한국 식약처 의약품 검색 (e약은요)
async function searchKFDA(query: string, apiKey: string): Promise<SearchResult[]> {
  const url = new URL('https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList')
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('itemName', query)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '10')

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return []

  const data = await res.json()
  const items: KFDAResult[] = data?.body?.items || []

  return items.map((item) => ({
    name: item.itemName || query,
    category: 'OTC' as const,
    manufacturer: item.entpName,
    ingredients: item.itemIngr,
    usage: item.useMethodQesitm?.replace(/<[^>]*>/g, ''),
    warnings: [
      item.atpnQesitm,
      item.intrcQesitm,
      item.seQesitm,
    ].filter(Boolean).join(' | ').replace(/<[^>]*>/g, '').slice(0, 200),
    source: 'kfda' as const,
  }))
}

// OpenFDA 약품 검색
async function searchOpenFDA(query: string): Promise<SearchResult[]> {
  const searchTerm = encodeURIComponent(query)
  const url = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:"${searchTerm}"+openfda.generic_name:"${searchTerm}")&limit=5`

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return []

  const data = await res.json()
  const items: OpenFDAResult[] = data?.results || []

  return items
    .filter((item) => item.openfda?.brand_name?.[0] || item.openfda?.generic_name?.[0])
    .map((item) => {
      const brandName = item.openfda?.brand_name?.[0] || ''
      const genericName = item.openfda?.generic_name?.[0] || ''
      const name = brandName || genericName

      return {
        name,
        category: 'OTC' as const,
        manufacturer: item.openfda?.manufacturer_name?.[0],
        ingredients: item.active_ingredient?.[0]?.slice(0, 200) || genericName,
        usage: item.dosage_and_administration?.[0]?.replace(/<[^>]*>/g, '').slice(0, 200),
        warnings: item.warnings?.[0]?.replace(/<[^>]*>/g, '').slice(0, 200),
        source: 'openfda' as const,
      }
    })
}

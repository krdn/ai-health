// 자주 사용되는 한국 의약품/건강기능식품 내장 데이터
// 식약처 API 키 없이도 기본 검색 가능하도록 제공

interface KoreanDrug {
  name: string
  category: 'PRESCRIPTION' | 'OTC' | 'SUPPLEMENT' | 'HERB'
  manufacturer: string
  ingredients: string
}

export const KOREAN_DRUGS: KoreanDrug[] = [
  // 감기약
  { name: '판콜에이', category: 'OTC', manufacturer: '동아제약', ingredients: '아세트아미노펜, 클로르페니라민, 슈도에페드린' },
  { name: '판콜에스', category: 'OTC', manufacturer: '동아제약', ingredients: '아세트아미노펜, 덱스트로메토르판, 슈도에페드린' },
  { name: '판콜골드', category: 'OTC', manufacturer: '동아제약', ingredients: '아세트아미노펜, 구아이페네신, 클로르페니라민' },
  { name: '판피린', category: 'OTC', manufacturer: '동아제약', ingredients: '아세트아미노펜, 카페인, 트리프롤리딘' },
  { name: '타이레놀', category: 'OTC', manufacturer: '한국존슨앤드존슨', ingredients: '아세트아미노펜 500mg' },
  { name: '타이레놀ER', category: 'OTC', manufacturer: '한국존슨앤드존슨', ingredients: '아세트아미노펜 650mg 서방정' },
  { name: '화이투벤', category: 'OTC', manufacturer: '한미약품', ingredients: '아세트아미노펜, 클로르페니라민, 티페피딘' },
  { name: '콘택600', category: 'OTC', manufacturer: 'GSK', ingredients: '슈도에페드린, 클로르페니라민 서방캡슐' },
  { name: '씨콜드에스', category: 'OTC', manufacturer: '일양약품', ingredients: '아세트아미노펜, 클로르페니라민, 덱스트로메토르판' },
  { name: '어린이부루펜시럽', category: 'OTC', manufacturer: '삼아제약', ingredients: '이부프로펜' },

  // 해열진통제
  { name: '부루펜', category: 'OTC', manufacturer: '삼아제약', ingredients: '이부프로펜 200mg' },
  { name: '애드빌', category: 'OTC', manufacturer: '화이자', ingredients: '이부프로펜 200mg' },
  { name: '게보린', category: 'OTC', manufacturer: '삼진제약', ingredients: '이소프로필안티피린, 아세트아미노펜, 카페인' },
  { name: '펜잘', category: 'OTC', manufacturer: '종근당', ingredients: '이부프로펜 200mg' },
  { name: '사리돈', category: 'OTC', manufacturer: '바이엘', ingredients: '프로피페나존, 파라세타몰, 카페인' },
  { name: '아스피린프로텍트', category: 'OTC', manufacturer: '바이엘', ingredients: '아스피린 100mg 장용정' },

  // 소화제/위장약
  { name: '겔포스', category: 'OTC', manufacturer: '보령제약', ingredients: '인산알루미늄겔' },
  { name: '가스활명수', category: 'OTC', manufacturer: '동화약품', ingredients: '복합소화효소, 현호색, 계피' },
  { name: '까스명수', category: 'OTC', manufacturer: '동화약품', ingredients: '복합소화효소, 생강, 계피' },
  { name: '베아제', category: 'OTC', manufacturer: '대웅제약', ingredients: '리파아제, 판크레아틴' },
  { name: '훼스탈', category: 'OTC', manufacturer: '한독', ingredients: '판크레아틴, 헤미셀룰라아제, 담즙성분' },
  { name: '닥터베아제', category: 'OTC', manufacturer: '대웅제약', ingredients: '판크레아틴, 디메티콘' },
  { name: '개비스콘', category: 'OTC', manufacturer: 'Reckitt', ingredients: '알긴산나트륨, 탄산수소나트륨' },
  { name: '탈시드', category: 'OTC', manufacturer: '바이엘', ingredients: '하이드로탈사이트 500mg' },
  { name: '알마겔', category: 'OTC', manufacturer: '보령제약', ingredients: '수산화알루미늄, 수산화마그네슘' },
  { name: '스토가', category: 'OTC', manufacturer: '일동제약', ingredients: '시메티딘' },
  { name: '큐란', category: 'OTC', manufacturer: '한독', ingredients: '라니티딘' },

  // 알레르기/항히스타민
  { name: '지르텍', category: 'OTC', manufacturer: 'UCB', ingredients: '세티리진 10mg' },
  { name: '클라리틴', category: 'OTC', manufacturer: '바이엘', ingredients: '로라타딘 10mg' },
  { name: '알레그라', category: 'OTC', manufacturer: '사노피', ingredients: '펙소페나딘 120mg' },

  // 피부/외용제
  { name: '마데카솔', category: 'OTC', manufacturer: '동국제약', ingredients: '센텔라아시아티카 추출물' },
  { name: '후시딘', category: 'OTC', manufacturer: 'LEO', ingredients: '후시드산나트륨' },
  { name: '에스로반', category: 'OTC', manufacturer: 'GSK', ingredients: '무피로신' },

  // 비타민/영양제
  { name: '삐콤씨', category: 'SUPPLEMENT', manufacturer: '유한양행', ingredients: '비타민B군 복합, 비타민C' },
  { name: '임팩타민', category: 'SUPPLEMENT', manufacturer: '대웅제약', ingredients: '비타민B1, B2, B6, B12, 엽산' },
  { name: '센트룸', category: 'SUPPLEMENT', manufacturer: '화이자', ingredients: '멀티비타민 미네랄 복합' },
  { name: '얼라이브', category: 'SUPPLEMENT', manufacturer: 'Nature\'s Way', ingredients: '멀티비타민 미네랄 복합' },
  { name: '오쏘몰', category: 'SUPPLEMENT', manufacturer: '오쏘몰', ingredients: '멀티비타민, 미네랄, 오메가3' },
  { name: '비타민D 1000IU', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '콜레칼시페롤(비타민D3) 1000IU' },
  { name: '칼슘마그네슘아연', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '탄산칼슘, 산화마그네슘, 글루콘산아연' },
  { name: '루테인', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '마리골드꽃추출물(루테인)' },
  { name: '프로바이오틱스', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '락토바실러스, 비피더스균 복합' },
  { name: '오메가3', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: 'EPA, DHA' },
  { name: '철분', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '푸마르산제일철' },
  { name: '아연', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '글루콘산아연' },
  { name: '마그네슘', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '산화마그네슘' },
  { name: '코엔자임Q10', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '유비데카레논(코큐텐)' },
  { name: '밀크씨슬', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '밀크씨슬(실리마린)' },
  { name: '쏘팔메토', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '쏘팔메토열매추출물' },
  { name: '콜라겐', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '저분자 피쉬콜라겐 펩타이드' },
  { name: '글루코사민', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '글루코사민황산염' },

  // 한방
  { name: '우황청심원', category: 'HERB', manufacturer: '광동제약', ingredients: '우황, 사향, 산수유, 당귀, 백출' },
  { name: '쌍화탕', category: 'HERB', manufacturer: '광동제약', ingredients: '백작약, 숙지황, 당귀, 천궁, 황기' },
  { name: '경옥고', category: 'HERB', manufacturer: '광동제약', ingredients: '인삼, 생지황, 백복령, 봉밀' },

  // 처방약 (흔히 사용)
  { name: '리피토', category: 'PRESCRIPTION', manufacturer: '화이자', ingredients: '아토르바스타틴 (콜레스테롤 저하)' },
  { name: '노바스크', category: 'PRESCRIPTION', manufacturer: '화이자', ingredients: '암로디핀 (고혈압)' },
  { name: '크레스토', category: 'PRESCRIPTION', manufacturer: '아스트라제네카', ingredients: '로수바스타틴 (콜레스테롤 저하)' },
  { name: '메포르민', category: 'PRESCRIPTION', manufacturer: '다수', ingredients: '메트포르민 (당뇨)' },
  { name: '아모잘탄', category: 'PRESCRIPTION', manufacturer: '한미약품', ingredients: '암로디핀+로사르탄 (고혈압)' },
  { name: '넥시움', category: 'PRESCRIPTION', manufacturer: '아스트라제네카', ingredients: '에소메프라졸 (위산분비억제)' },

  // ── 건강보조제 (iHerb 인기 제품 / 글로벌 브랜드) ──

  // 종합비타민
  { name: 'California Gold Nutrition 멀티비타민', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '비타민A,C,D,E,K, B군, 칼슘, 마그네슘, 아연' },
  { name: 'Nature Made 멀티비타민', category: 'SUPPLEMENT', manufacturer: 'Nature Made', ingredients: '비타민A,C,D3,E, B1,B2,B6,B12, 엽산, 철분' },
  { name: '21st Century 멀티비타민', category: 'SUPPLEMENT', manufacturer: '21st Century', ingredients: '비타민 미네랄 종합' },
  { name: 'Kirkland Signature 멀티비타민', category: 'SUPPLEMENT', manufacturer: 'Kirkland', ingredients: '비타민 미네랄 종합, 루테인, 리코펜' },

  // 비타민C
  { name: 'California Gold Nutrition 비타민C 1000mg', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '아스코르브산(비타민C) 1000mg' },
  { name: 'Now Foods 비타민C-1000', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '아스코르브산 1000mg, 로즈힙' },
  { name: 'Doctor\'s Best 비타민C', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '비타민C 1000mg, Quali-C' },

  // 비타민D
  { name: 'California Gold Nutrition 비타민D3 5000IU', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '콜레칼시페롤(비타민D3) 5000IU' },
  { name: 'Now Foods 비타민D3 2000IU', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '콜레칼시페롤 2000IU' },
  { name: 'Sports Research 비타민D3+K2', category: 'SUPPLEMENT', manufacturer: 'Sports Research', ingredients: '비타민D3 5000IU, 비타민K2(MK-7) 100mcg' },

  // 오메가3/피쉬오일
  { name: 'California Gold Nutrition 오메가-3', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: 'EPA 360mg, DHA 240mg' },
  { name: 'Nordic Naturals Ultimate Omega', category: 'SUPPLEMENT', manufacturer: 'Nordic Naturals', ingredients: 'EPA 650mg, DHA 450mg' },
  { name: 'Now Foods 울트라 오메가-3', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'EPA 500mg, DHA 250mg' },
  { name: 'Sports Research 트리플 오메가-3', category: 'SUPPLEMENT', manufacturer: 'Sports Research', ingredients: 'EPA 690mg, DHA 300mg' },
  { name: 'Solgar 오메가-3', category: 'SUPPLEMENT', manufacturer: 'Solgar', ingredients: 'EPA 504mg, DHA 378mg' },
  { name: '뉴트리디데이 오메가3', category: 'SUPPLEMENT', manufacturer: '뉴트리디데이', ingredients: 'rTG 오메가3 EPA+DHA 900mg' },

  // 프로바이오틱스/유산균
  { name: 'California Gold Nutrition LactoBif', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '프로바이오틱스 300억 CFU, 8종 균주' },
  { name: 'Culturelle 프로바이오틱스', category: 'SUPPLEMENT', manufacturer: 'Culturelle', ingredients: '락토바실러스 GG 100억 CFU' },
  { name: 'Jarrow Formulas 유산균', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: '프로바이오틱스 100억 CFU' },
  { name: 'Garden of Life 프로바이오틱스', category: 'SUPPLEMENT', manufacturer: 'Garden of Life', ingredients: '프로바이오틱스 500억 CFU, 16종 균주' },
  { name: '종근당 락토핏 골드', category: 'SUPPLEMENT', manufacturer: '종근당건강', ingredients: '프로바이오틱스 100억 CFU, 프리바이오틱스' },

  // 마그네슘
  { name: 'Now Foods 마그네슘 시트레이트', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '구연산마그네슘 200mg' },
  { name: 'Doctor\'s Best 고흡수 마그네슘', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '킬레이트 마그네슘 100mg' },
  { name: 'Natural Vitality 캄 마그네슘', category: 'SUPPLEMENT', manufacturer: 'Natural Vitality', ingredients: '구연산마그네슘 325mg, 분말형' },
  { name: 'Life Extension 마그네슘', category: 'SUPPLEMENT', manufacturer: 'Life Extension', ingredients: '구연산마그네슘, 산화마그네슘 500mg' },

  // 아연
  { name: 'Now Foods 아연 50mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '글루콘산아연 50mg' },
  { name: 'Garden of Life 아연', category: 'SUPPLEMENT', manufacturer: 'Garden of Life', ingredients: '유기농 아연 30mg' },

  // 철분
  { name: 'Now Foods 철분', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '비스글리시네이트 철분 36mg' },
  { name: 'Solgar 젠틀 아이언', category: 'SUPPLEMENT', manufacturer: 'Solgar', ingredients: '비스글리시네이트 철분 25mg' },

  // 칼슘
  { name: 'Citracal 칼슘+D3', category: 'SUPPLEMENT', manufacturer: 'Bayer', ingredients: '구연산칼슘 630mg, 비타민D3 500IU' },
  { name: 'Now Foods 칼슘 시트레이트', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '구연산칼슘 300mg, 비타민D, 마그네슘' },

  // 코엔자임Q10
  { name: 'Doctor\'s Best 코큐텐', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '코엔자임Q10 100mg, BioPerine' },
  { name: 'Now Foods 코큐텐 100mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '유비퀴논(CoQ10) 100mg' },
  { name: 'Jarrow Formulas QH-absorb', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: '유비퀴놀(환원형 CoQ10) 100mg' },

  // 밀크씨슬/간 건강
  { name: 'Now Foods 실리마린', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '밀크씨슬 추출물(실리마린) 150mg' },
  { name: 'Jarrow Formulas 밀크씨슬', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: '실리마린 150mg (30:1 추출)' },

  // 루테인/눈 건강
  { name: 'Now Foods 루테인 20mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '루테인 20mg (마리골드 추출)' },
  { name: 'Doctor\'s Best 루테인 & 지아잔틴', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '루테인 20mg, 지아잔틴 4mg' },

  // 콜라겐
  { name: 'Sports Research 콜라겐 펩타이드', category: 'SUPPLEMENT', manufacturer: 'Sports Research', ingredients: '가수분해 콜라겐 펩타이드 Type I&III 11g' },
  { name: 'California Gold Nutrition 콜라겐 UP', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '해양 콜라겐, 히알루론산, 비타민C' },
  { name: 'Neocell 슈퍼 콜라겐', category: 'SUPPLEMENT', manufacturer: 'Neocell', ingredients: '가수분해 콜라겐 Type 1&3 6g' },

  // 글루코사민/관절 건강
  { name: 'Doctor\'s Best 글루코사민 콘드로이틴 MSM', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '글루코사민 1500mg, 콘드로이틴 1200mg, MSM 1000mg' },
  { name: 'Now Foods 글루코사민 & 콘드로이틴', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '글루코사민 750mg, 콘드로이틴 600mg' },
  { name: 'Move Free 관절건강', category: 'SUPPLEMENT', manufacturer: 'Schiff', ingredients: '글루코사민, 콘드로이틴, HA, 유니플렉스' },

  // 쏘팔메토/전립선
  { name: 'Now Foods 쏘팔메토 320mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '쏘팔메토 열매 추출물 320mg' },
  { name: 'Doctor\'s Best 쏘팔메토', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '쏘팔메토 추출물 320mg, Euromed' },

  // 크랜베리/요로 건강
  { name: 'Now Foods 크랜베리', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '크랜베리 농축 추출물' },
  { name: 'Nature\'s Way 크랜베리', category: 'SUPPLEMENT', manufacturer: 'Nature\'s Way', ingredients: '크랜베리 과일 추출물 400mg' },

  // 비오틴/헤어
  { name: 'Now Foods 비오틴 5000mcg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'D-비오틴 5000mcg' },
  { name: 'Sports Research 비오틴 10000mcg', category: 'SUPPLEMENT', manufacturer: 'Sports Research', ingredients: 'D-비오틴 10000mcg, 코코넛오일' },

  // NAC/항산화
  { name: 'Now Foods NAC 600mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'N-아세틸시스테인 600mg' },
  { name: 'Jarrow Formulas NAC Sustain', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: 'N-아세틸시스테인 600mg 서방정' },

  // 커큐민/강황
  { name: 'Doctor\'s Best 커큐민', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '커큐민 C3 Complex 500mg, BioPerine' },
  { name: 'Now Foods 커큐민', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '강황 추출물(커큐민 95%) 665mg' },
  { name: 'Jarrow Formulas 커큐민 95', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: '커큐민 95% 500mg' },

  // 아쉬와간다/스트레스
  { name: 'Now Foods 아쉬와간다 450mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '아쉬와간다 뿌리 추출물 450mg' },
  { name: 'KSM-66 아쉬와간다', category: 'SUPPLEMENT', manufacturer: 'Ixoreal Biomed', ingredients: '아쉬와간다 뿌리 추출물(KSM-66) 600mg' },

  // 엘더베리/면역
  { name: 'Sambucol 블랙 엘더베리', category: 'SUPPLEMENT', manufacturer: 'Sambucol', ingredients: '블랙 엘더베리 추출물, 비타민C, 아연' },
  { name: 'Nature\'s Way 삼부커스 엘더베리', category: 'SUPPLEMENT', manufacturer: 'Nature\'s Way', ingredients: '블랙 엘더베리 추출물 시럽' },

  // 단백질 보충제
  { name: 'Optimum Nutrition Gold Standard Whey', category: 'SUPPLEMENT', manufacturer: 'Optimum Nutrition', ingredients: '유청단백질 분리물(WPI), 유청농축물 24g' },
  { name: 'Dymatize ISO100', category: 'SUPPLEMENT', manufacturer: 'Dymatize', ingredients: '가수분해 유청단백질 분리물 25g' },
  { name: 'Garden of Life 유기농 식물성 프로틴', category: 'SUPPLEMENT', manufacturer: 'Garden of Life', ingredients: '완두콩, 현미, 치아씨드 단백질 22g' },

  // 크레아틴
  { name: 'Optimum Nutrition 크레아틴', category: 'SUPPLEMENT', manufacturer: 'Optimum Nutrition', ingredients: '크레아틴 모노하이드레이트 5g' },
  { name: 'Now Foods 크레아틴 모노하이드레이트', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '크레아틴 모노하이드레이트 5g' },

  // 멜라토닌/수면
  { name: 'Now Foods 멜라토닌 3mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '멜라토닌 3mg' },
  { name: 'Natrol 멜라토닌 5mg', category: 'SUPPLEMENT', manufacturer: 'Natrol', ingredients: '멜라토닌 5mg, 비타민B6' },

  // 엽산
  { name: 'Now Foods 엽산 800mcg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '엽산(비타민B9) 800mcg, 비타민B12' },
  { name: 'Thorne 5-MTHF', category: 'SUPPLEMENT', manufacturer: 'Thorne', ingredients: '활성엽산(5-MTHF) 1mg' },

  // 레시틴/포스파티딜세린
  { name: 'Now Foods 레시틴 1200mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '대두레시틴 1200mg(포스파티딜콜린)' },
  { name: 'Doctor\'s Best 포스파티딜세린', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '포스파티딜세린(PS) 100mg' },

  // PEA (팔미토일에탄올아마이드) / 통증 완화
  { name: 'California Gold Nutrition PEA', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '팔미토일에탄올아마이드(PEA) 300mg' },
  { name: 'California Gold Nutrition PEA 600mg', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '팔미토일에탄올아마이드(PEA) 600mg' },
  { name: 'Now Foods PEA', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '팔미토일에탄올아마이드(PEA) 600mg' },
  { name: 'Doctor\'s Best PEA', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: 'PEA(팔미토일에탄올아마이드) 400mg' },
  { name: 'Life Extension PEA Discomfort Relief', category: 'SUPPLEMENT', manufacturer: 'Life Extension', ingredients: 'PEA(Levagen+) 300mg' },

  // 보스웰리아/관절
  { name: 'California Gold Nutrition 보스웰리아', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '보스웰리아 추출물 500mg' },
  { name: 'Now Foods 보스웰리아', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '보스웰리아 세라타 추출물 500mg' },
  { name: 'Doctor\'s Best 보스웰리아', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '보스웰리아 추출물(AKBA 30%) 250mg' },

  // 케르세틴/면역
  { name: 'California Gold Nutrition 케르세틴', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '케르세틴(Quercetin) 500mg' },
  { name: 'Now Foods 케르세틴', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '케르세틴 500mg, 브로멜라인' },

  // 셀레늄
  { name: 'Now Foods 셀레늄 200mcg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'L-셀레노메티오닌 200mcg' },

  // 베르베린/혈당
  { name: 'Now Foods 베르베린', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '베르베린 HCl 500mg' },
  { name: 'Thorne 베르베린', category: 'SUPPLEMENT', manufacturer: 'Thorne', ingredients: '베르베린 1000mg' },

  // 알파리포산
  { name: 'Now Foods 알파리포산 600mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '알파리포산(ALA) 600mg' },
  { name: 'Doctor\'s Best 알파리포산', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '알파리포산 600mg' },

  // 아스타잔틴
  { name: 'California Gold Nutrition 아스타잔틴', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: '아스타잔틴 12mg (AstaLif)' },
  { name: 'Now Foods 아스타잔틴', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '아스타잔틴 4mg' },
  { name: 'Sports Research 아스타잔틴', category: 'SUPPLEMENT', manufacturer: 'Sports Research', ingredients: '아스타잔틴 12mg (AstaZine)' },

  // 아연카르노신/위장 건강
  { name: 'Force Factor Zinc-L-Carnosine Complex', category: 'SUPPLEMENT', manufacturer: 'Force Factor', ingredients: 'Zinc-L-Carnosine(아연카르노신) 75mg, 위 점막 보호' },
  { name: 'Doctor\'s Best Zinc-L-Carnosine Complex', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: 'Zinc-L-Carnosine(PepZin GI) 75mg' },
  { name: 'Now Foods Zinc-L-Carnosine', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'Zinc-L-Carnosine 75mg (아연카르노신)' },
  { name: 'Integrative Therapeutics Zinc-Carnosine', category: 'SUPPLEMENT', manufacturer: 'Integrative Therapeutics', ingredients: 'Zinc-Carnosine 75mg (PepZin GI)' },
  { name: 'Swanson Zinc Carnosine', category: 'SUPPLEMENT', manufacturer: 'Swanson', ingredients: 'Zinc-L-Carnosine(PepZin GI) 60mg' },

  // L-글루타민/장 건강
  { name: 'Now Foods L-Glutamine 500mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'L-글루타민 500mg' },
  { name: 'Jarrow Formulas L-Glutamine', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: 'L-글루타민 1000mg' },

  // DGL/위 건강
  { name: 'Now Foods DGL', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '탈글리시리진화 감초 추출물(DGL) 400mg' },
  { name: 'Enzymatic Therapy DGL', category: 'SUPPLEMENT', manufacturer: 'Enzymatic Therapy', ingredients: 'DGL 감초 추출물 760mg' },

  // 비타민K2
  { name: 'Now Foods 비타민K2 MK-7 100mcg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '비타민K2(MK-7, 메나퀴논-7) 100mcg' },
  { name: 'Life Extension Super K', category: 'SUPPLEMENT', manufacturer: 'Life Extension', ingredients: '비타민K1, K2(MK-4, MK-7) 복합' },
  { name: 'Thorne 비타민K2', category: 'SUPPLEMENT', manufacturer: 'Thorne', ingredients: '비타민K2(MK-4) 15mg' },

  // 소화효소
  { name: 'Now Foods Super Enzymes', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '브로멜라인, 판크레아틴, 파파인, 옥스바일' },
  { name: 'Doctor\'s Best Digestive Enzymes', category: 'SUPPLEMENT', manufacturer: 'Doctor\'s Best', ingredients: '소화효소 복합(프로테아제, 리파아제, 아밀라아제)' },

  // GABA/수면/스트레스
  { name: 'Now Foods GABA 500mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'GABA(감마아미노부티르산) 500mg' },
  { name: 'California Gold Nutrition GABA', category: 'SUPPLEMENT', manufacturer: 'California Gold Nutrition', ingredients: 'GABA 750mg' },
  { name: 'Now Foods L-Theanine 200mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'L-테아닌(Suntheanine) 200mg' },

  // 라이신/면역
  { name: 'Now Foods L-Lysine 500mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: 'L-라이신 HCl 500mg' },
  { name: 'Quantum Health Super Lysine+', category: 'SUPPLEMENT', manufacturer: 'Quantum Health', ingredients: 'L-라이신 1500mg, 비타민C, 마늘, 프로폴리스' },

  // 타우린
  { name: 'Now Foods Taurine 1000mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '타우린 1000mg' },

  // 피크노제놀
  { name: 'Now Foods Pycnogenol 30mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '피크노제놀(프랑스해송수피추출물) 30mg' },
  { name: 'Life Extension Pycnogenol', category: 'SUPPLEMENT', manufacturer: 'Life Extension', ingredients: '피크노제놀 100mg' },

  // 레스베라트롤
  { name: 'Now Foods 레스베라트롤', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '레스베라트롤(폴리고넘 추출물) 200mg' },
  { name: 'Life Extension 레스베라트롤', category: 'SUPPLEMENT', manufacturer: 'Life Extension', ingredients: '트랜스-레스베라트롤 250mg' },

  // 포스포리피드/브레인
  { name: 'Jarrow Formulas 시티콜린(CDP-Choline)', category: 'SUPPLEMENT', manufacturer: 'Jarrow Formulas', ingredients: 'CDP-콜린(시티콜린) 250mg' },
  { name: 'Now Foods Alpha GPC 300mg', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '알파 GPC(L-알파 글리세릴포스포릴콜린) 300mg' },

  // 아이오딘/요오드
  { name: 'Now Foods 켈프(요오드)', category: 'SUPPLEMENT', manufacturer: 'Now Foods', ingredients: '요오드(켈프 유래) 150mcg' },
]

// 검색 함수 - 복합 키워드 지원 (모든 단어가 매칭되어야 함)
export function searchKoreanDrugs(query: string): KoreanDrug[] {
  const q = query.toLowerCase().trim()
  const keywords = q.split(/\s+/).filter((k) => k.length > 0)

  if (keywords.length === 0) return []

  const scored = KOREAN_DRUGS
    .map((drug) => {
      const searchText = `${drug.name} ${drug.ingredients} ${drug.manufacturer}`.toLowerCase()

      // 모든 키워드가 포함되어야 함
      const allMatch = keywords.every((kw) => searchText.includes(kw))
      if (!allMatch) return null

      // 점수: 이름 매칭에 가중치
      let score = 0
      const nameLower = drug.name.toLowerCase()
      for (const kw of keywords) {
        if (nameLower.includes(kw)) score += 3
        if (drug.manufacturer.toLowerCase().includes(kw)) score += 2
        if (drug.ingredients.toLowerCase().includes(kw)) score += 1
      }

      return { drug, score }
    })
    .filter((item): item is { drug: KoreanDrug; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)

  return scored.map((s) => s.drug).slice(0, 10)
}

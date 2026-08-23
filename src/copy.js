const FLOW_LABELS = {
  booking: '일정 탐색과 예약',
  quote: '범위 선택과 견적 요청',
  mixer: '취향 조합과 맞춤 선택',
  status: '상태 확인과 이용 판단',
  compare: '조건 비교와 선택',
  map: '위치 탐색과 경로 선택',
  filter: '조건 탐색과 항목 선택',
  schedule: '일정 탐색과 시간 선택',
  build: '구성 조립과 결과 미리보기',
  command: '기능 실행과 결과 확인',
  timeline: '과정 이해와 단계 확인',
  donation: '후원 선택과 변화 확인',
  rsvp: '행사 확인과 참석 응답',
  archive: '자료 검색과 기록 열람',
  audio: '콘텐츠 탐색과 재생',
  drag: '직접 배치와 구성 변경',
  carousel: '사례 탐색과 장면 확인',
  switcher: '관점 전환과 정보 비교',
  calculate: '조건 입력과 결과 계산',
  reveal: '핵심 정보 탐색과 상세 확인',
  configure: '옵션 구성과 맞춤 선택',
  menu: '메뉴 탐색과 선택',
  form: '상황 접수와 상담'
};

function hasFinalConsonant(value) {
  const text = String(value).trim();
  for (let index = text.length - 1; index >= 0; index -= 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
    if (/[0-9]/.test(text[index])) return ['0', '1', '3', '6', '7', '8'].includes(text[index]);
    if (/[A-Za-z]/.test(text[index])) return false;
  }
  return false;
}

export function withParticle(value, consonantForm, vowelForm) {
  return `${value}${hasFinalConsonant(value) ? consonantForm : vowelForm}`;
}

export function polishedTagline(site) {
  const [first = site.kind, second = '서비스 흐름'] = site.materials || [];
  const flow = FLOW_LABELS[site.interaction] || '정보 탐색과 다음 행동';
  return `${withParticle(first, '과', '와')} ${withParticle(second, '을', '를')} 핵심 인터페이스로 삼아, ${site.kind}의 ${flow} 흐름을 한 화면에서 경험합니다.`;
}

function menuServices(site) {
  if (/레스토랑|카페|찻집|디저트|베이커리|셰프/.test(site.kind)) {
    return ['대표 메뉴 둘러보기', '오늘의 추천 선택', '예약·단체 문의'];
  }
  return ['대표 상품 탐색', '구성·옵션 선택', '주문·상담 문의'];
}

export function polishedServices(site) {
  const patterns = {
    menu: menuServices(site),
    booking: [`${site.kind} 프로그램 보기`, '날짜·시간 선택', '예약 전 안내'],
    mixer: ['취향·조건 조합', '추천 구성 확인', '맞춤 상담'],
    status: ['실시간 현황 확인', '이용 가능 시간', '변경 알림 안내'],
    quote: ['현황·범위 확인', '항목별 견적 구성', '진행 상담'],
    reveal: ['핵심 정보 탐색', '세부 레이어 확인', '상담·문의'],
    compare: ['조건별 비교', '추천 선택 확인', '상담·예약'],
    timeline: ['전체 과정 보기', '단계별 준비사항', '진행 상담'],
    form: ['상황 접수', '검토 범위 확인', '상담 일정'],
    calculate: ['조건 입력', '결과 계산', '결과 기반 상담'],
    carousel: ['대표 사례 탐색', '세부 장면 보기', '프로젝트 문의'],
    map: ['위치·구역 탐색', '조건별 장소 확인', '방문·이용 문의'],
    filter: ['조건 필터', '추천 목록 확인', '선택 상담'],
    switcher: ['관점·언어 전환', '정보 비교', '도입 문의'],
    command: ['명령·기능 실행', '결과·상태 확인', '도입 상담'],
    build: ['구성 요소 선택', '결과 미리보기', '맞춤 제작 문의'],
    drag: ['요소 직접 배치', '구성 비교', '프로젝트 상담'],
    audio: ['콘텐츠 재생', '목록·구간 탐색', '수업·제작 문의'],
    archive: ['자료 검색', '주제별 컬렉션', '열람·협업 문의'],
    schedule: ['일정 탐색', '시간·프로그램 선택', '예약·참여 문의'],
    configure: ['옵션 선택', '구성 결과 확인', '맞춤 주문 문의'],
    donation: ['후원 금액 선택', '사용처·영향 확인', '정기 후원 안내'],
    rsvp: ['행사 정보 확인', '참석 여부 입력', '일정·장소 안내']
  };
  return patterns[site.interaction] || [`${site.kind} 핵심 안내`, '서비스 범위 확인', '상담·예약'];
}

export function polishedSite(site) {
  return {
    ...site,
    tagline: polishedTagline(site),
    services: polishedServices(site)
  };
}

export function applyPolishedCopy(sites) {
  for (const site of sites) {
    const polished = polishedSite(site);
    site.tagline = polished.tagline;
    site.services = polished.services;
  }
  return sites;
}

import { polishedSite, withParticle } from './copy.js';

const pad = (value) => String(value).padStart(2, '0');
const choice = (items, seed) => items[Math.abs(seed) % items.length];

const FLOW = {
  booking: ['조건을 확인하고', '가능한 시간을 비교하고', '예약 전 내용을 확정합니다'],
  quote: ['현재 상황을 진단하고', '필요 범위를 조합하고', '실행 가능한 견적으로 정리합니다'],
  mixer: ['취향과 조건을 입력하고', '어울리는 조합을 살펴보고', '맞춤 선택을 완성합니다'],
  status: ['현재 상태를 확인하고', '가능한 선택지를 비교하고', '다음 행동을 결정합니다'],
  compare: ['기준을 먼저 세우고', '차이를 나란히 비교하고', '우선순위를 확정합니다'],
  map: ['장소와 구역을 탐색하고', '이동 조건을 확인하고', '방문 계획을 완성합니다'],
  filter: ['필요 조건을 고르고', '추천 항목을 좁히고', '최종 선택을 저장합니다'],
  schedule: ['전체 일정을 살펴보고', '시간대를 선택하고', '참여 계획을 확정합니다'],
  build: ['구성 요소를 고르고', '결과를 미리 보고', '제작 범위를 정리합니다'],
  command: ['명령을 실행하고', '결과와 상태를 확인하고', '도입 범위를 결정합니다'],
  timeline: ['전체 과정을 이해하고', '단계별 준비를 확인하고', '진행 일정을 맞춥니다'],
  donation: ['후원 분야를 선택하고', '예상 변화를 확인하고', '참여 방식을 확정합니다'],
  rsvp: ['행사 내용을 확인하고', '참석 정보를 입력하고', '일정과 장소를 저장합니다'],
  archive: ['자료를 검색하고', '맥락을 따라 읽고', '필요한 기록을 보관합니다'],
  audio: ['콘텐츠를 탐색하고', '구간별로 재생하고', '다음 목록을 이어 봅니다'],
  drag: ['요소를 직접 배치하고', '구성을 비교하고', '완성된 안을 저장합니다'],
  carousel: ['대표 장면을 살펴보고', '세부 맥락을 확인하고', '마음에 드는 사례를 고릅니다'],
  switcher: ['관점을 전환하고', '정보 차이를 비교하고', '필요한 보기 방식을 선택합니다'],
  calculate: ['조건을 입력하고', '예상 결과를 계산하고', '결과에 맞는 선택을 이어 갑니다'],
  reveal: ['핵심 정보를 먼저 보고', '세부 레이어를 펼치고', '필요한 내용을 확인합니다'],
  configure: ['옵션을 선택하고', '구성 결과를 확인하고', '맞춤 주문을 완성합니다'],
  menu: ['메뉴를 둘러보고', '구성과 수량을 선택하고', '예약이나 주문으로 이어 갑니다'],
  form: ['상황을 접수하고', '검토 범위를 확인하고', '상담 일정을 정합니다']
};

const ROLE_SETS = [
  ['기획 디렉터', '운영 매니저', '고객 경험 가이드'],
  ['프로젝트 리드', '품질 책임자', '실행 코디네이터'],
  ['제품 설계자', '데이터 분석가', '도입 엔지니어'],
  ['교육 설계자', '콘텐츠 에디터', '학습 코치'],
  ['케어 디렉터', '프로그램 코치', '경험 매니저'],
  ['크리에이티브 디렉터', '프로듀서', '아카이브 에디터'],
  ['여정 설계자', '현장 호스트', '예약 코디네이터'],
  ['브랜드 디렉터', '상품 큐레이터', '고객 경험 매니저'],
  ['프로그램 책임자', '커뮤니티 코디네이터', '임팩트 기록자'],
  ['개인 브랜드 디렉터', '콘텐츠 제작자', '프로젝트 매니저']
];

function directionIndex(site) {
  return Math.min(9, Math.floor((site.id - 1) / 10));
}

function serviceDetail(site, title, index) {
  const material = site.materials[index % site.materials.length];
  const secondMaterial = site.materials[(index + 1) % site.materials.length];
  const flow = FLOW[site.interaction] || FLOW.form;
  const outcomeWords = [
    ['선택 기준이 명확해집니다', '다음 행동까지 걸리는 시간이 줄어듭니다', '진행 상황을 쉽게 공유할 수 있습니다'],
    ['정보의 우선순위가 정리됩니다', '불필요한 반복 확인이 줄어듭니다', '결과물의 기준이 문서로 남습니다'],
    ['고객이 망설이는 지점을 줄입니다', '운영자가 설명해야 할 내용을 구조화합니다', '전환 이후의 경험까지 연결합니다']
  ][index];

  return {
    id: index + 1,
    slug: `service-${pad(index + 1)}`,
    title,
    eyebrow: `SERVICE ${pad(index + 1)}`,
    summary: `${withParticle(material, '을', '를')} 출발점으로 삼아 ${site.kind}의 ${title} 과정을 실제 행동 순서로 정리합니다.`,
    promise: `${flow[0]}, ${flow[1]}, 마지막에는 ${flow[2]}.`,
    outcomes: outcomeWords,
    deliverables: [
      `${material} 기준 진단표`,
      `${secondMaterial} 선택 구조`,
      `${title} 실행 체크리스트`,
      '결과 공유용 한 장 요약'
    ],
    process: [
      { title: '맥락 확인', body: `${site.kind}의 현재 상황과 ${material} 관련 제약을 먼저 확인합니다.` },
      { title: '선택 구조 설계', body: `${secondMaterial}까지 고려해 사용자가 비교해야 할 기준을 줄입니다.` },
      { title: '실행·검증', body: `${title} 흐름을 작은 단위로 적용하고 이해하기 어려운 지점을 점검합니다.` },
      { title: '정리·인계', body: '운영자가 반복해서 사용할 수 있도록 결정 기준과 다음 행동을 문서화합니다.' }
    ],
    faq: [
      { q: '처음 준비해야 할 자료는 무엇인가요?', a: `${material}, ${secondMaterial}와 관련된 현재 자료가 있으면 좋습니다. 자료가 없어도 첫 진단 단계에서 함께 정리할 수 있습니다.` },
      { q: '기존 방식과 함께 사용할 수 있나요?', a: '전면 교체보다 현재 흐름에서 가장 막히는 한 단계를 먼저 개선하는 방식으로 시작할 수 있습니다.' },
      { q: '결과는 어떤 형태로 받나요?', a: '화면 또는 운영 흐름, 체크리스트, 결정 기록과 다음 단계 제안으로 정리합니다.' }
    ]
  };
}

function caseStudy(site, index) {
  const material = site.materials[index % site.materials.length];
  const next = site.materials[(index + 1) % site.materials.length];
  const service = site.services[index % site.services.length];
  const titles = [
    `${material}에서 시작한 첫 화면 재설계`,
    `${next} 선택 단계를 절반으로 줄인 운영 실험`,
    `${service} 전후 과정을 하나의 흐름으로 연결한 사례`
  ];
  const metricSeed = site.id * 3 + index * 11;

  return {
    id: index + 1,
    slug: `case-${pad(index + 1)}`,
    title: titles[index],
    category: ['경험 설계', '운영 개선', '콘텐츠 구조'][index],
    summary: `${site.kind} 이용자가 ${withParticle(material, '을', '를')} 이해한 뒤 ${withParticle(next, '으로', '로')} 자연스럽게 이동하도록 정보와 행동 순서를 다시 설계했습니다.`,
    challenge: `기존 화면에서는 ${material}, ${next}, ${service} 정보가 같은 무게로 나열되어 사용자가 무엇부터 확인해야 하는지 알기 어려웠습니다.`,
    approach: [
      `${material} 관련 질문을 첫 단계로 이동`,
      `${next} 선택지를 실제 비교 기준에 따라 재분류`,
      `${service} 완료 이후 필요한 안내까지 같은 여정에 포함`
    ],
    result: `정보를 줄인 것이 아니라 순서를 다시 세워, 사용자가 필요한 설명을 스스로 찾고 다음 행동을 선택할 수 있게 만들었습니다.`,
    metrics: [
      { value: `${18 + metricSeed % 29}%`, label: '탐색 단계 감소' },
      { value: `${31 + metricSeed % 41}%`, label: '핵심 행동 증가' },
      { value: `${2 + metricSeed % 4}.${metricSeed % 10}×`, label: '정보 이해 속도' }
    ],
    timeline: ['현황 인터뷰', '정보 구조', '프로토타입', '운영 검증']
  };
}

function article(site, index) {
  const material = site.materials[index % site.materials.length];
  const next = site.materials[(index + 2) % site.materials.length];
  const service = site.services[index % site.services.length];
  const titles = [
    `${withParticle(material, '을', '를')} 중심으로 ${site.kind} 정보를 설계하는 법`,
    `${service} 선택을 망설이지 않게 만드는 세 가지 기준`
  ];
  const month = ((site.id + index * 3) % 12) + 1;
  const day = ((site.id * 2 + index * 7) % 24) + 1;

  return {
    id: index + 1,
    slug: `insight-${pad(index + 1)}`,
    title: titles[index],
    category: index === 0 ? 'Design Note' : 'Operating Guide',
    excerpt: `${site.kind} 홈페이지에서 ${material}, ${next}, ${service} 정보를 어떤 순서로 보여줘야 사용자가 스스로 판단할 수 있는지 정리했습니다.`,
    minutes: 6 + (site.id + index) % 5,
    date: `2026-${pad(month)}-${pad(day)}`,
    sections: [
      {
        title: '먼저 행동을 관찰합니다',
        body: `${site.kind} 이용자는 설명을 읽기 위해 방문하기보다 자신의 상황에 맞는 다음 행동을 찾기 위해 방문합니다. ${material} 관련 질문이 언제 생기는지부터 확인해야 합니다.`
      },
      {
        title: '한 화면에는 한 가지 판단만 남깁니다',
        body: `${next}와 ${service} 정보를 동시에 강조하면 모든 정보가 중요해 보이지만 실제로는 아무것도 선택하기 어려워집니다. 단계마다 한 가지 판단 기준을 남기는 편이 좋습니다.`
      },
      {
        title: '선택 뒤의 불안을 미리 해소합니다',
        body: `버튼을 누른 다음 무엇이 일어나는지, 준비할 자료는 무엇인지, 취소하거나 변경할 수 있는지를 먼저 알려주면 행동을 미루는 이유가 줄어듭니다.`
      },
      {
        title: '운영자가 계속 쓸 수 있어야 합니다',
        body: '멋진 첫 화면보다 중요한 것은 새로운 일정, 사례, 공지와 질문을 운영자가 같은 구조 안에서 계속 추가할 수 있는지입니다.'
      }
    ]
  };
}

export function buildDeepModel(rawSite) {
  const site = polishedSite(rawSite);
  const services = site.services.map((title, index) => serviceDetail(site, title, index));
  const cases = Array.from({ length: 3 }, (_, index) => caseStudy(site, index));
  const articles = Array.from({ length: 2 }, (_, index) => article(site, index));
  const roles = ROLE_SETS[directionIndex(site)].map((title, index) => ({
    title,
    name: `${choice(['민', '윤', '서', '하', '도', '지'], site.id + index)}${choice(['준', '연', '우', '진', '현', '원'], site.id * 2 + index)}`,
    body: `${services[index].title} 과정에서 ${site.materials[index]} 기준을 책임집니다.`
  }));

  return {
    site,
    services,
    cases,
    articles,
    principles: [
      { title: '먼저 이해할 수 있게', body: `${site.materials[0]} 정보부터 보여주고 전문 용어는 실제 행동과 함께 설명합니다.` },
      { title: '선택은 적게, 근거는 충분하게', body: `${site.materials[1]} 기준으로 선택지를 나누고 각 차이를 한눈에 비교할 수 있게 합니다.` },
      { title: '결정 뒤의 과정까지 투명하게', body: `${site.materials[2]}에서 ${site.materials[3]}까지 이어지는 다음 단계를 미리 공개합니다.` }
    ],
    timeline: [
      { year: '01', title: '문제 발견', body: `${site.kind} 이용자가 반복해서 묻는 질문을 수집합니다.` },
      { year: '02', title: '구조 실험', body: `${site.materials[0]}와 ${site.materials[1]}의 우선순위를 바꿔 봅니다.` },
      { year: '03', title: '운영 적용', body: '실제 일정·문의·콘텐츠 흐름에 적용해 이해하기 어려운 지점을 확인합니다.' },
      { year: '04', title: '기록과 확장', body: '결과를 사례와 가이드로 남겨 다음 운영에 다시 사용합니다.' }
    ],
    roles,
    contactTopics: [...services.map((service) => service.title), '협업·제휴', '기타 문의']
  };
}

export function deepRoutes(rawSite) {
  const model = buildDeepModel(rawSite);
  const base = `/Site100/sites/${model.site.slug}`;
  return [
    { type: 'home', path: `${base}/`, depth: 1, title: model.site.name },
    { type: 'about', path: `${base}/about/`, depth: 2, title: `${model.site.name} 소개` },
    { type: 'services', path: `${base}/services/`, depth: 2, title: `${model.site.name} 서비스` },
    ...model.services.map((service) => ({ type: 'service', path: `${base}/services/${service.slug}/`, depth: 3, title: service.title, item: service })),
    { type: 'work', path: `${base}/work/`, depth: 2, title: `${model.site.name} 사례` },
    ...model.cases.map((caseItem) => ({ type: 'case', path: `${base}/work/${caseItem.slug}/`, depth: 3, title: caseItem.title, item: caseItem })),
    { type: 'journal', path: `${base}/journal/`, depth: 2, title: `${model.site.name} 저널` },
    ...model.articles.map((articleItem) => ({ type: 'article', path: `${base}/journal/${articleItem.slug}/`, depth: 3, title: articleItem.title, item: articleItem })),
    { type: 'contact', path: `${base}/contact/`, depth: 2, title: `${model.site.name} 문의` }
  ];
}

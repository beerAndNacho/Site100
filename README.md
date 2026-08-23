# Site100 · 100WORLDS v4

서로 다른 업종과 목적, 디자인 언어를 가진 홈페이지 100개를 실제 스마트폰·태블릿·노트북·와이드 화면에서 안정적으로 체험하고 비교·맞춤 설정할 수 있는 정적 웹 템플릿 갤러리입니다.

- 공개 갤러리: `https://beerandnacho.github.io/Site100/`
- 개별 사이트: `https://beerandnacho.github.io/Site100/sites/<slug>/`
- 전체 목록: [`docs/SITES-100.md`](docs/SITES-100.md)
- v2 기능 고도화: [`docs/V2-UPGRADE.md`](docs/V2-UPGRADE.md)
- v3 아트 디렉션: [`docs/V3-ART-DIRECTION.md`](docs/V3-ART-DIRECTION.md)
- v4 반응형 웹 앱: [`docs/V4-RESPONSIVE-APP.md`](docs/V4-RESPONSIVE-APP.md)

## v4 반응형 웹 앱

### 실제 기기와 내장 미리보기의 규칙 통합

- 실제 화면 크기는 viewport media query로 처리합니다.
- 갤러리의 데스크톱·태블릿·모바일 미리보기는 `.world` container query로 처리합니다.
- 따라서 데스크톱 브라우저 안에서 390px 미리보기를 선택해도 실제 스마트폰과 같은 카드·Hero·폼 배치가 적용됩니다.

### 모바일 브라우저 대응

- iPhone·Android 안전영역
- `visualViewport` 기반 주소창·가상 키보드 높이 처리
- 키보드가 열릴 때 하단 도구 패널 자동 숨김
- 입력 필드 화면 중앙 이동
- 모바일 메뉴 스크롤 잠금·포커스 트랩·Escape 종료
- 하단 내비게이션과 템플릿 도구 패널 간격 조정
- 44px 모바일 터치 영역

### 100개 전체 배치 감사

Chromium에서 다음 화면을 자동 검사합니다.

```text
360×800      100개 전수
390×844      대표 업종 11개
844×390      대표 업종 11개
768×1024     대표 업종 11개
1024×768     대표 업종 11개
1366×900     100개 전수
1536×960     대표 업종 11개
```

검사 항목은 문서 가로 스크롤, 섹션 화면 이탈, 텍스트 잘림, 터치 영역, 고정 UI 충돌, 이미지 범위, 모바일 메뉴, 커스터마이저와 D/T/M 미리보기입니다.

## v3 시각 고도화

100개 사이트를 단순한 색상·카피 변형으로 보이지 않게 하기 위해 업종군별 시각 문법을 분리했습니다.

| 홈페이지 10개 묶음 | 아트 디렉션 | 주요 표현 |
|---|---|---|
| 지역 매장 | Atelier | 종이, 스탬프, 비정형 카드, 수공예 질감 |
| 전문 서비스 | Precision | 설계도, 치수선, 정밀 그리드, 얇은 정보선 |
| SaaS·기술 | Interface | 유리 패널, 데이터 노드, 발광 경로, 스캔 그리드 |
| 교육·지식 | Notebook | 공책 선, 메모 카드, 형광 표시, 편집 주석 |
| 웰니스·케어 | Organic | 유기적 곡선, 부드러운 블러, 호흡하는 여백 |
| 문화·창작 | Studio | 필름 프레임, 콜라주, 크롭 마크, 비대칭 구성 |
| 여행·숙박 | Atlas | 등고선, 경로, 좌표, 지도 표식 |
| 음식·라이프스타일 | Catalog | 제품 진열대, 스와치, 라벨, 촉감 있는 표면 |
| 공공·커뮤니티 | Civic | 굵은 정보 블록, 공공 포스터, 높은 대비 |
| 개인·실험 | Experimental | 중첩 윈도, 혼합 모드, 왜곡된 그리드, 급진적 타이포 |

빌드 과정에서 홈페이지마다 독립적인 `1200×900` SVG Hero 아트워크를 생성합니다. SVG에는 브랜드명, 업종, 고유 팔레트와 실제 업종 소재가 포함되며, 해시 중복 검사를 통해 같은 결과물이 생성되지 않도록 합니다.

## v2 사용자 기능

### 갤러리

- 업종·레이아웃·분위기·인터랙션 다중 필터
- URL에 유지되는 검색·필터·정렬 상태
- 목적 기반 디자인 추천
- 즐겨찾기와 최근 본 세계
- 최대 3개 디자인 비교
- 무작위 세계 이동과 키보드 단축키
- 각 사이트의 고유 디자인 SVG 미리보기

### 개별 홈페이지

- 모바일 메뉴와 스크롤 진행 표시
- 데스크톱·태블릿·모바일 폭 미리보기
- 모션 감소 모드
- 즐겨찾기·공유
- 브랜드명·강조색·정보 밀도·고대비 맞춤 설정
- 맞춤 설정 JSON과 홈페이지 기획서 내보내기
- 문의 초안 복사·TXT 저장
- 관련 디자인, 이전·다음 세계 탐색
- 섹션 위치에 반응하는 활성 내비게이션

## 다양성 기준

각 사이트는 25가지 레이아웃, 10가지 내비게이션, 20가지 Hero, 10가지 타이포 방향, 10가지 형태, 10가지 시각 매체, 5가지 밀도, 10가지 분위기, 23가지 인터랙션, 10가지 아트 디렉션과 100가지 고유 팔레트를 조합한 독립 디자인 지문을 가집니다.

공유하는 것은 접근성, 반응형, 검색, 분석 훅과 인터랙션 런타임입니다. 업종 소재, Hero 구조, 화면 흐름, 디자인 지문, 고유 미리보기, Hero 아트워크와 독립 URL은 사이트마다 다릅니다.

## 구조

```text
src/catalog.js                    홈페이지 100개 업종·콘텐츠·디자인 지문
src/app.js                        25개 구조와 23개 인터랙션 렌더링
src/styles.css                    기본 디자인 시스템
src/enhance.js                    갤러리·비교·맞춤 설정·접근성 기능
src/v2.css                        v2 탐색·커스터마이저 UI
src/art-direction.js              v3 Hero·섹션·갤러리 아트 디렉션
src/v3.css                        10개 업종군 시각 언어
src/responsive.js                 viewport·키보드·메뉴·오버플로 런타임
src/v4-responsive.css             viewport·container query 반응형 레이어
scripts/build.mjs                 100개 경로·SEO·기본 미리보기
scripts/postbuild.mjs             한국어 카피·호환성 레이어
scripts/art-build.mjs             SVG 아트워크 100개와 v3 자산
scripts/responsive-build.mjs      v4 자산·메타데이터 주입
scripts/audit.mjs                 경로·SEO·카피 정적 감사
scripts/v3-audit.mjs              아트워크·아트 디렉션 감사
scripts/responsive-audit.mjs      100개 정적 반응형 감사
scripts/responsive-browser-audit.mjs Chromium 7개 화면 프로필 감사
```

## 검증과 빌드

```bash
npm install
npx playwright install chromium
npm run test:responsive
```

브라우저를 실행하지 않는 정적 검사만 수행할 때는 `npm test`를 사용합니다.

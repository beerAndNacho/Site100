# Site100 · 100WORLDS v5

서로 다른 업종과 디자인 언어를 가진 홈페이지 100개를 **사이트당 14개 페이지, 총 1,400개 페이지**로 확장한 반응형 정적 웹앱 갤러리입니다.

- 공개 갤러리: `https://beerandnacho.github.io/Site100/`
- 개별 사이트: `https://beerandnacho.github.io/Site100/sites/<slug>/`
- 전체 100개 목록: [`docs/SITES-100.md`](docs/SITES-100.md)
- v2 탐색·비교·맞춤 설정: [`docs/V2-UPGRADE.md`](docs/V2-UPGRADE.md)
- v3 아트 디렉션: [`docs/V3-ART-DIRECTION.md`](docs/V3-ART-DIRECTION.md)
- v4 반응형 웹 앱: [`docs/V4-RESPONSIVE-APP.md`](docs/V4-RESPONSIVE-APP.md)
- v5 깊은 정보구조: [`docs/V5-DEEP-ARCHITECTURE.md`](docs/V5-DEEP-ARCHITECTURE.md)

## v5 · 사이트당 14개 페이지

```text
/sites/<slug>/
/sites/<slug>/about/
/sites/<slug>/services/
/sites/<slug>/services/service-01/
/sites/<slug>/services/service-02/
/sites/<slug>/services/service-03/
/sites/<slug>/work/
/sites/<slug>/work/case-01/
/sites/<slug>/work/case-02/
/sites/<slug>/work/case-03/
/sites/<slug>/journal/
/sites/<slug>/journal/insight-01/
/sites/<slug>/journal/insight-02/
/sites/<slug>/contact/
```

총 구성은 다음과 같습니다.

| 페이지 유형 | 개수 |
|---|---:|
| 홈페이지 | 100 |
| 소개 | 100 |
| 서비스 목록 | 100 |
| 서비스 상세 | 300 |
| 사례 목록 | 100 |
| 사례 상세 | 300 |
| 저널 목록 | 100 |
| 장문 글 | 200 |
| 문의 | 100 |
| **합계** | **1,400** |

## 연결되는 사용자 흐름

- 데스크톱 Mega Navigation과 모바일 2단계 메뉴
- 모든 하위 페이지 Breadcrumb
- 홈의 서비스·작업·저널 카드에서 상세 경로로 이동
- 서비스 상세의 `프로젝트에 담기`
- 페이지를 이동해도 유지되는 프로젝트 플랜
- 사례 카테고리 필터와 결과 지표
- 장문 글 목차·읽기 진행률·북마크
- 목적·상황·일정·예산·연락처를 나누는 3단계 문의서
- 브라우저 문의 초안 임시 저장
- 문의 초안 복사와 TXT 다운로드

## v4 · 반응형 웹 앱

실제 기기는 viewport media query, 갤러리 D/T/M 미리보기는 `.world` container query로 처리합니다.

- 280px 최소 화면
- iPhone·Android 안전영역
- `visualViewport` 기반 주소창·키보드 대응
- 44px 모바일 터치 영역
- 모바일 메뉴 포커스 트랩
- 25개 레이아웃별 축소 규칙
- 드래그·지도·명령·캐러셀·폼 모바일 재배치
- 360·390·768·844×390·1024·1366·1536 화면 검사

## v3 · 10개 아트 디렉션

| 홈페이지 10개 묶음 | 아트 디렉션 |
|---|---|
| 지역 매장 | Atelier |
| 전문 서비스 | Precision |
| SaaS·기술 | Interface |
| 교육·지식 | Notebook |
| 웰니스·케어 | Organic |
| 문화·창작 | Studio |
| 여행·숙박 | Atlas |
| 음식·라이프스타일 | Catalog |
| 공공·커뮤니티 | Civic |
| 개인·실험 | Experimental |

빌드 과정에서 브랜드명, 업종, 팔레트와 실제 업종 소재를 반영한 SVG Hero 아트워크 100개를 생성합니다.

## v2 · 갤러리와 템플릿 도구

- 업종·레이아웃·분위기·인터랙션 다중 필터
- 목적 기반 추천
- 즐겨찾기와 최근 본 세계
- 최대 3개 비교
- 데스크톱·태블릿·모바일 미리보기
- 브랜드명·강조색·밀도·고대비 맞춤 설정
- 디자인 기획서와 설정 JSON 내보내기

## 소스 구조

```text
src/catalog.js                    100개 업종·디자인 지문
src/app.js                        홈 100개 렌더링
src/enhance.js                    갤러리·비교·맞춤 설정
src/art-direction.js              v3 아트 디렉션
src/responsive.js                 v4 반응형 런타임
src/depth-content.js              v5 업종별 상세 콘텐츠 모델
src/depth.js                      v5 내비게이션·플래너·저널·문의
src/v5-depth.css                  v5 하위 페이지 디자인
scripts/depth-build.mjs           1,400개 페이지·사이트맵 생성
scripts/depth-audit.mjs           링크·SEO·콘텐츠 깊이 감사
scripts/depth-browser-audit.mjs   520개 깊은 경로 브라우저 검사
```

## 검증

```bash
npm install
npx playwright install chromium
npm run test:deep
```

검증 범위:

```text
정적 사이트 페이지        1,400개
검색 색인 URL             1,401개
기존 반응형 브라우저 검사   262개
깊은 경로 브라우저 검사     520개
총 브라우저 조합            782개
```

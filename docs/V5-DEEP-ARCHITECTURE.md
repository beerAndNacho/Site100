# Site100 v5 · Deep Information Architecture

## 목표

v4까지 각 세계는 완성도 높은 단일 홈페이지였습니다. v5는 첫 화면 아래에 실제 사이트 운영에 필요한 페이지와 사용자 여정을 추가합니다.

```text
100개 사이트 × 14페이지 = 1,400페이지
글로벌 갤러리 포함 검색 색인 URL = 1,401개
최대 URL 깊이 = 3단계
```

## 사이트당 14개 페이지

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

## 콘텐츠 깊이

### About

- 시작 배경
- 운영 원칙
- 변화 과정
- 팀 역할
- 다음 페이지 연결

### Services

- 세 서비스 비교
- 서비스별 기대 결과
- 산출물
- 네 단계 진행 과정
- FAQ
- 관련 서비스

### Work

- 사례 카테고리 필터
- 문제와 맥락
- 접근 방식
- 결과 지표
- 진행 타임라인
- 관련 사례

### Journal

- 카테고리별 글 목록
- 장문 글
- 고정 목차
- 읽기 진행률
- 북마크
- 관련 글·서비스

### Contact

- 관심 서비스 선택
- 프로젝트 플랜 유지
- 목적·상황·일정·예산·연락처의 3단계 입력
- 브라우저 임시 저장
- 문의 초안 복사와 TXT 저장

## 연결되는 웹앱 흐름

서비스 상세 페이지의 `프로젝트에 담기` 버튼은 선택 내용을 `localStorage`에 저장합니다. 사용자가 다른 서비스·사례·저널 페이지를 둘러봐도 선택이 유지되고, 하단 프로젝트 플랜에서 문의 페이지로 이동할 수 있습니다.

문의 페이지는 선택한 서비스와 입력한 요구사항을 결합해 서버 전송 없이 문의 초안을 만듭니다.

## 내비게이션

- 데스크톱: 서비스·사례·저널 상세가 보이는 Mega Navigation
- 모바일: 기존 v4 메뉴 안에서 펼쳐지는 2단계 메뉴
- 모든 하위 페이지: Breadcrumb
- 긴 페이지: 현재 섹션을 표시하는 Local Rail
- 홈: 소개·서비스·사례·저널·문의로 연결되는 Depth Hub

## 빌드 산출물

```text
dist/depth-manifest.json
dist/depth-audit-report.json
dist/sites/<slug>/site-map.json
dist/sites/<slug>/.../index.html
dist/assets/depth-content.js
dist/assets/depth.js
dist/assets/v5-depth.css
```

## 자동 검증

### 정적 감사

- 사이트 페이지 1,400개
- 사이트당 페이지 14개
- URL 최대 깊이 3
- 제목·canonical·description 1,400개 고유성
- 내부 링크 오류 0개
- 구조화 데이터·Breadcrumb·v5 자산
- 서비스·사례·글·문의 페이지별 필수 구성
- sitemap URL 1,401개

### Chromium 감사

기존 반응형 262개 화면 검사에 더해 다음 520개 깊은 페이지 조합을 검사합니다.

```text
360×800   서비스·문의 200개
1366×900  서비스·문의 200개
390×844   대표 업종의 소개·서비스 상세·사례 상세·글 40개
768×1024  대표 업종의 소개·서비스 상세·사례 상세·글 40개
1536×960  대표 업종의 소개·서비스 상세·사례 상세·글 40개
```

검사 항목은 가로 스크롤, 화면 이탈, 텍스트 잘림, 터치 크기, Breadcrumb, 깊은 내비게이션, 서비스 선택, 글 북마크와 문의 단계 전환입니다.

## 실행

```bash
npm install
npx playwright install chromium
npm run test:deep
```

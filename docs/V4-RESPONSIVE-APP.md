# Site100 v4 · Responsive Web-App System

## 목표

Site100의 100개 홈페이지가 단순히 모바일에서 축소되는 수준을 넘어, 실제 스마트폰·태블릿·노트북·와이드 화면과 갤러리의 D/T/M 미리보기 안에서 모두 안정적으로 배치되도록 합니다.

## 핵심 구조

### Viewport + Container Query

- 실제 기기 크기는 `@media`가 처리합니다.
- 갤러리에서 데스크톱 화면 안에 390px 미리보기를 띄우는 경우에는 `.world` 컨테이너 쿼리가 같은 모바일 규칙을 적용합니다.
- 따라서 실제 모바일과 내장 모바일 미리보기가 서로 다른 결과를 내지 않습니다.

### Visual Viewport

모바일 브라우저의 주소창과 가상 키보드는 `window.innerHeight`만으로 정확히 처리하기 어렵습니다. `src/responsive.js`는 `visualViewport`를 사용해 다음 CSS 변수를 갱신합니다.

```text
--v4-viewport-width
--v4-viewport-height
--v4-vw
--v4-vh
--v4-header-height
```

가상 키보드가 열린 것으로 판단되면 하단 고정 도구 패널과 하단 내비게이션을 잠시 숨기고, 포커스된 입력 필드를 화면 중앙으로 이동합니다.

## 지원 화면

| 프로필 | 크기 | 검사 범위 |
|---|---:|---|
| Compact | 360×800 | 100개 전수 |
| Mobile | 390×844 | 대표 업종 11개 |
| Phone landscape | 844×390 | 대표 업종 11개 |
| Tablet | 768×1024 | 대표 업종 11개 |
| Tablet landscape | 1024×768 | 대표 업종 11개 |
| Laptop | 1366×900 | 100개 전수 |
| Wide | 1536×960 | 대표 업종 11개 |

## 배치 보강 범위

### 공통 UI

- iPhone·Android 안전영역
- 280px 최소 화면
- 긴 한글·영문 브랜드명 줄바꿈
- SVG·이미지·영상·Canvas의 부모 폭 제한
- 폼 필드와 대화상자 폭 제한
- 44px 모바일 터치 영역
- 모바일 메뉴 포커스 트랩과 Escape 종료
- 고정 도구 패널·하단 내비게이션 충돌 방지
- 모션 감소와 인쇄 레이아웃

### 레이아웃 25종

Horizontal, Dashboard, Book, Newspaper, Masonry, Timeline, Split, Isometric, Poster, Collage를 포함한 25개 레이아웃에 모바일·태블릿 축소 규칙을 적용합니다.

### 인터랙션

- 드래그 캔버스는 모바일에서 카드 그리드로 전환
- Command·pre 영역은 내부 스크롤
- 지도와 비교 화면은 부모 폭 안에서 축소
- Carousel은 화면 밖 콘텐츠를 페이지 너비에 포함하지 않음
- Quote·Calculate·Build·Reveal은 좁은 컨테이너에서 단일 열
- 날짜·옵션·필터 버튼은 터치 가능한 크기 유지

## 자동 브라우저 감사

`scripts/responsive-browser-audit.mjs`는 Chromium을 실행하고 다음을 검사합니다.

- 문서 전체의 가로 스크롤
- 주요 섹션의 화면 이탈
- 제목·본문·버튼의 텍스트 잘림
- 모바일 터치 영역 크기
- 고정 UI 사이의 실제 겹침 면적
- 이미지·SVG가 부모보다 넓은지
- 모바일 메뉴 열기·닫기·스크롤 잠금
- 커스터마이저 대화상자의 화면 적합성
- 데스크톱 안의 390px 모바일 미리보기
- 콘솔 오류와 page error

실패하면 `dist/reports/responsive-failures/`에 전체 화면 스크린샷을 저장하고, JSON 보고서를 GitHub Actions 아티팩트로 업로드합니다.

## 실행

```bash
npm install
npx playwright install chromium
npm run test:responsive
```

정적 감사만 실행할 때는 다음 명령을 사용합니다.

```bash
npm test
```

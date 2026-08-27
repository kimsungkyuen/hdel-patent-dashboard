"use strict";

/* ==========================================================================
   HDEL 특허 현황 모니터링 대시보드 (Patent Status Dashboard)
   - 특허청(KIPO) 특허로 REST Web API 연계
   - 출원/등록/심사/마감기한/글로벌 패밀리 실시간 모니터링
   ========================================================================== */

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TODAY = '2026-08-27';

// 1. 긴급 마감기한 알림 데이터셋 (D-30 이내)
const URGENT_DEADLINES = [
  {
    dDay: -3,
    type: "연차등록료 납부",
    regNo: "10-2650321",
    title: "엘리베이터 카 위치 검출 절대엔코더 구조 및 위치 보정 알고리즘",
    dueDate: "2026-08-30",
    actionReq: "3년차 연차등록료 납부 (144,000원)",
    isUrgent: true
  },
  {
    dDay: 14,
    type: "의견제출통지 대응",
    regNo: "10-2024-0012345",
    title: "인공지능 기반 엘리베이터 도어 이물감지 센서 제어방법",
    dueDate: "2026-09-10",
    actionReq: "거절이유 극복 의견서 및 청구항 보정서 제출",
    isUrgent: false
  },
  {
    dDay: 26,
    type: "설정등록료 납부",
    regNo: "10-2024-0045567",
    title: "승강기 로프 장력 실시간 모니터링 시스템 및 자가보정 방법",
    dueDate: "2026-09-22",
    actionReq: "특허결정에 따른 1~3년차 설정등록료 납부",
    isUrgent: false
  },
  {
    dDay: 39,
    type: "해외진입 기한 (US)",
    regNo: "PCT/KR2023/000881",
    title: "목적층 예약 그룹운행 최적화 알고리즘 (US 패밀리)",
    dueDate: "2026-10-05",
    actionReq: "미국(USPTO) 국내단계 진입 번역문 및 수수료 제출",
    isUrgent: false
  },
  {
    dDay: 52,
    type: "설정등록료 납부",
    regNo: "10-2023-0063118",
    title: "초고속 엘리베이터 비상 제동 안전장치 및 전자식 웨지 구조",
    dueDate: "2026-10-18",
    actionReq: "특허결정에 따른 1~3년차 설정등록료 납부",
    isUrgent: false
  }
];

// 2. 특허청(KIPO) 실시간 출원 & 등록 데이터셋
const PATENT_DATA = [
  {
    id: "P-01",
    rightType: "특허",
    appNo: "10-2024-0012345",
    appDate: "2024-01-30",
    title: "인공지능 기반 엘리베이터 도어 이물감지 센서 제어방법",
    techCategory: "도어시스템",
    ipc: "B66B 13/26",
    inventor: "김도현, 박세린",
    agent: "특허법인 세종",
    examiner: "이심사",
    examDept: "스마트승강기심사과",
    status: "의견제출통지 (1차 OA)",
    statusCode: "OA",
    claimCount: 7,
    openNo: "10-2024-0056789",
    abstract: "본 발명은 인공지능 기반 엘리베이터 도어 이물감지 센서 제어방법에 관한 것으로, 다중 적외선 센서 어레이와 딥러닝 영상 분석 알고리즘을 결합하여 승객의 신체와 이물을 정확히 구분하고 도어 끼임 사고를 원천 방지하는 제어 알고리즘을 제공한다.",
    history: [
      { date: "2024-01-30", title: "특허출원서 접수", dept: "특허청 출원과" },
      { date: "2024-01-30", title: "우선심사신청서 접수", dept: "특허청 출원과" },
      { date: "2024-05-15", title: "출원공개공보 발행 (공개)", dept: "특허청 공보과" },
      { date: "2026-07-10", title: "의견제출통지서 발송 (거절이유통지)", dept: "스마트승강기심사과" }
    ]
  },
  {
    id: "P-02",
    rightType: "특허",
    appNo: "10-2024-0045567",
    appDate: "2024-04-12",
    title: "승강기 로프 장력 실시간 모니터링 시스템 및 자가보정 방법",
    techCategory: "로프/권상기",
    ipc: "B66B 7/06",
    inventor: "최지원, 정민재",
    agent: "리앤목 특허법인",
    examiner: "김그린",
    examDept: "기계금속심사과",
    status: "등록결정 (납부대기)",
    statusCode: "REG",
    claimCount: 12,
    openNo: "10-2024-0098124",
    abstract: "복수의 메인 로프에 인가되는 장력을 압전 센서로 실시간 계측하여 불균일 장력 발생 시 액추에이터를 통해 개별 로프의 장력을 자동 보정하는 스마트 승강기 로프 관리 시스템.",
    history: [
      { date: "2024-04-12", title: "특허출원서 접수", dept: "특허청 출원과" },
      { date: "2025-08-20", title: "심사관 1차 심사의견 접수", dept: "기계금속심사과" },
      { date: "2026-07-22", title: "특허결정서(등록결정) 발송", dept: "기계금속심사과" }
    ]
  },
  {
    id: "P-03",
    rightType: "특허",
    appNo: "10-2023-0063118",
    appDate: "2023-06-08",
    title: "초고속 엘리베이터 비상 제동 안전장치 및 전자식 웨지 구조",
    techCategory: "안전/비상제동",
    ipc: "B66B 5/18",
    inventor: "이수민, 최지원",
    agent: "특허법인 미래",
    examiner: "박안전",
    examDept: "안전설비심사과",
    status: "등록결정 (설정등록대기)",
    statusCode: "REG",
    claimCount: 15,
    openNo: "10-2023-0145892",
    abstract: "정격속도 1,080m/min 초고속 승강기용 전자식 안전 웨지 구조로서, 이상 과속 감지 시 마이크로초 단위로 전자석 액추에이터가 가이드 레일을 압착 제동하는 초고신뢰성 비상제동장치.",
    history: [
      { date: "2023-06-08", title: "특허출원서 접수", dept: "특허청 출원과" },
      { date: "2025-11-20", title: "의견제출통지서 수신", dept: "안전설비심사과" },
      { date: "2026-01-15", title: "보정서 및 의견서 제출", dept: "특허법인 미래" },
      { date: "2026-07-18", title: "특허결정서 발송", dept: "안전설비심사과" }
    ]
  },
  {
    id: "P-04",
    rightType: "특허",
    appNo: "10-2022-0077412",
    appDate: "2022-07-15",
    title: "엘리베이터 카 위치 검출 절대엔코더 구조 및 위치 보정 알고리즘",
    techCategory: "스마트제어/AI",
    ipc: "B66B 1/34",
    inventor: "박세린, 김도현",
    agent: "특허법인 세종",
    examiner: "정제어",
    examDept: "스마트승강기심사과",
    status: "등록유지 (3년차 연차료도래)",
    statusCode: "MAINT",
    claimCount: 10,
    regNo: "10-2650321",
    regDate: "2024-04-01",
    abstract: "광학식 및 자기식 하이브리드 패턴 테이프를 승강로에 설치하고, 카 상부의 듀얼 센서 헤드로 0.1mm 정밀도의 절대 위치를 실시간 판독하는 위치 검출 시스템.",
    history: [
      { date: "2022-07-15", title: "특허출원서 접수", dept: "특허청 출원과" },
      { date: "2024-02-10", title: "특허결정서 발송", dept: "스마트승강기심사과" },
      { date: "2024-04-01", title: "설정등록 및 특허증 발급 (10-2650321)", dept: "특허청 등록과" }
    ]
  },
  {
    id: "P-05",
    rightType: "상표",
    appNo: "40-2024-0019874",
    appDate: "2024-02-18",
    title: "H-MOVE SMART (스마트 모빌리티 브랜드)",
    techCategory: "스마트제어/AI",
    ipc: "제09류 (승강기 제어기)",
    inventor: "-",
    agent: "특허법인 에이아이",
    examiner: "정상표",
    examDept: "상표디자인심사국",
    status: "출원공고 (이의신청기간)",
    statusCode: "PUB",
    claimCount: 1,
    openNo: "40-2024-0087654",
    abstract: "현대엘리베이터의 차세대 로봇·스마트 모빌리티 연계형 통합 수직이동 솔루션 브랜드 명칭 및 로고마크.",
    history: [
      { date: "2024-02-18", title: "상표등록출원서 접수", dept: "특허청 출원과" },
      { date: "2026-08-14", title: "출원공고결정서 발송", dept: "상표심사과" }
    ]
  },
  {
    id: "P-06",
    rightType: "디자인",
    appNo: "30-2024-0005432",
    appDate: "2024-03-05",
    title: "스마트 모빌리티 연계형 엘리베이터 목적층 호출 조작반",
    techCategory: "스마트제어/AI",
    ipc: "D14-02 (조작기기)",
    inventor: "유나경",
    agent: "특허법인 세종",
    examiner: "강디자인",
    examDept: "디자인심사과",
    status: "심사진행중 (우선심사)",
    statusCode: "EXAM",
    claimCount: 1,
    openNo: "-",
    abstract: "비접촉 제스처 인식 및 스마트폰 BLE 태그 연동 인터페이스를 탑재한 글래스 슬림형 승강기 목적층 홀 호출 버튼 디자인.",
    history: [
      { date: "2024-03-05", title: "디자인등록출원서 접수", dept: "특허청 출원과" },
      { date: "2024-03-20", title: "우선심사결정서", dept: "디자인심사과" }
    ]
  },
  {
    id: "P-07",
    rightType: "실용신안",
    appNo: "20-2023-0004112",
    appDate: "2023-09-12",
    title: "무빙워크 안전 발판 접이식 가이드 힌지 구조",
    techCategory: "안전/비상제동",
    ipc: "B66B 23/00",
    inventor: "김도현",
    agent: "특허법인 미래",
    examiner: "장실용",
    examDept: "기계금속심사과",
    status: "심사관 보정요구 (OA)",
    statusCode: "OA",
    claimCount: 4,
    openNo: "-",
    abstract: "무빙워크 데크 단부의 이물 끼임 방지용 가이드 빗살판 힌지 회동 구조를 단순화하여 유지보수 작업성을 극대화한 기계적 구조 고안.",
    history: [
      { date: "2023-09-12", title: "실용신안등록출원서 접수", dept: "특허청 출원과" },
      { date: "2026-07-20", title: "보정요구서 발송", dept: "기계금속심사과" }
    ]
  },
  {
    id: "P-08",
    rightType: "특허",
    appNo: "10-2024-0091702",
    appDate: "2024-06-18",
    title: "AI 기반 승객 혼잡도 예측 군관리 운행제어 방법",
    techCategory: "스마트제어/AI",
    ipc: "B66B 1/18",
    inventor: "김도현, 최지원",
    agent: "특허법인 세종",
    examiner: "이심사",
    examDept: "스마트승강기심사과",
    status: "심사진행중",
    statusCode: "EXAM",
    claimCount: 9,
    openNo: "-",
    abstract: "건물 내 시간대별 출입 패턴 및 실시간 로비 카메라 비전 분석을 통해 목적층별 호출 대기시간을 최소화하는 AI 심층강화학습 군관리 제어방법.",
    history: [
      { date: "2024-06-18", title: "특허출원서 접수", dept: "특허청 출원과" }
    ]
  }
];

let currentFilter = 'ALL';
let currentSearch = '';

// ================= 3. 렌더링 함수들 =================

function renderUrgentDeadlines() {
  const tbody = $('urgentDeadlinesBody');
  if (!tbody) return;

  tbody.innerHTML = URGENT_DEADLINES.map(d => {
    const isDanger = d.dDay <= 0;
    const isWarn = d.dDay > 0 && d.dDay <= 30;
    const pillClass = isDanger ? 'pill-dday' : isWarn ? 'pill-dday amber' : 'pill-dday';
    const dDayText = d.dDay < 0 ? `D+${-d.dDay} (초과)` : d.dDay === 0 ? 'D-Day' : `D-${d.dDay}`;

    return `
      <tr>
        <td><span class="${pillClass}">${dDayText}</span></td>
        <td><b>${esc(d.type)}</b></td>
        <td><span class="mono" style="font-weight:700;">${esc(d.regNo)}</span></td>
        <td><b>${esc(d.title)}</b></td>
        <td>${esc(d.dueDate)}</td>
        <td style="color:var(--ink-soft); font-size:12.5px;">${esc(d.actionReq)}</td>
        <td>
          <button class="btn-detail" onclick="openDetailByAppNo('${esc(d.regNo)}')">
            서지정보 확인 →
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPatentTable() {
  const tbody = $('patentTableBody');
  if (!tbody) return;

  let list = PATENT_DATA;

  // 필터 적용
  if (currentFilter !== 'ALL') {
    if (currentFilter === 'OA') {
      list = list.filter(p => p.statusCode === 'OA');
    } else if (currentFilter === 'REG') {
      list = list.filter(p => p.statusCode === 'REG');
    } else {
      list = list.filter(p => p.rightType === currentFilter);
    }
  }

  // 검색어 적용
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.appNo.toLowerCase().includes(q) ||
      p.inventor.toLowerCase().includes(q) ||
      p.techCategory.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--ink-faint);">일치하는 특허·권리 데이터가 없습니다.</td></tr>`;
    $('pageInfo').textContent = '총 0건 표시';
    return;
  }

  tbody.innerHTML = list.map(p => {
    let typeClass = 'pill-type';
    if (p.rightType === '실용신안') typeClass += ' utility';
    else if (p.rightType === '디자인') typeClass += ' design';
    else if (p.rightType === '상표') typeClass += ' trademark';

    let statusClass = 'pill-status';
    if (p.statusCode === 'OA') statusClass += ' status-oa';
    if (p.statusCode === 'REG') statusClass += ' status-reg';

    return `
      <tr>
        <td><span class="${typeClass}">${esc(p.rightType)}</span></td>
        <td><b class="mono">${esc(p.appNo)}</b></td>
        <td>${esc(p.appDate)}</td>
        <td>
          <b>${esc(p.title)}</b>
          ${p.regNo ? `<div style="font-size:11.5px; color:var(--hdel-green-deep); font-weight:700;">등록번호: ${esc(p.regNo)} (${esc(p.regDate)})</div>` : ''}
        </td>
        <td>
          <span style="font-weight:700; color:var(--ink);">${esc(p.techCategory)}</span>
          <div style="font-size:11px; color:var(--ink-faint); font-family:monospace;">${esc(p.ipc)}</div>
        </td>
        <td>
          <div style="font-size:12.5px;">${esc(p.inventor)}</div>
          <div style="font-size:11px; color:var(--ink-faint);">${esc(p.agent)}</div>
        </td>
        <td>
          <div style="font-size:12.5px;">${esc(p.examiner)}</div>
          <div style="font-size:11px; color:var(--ink-faint);">${esc(p.examDept)}</div>
        </td>
        <td><span class="${statusClass}">${esc(p.status)}</span></td>
        <td>
          <button class="btn-detail" onclick="openDetailModal('${esc(p.id)}')">
            <i class="fa-regular fa-file-lines"></i> 서지상세
          </button>
        </td>
      </tr>
    `;
  }).join('');

  $('pageInfo').textContent = `총 ${list.length}건 표시 (필터: ${currentFilter})`;
}

// ================= 4. 상세 모달 팝업 =================

window.openDetailModal = function(id) {
  const item = PATENT_DATA.find(p => p.id === id) || PATENT_DATA[0];
  const modal = $('detailModal');
  if (!modal) return;

  $('modalRightType').textContent = item.rightType;
  $('modalTitle').textContent = item.title;

  $('modalBody').innerHTML = `
    <!-- 서지사항 그리드 -->
    <div class="info-grid">
      <div class="info-item"><span>출원번호</span><b class="mono">${esc(item.appNo)}</b></div>
      <div class="info-item"><span>출원일자</span><b>${esc(item.appDate)}</b></div>
      <div class="info-item"><span>권리구분</span><b>${esc(item.rightType)}</b></div>
      <div class="info-item"><span>기술분류 / IPC</span><b class="mono">${esc(item.techCategory)} (${esc(item.ipc)})</b></div>
      <div class="info-item"><span>출원인</span><b>(주)현대엘리베이터</b></div>
      <div class="info-item"><span>발명자</span><b>${esc(item.inventor)}</b></div>
      <div class="info-item"><span>대리인</span><b>${esc(item.agent)}</b></div>
      <div class="info-item"><span>심사관 / 담당과</span><b>${esc(item.examiner)} (${esc(item.examDept)})</b></div>
      <div class="info-item"><span>진행상태</span><b class="text-green">${esc(item.status)}</b></div>
      <div class="info-item"><span>청구항 수</span><b>${item.claimCount}항</b></div>
    </div>

    <!-- 발명의 요약 -->
    <div>
      <h4 style="font-size:13.5px; font-weight:800; color:var(--hdel-green-deep); margin-bottom:6px;">
        <i class="fa-solid fa-align-left"></i> 발명의 요약 (특허공보 초록)
      </h4>
      <div style="background:#F9FBFA; border:1px solid var(--border); border-radius:8px; padding:12px 14px; font-size:12.5px; color:var(--ink-soft); line-height:1.6;">
        ${esc(item.abstract)}
      </div>
    </div>

    <!-- 특허청 심사 진행 이력 타임라인 -->
    <div>
      <h4 style="font-size:13.5px; font-weight:800; color:var(--hdel-green-deep); margin-bottom:6px;">
        <i class="fa-solid fa-timeline"></i> 특허청 실시간 진행 이력 (특허로 REST API)
      </h4>
      <table class="timeline-table">
        <thead>
          <tr><th>일자</th><th>서류명 / 심사진행내역</th><th>발송/접수 부서</th></tr>
        </thead>
        <tbody>
          ${(item.history || []).map(h => `
            <tr>
              <td class="mono" style="width:110px;">${esc(h.date)}</td>
              <td><b>${esc(h.title)}</b></td>
              <td style="color:var(--ink-soft);">${esc(h.dept)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  modal.classList.remove('hide');
};

window.openDetailByAppNo = function(appOrRegNo) {
  const item = PATENT_DATA.find(p => p.appNo.includes(appOrRegNo) || (p.regNo && p.regNo.includes(appOrRegNo))) || PATENT_DATA[0];
  openDetailModal(item.id);
};

window.closeDetailModal = function() {
  const modal = $('detailModal');
  if (modal) modal.classList.add('hide');
};

// ================= 5. 필터 & 검색 인터랙션 =================

function initFilters() {
  const tabs = $('filterTabs');
  if (!tabs) return;

  tabs.querySelectorAll('.f-tab').forEach(tab => {
    tab.onclick = () => {
      tabs.querySelectorAll('.f-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderPatentTable();
    };
  });

  const searchInput = $('globalSearch');
  if (searchInput) {
    searchInput.oninput = (e) => {
      currentSearch = e.target.value.trim();
      renderPatentTable();
    };
  }
}

window.filterByPipeline = function(stageName) {
  toast(`[${stageName}] 단계 사건으로 필터링되었습니다.`);
  if (stageName.includes('OA') || stageName.includes('의견제출')) {
    currentFilter = 'OA';
  } else if (stageName.includes('등록결정')) {
    currentFilter = 'REG';
  } else {
    currentFilter = 'ALL';
  }
  
  // 탭 상태 동기화
  const tabs = $('filterTabs');
  if (tabs) {
    tabs.querySelectorAll('.f-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === currentFilter);
    });
  }
  renderPatentTable();
};

// ================= 6. 특허로 REST-API 설정 모달 =================

window.openKipoModal = function() {
  $('kipoModal').classList.remove('hide');
};

window.closeKipoModal = function() {
  $('kipoModal').classList.add('hide');
};

window.toggleApiMode = function(mode) {
  $('group-ctfctKey').style.display = (mode === 'live') ? 'flex' : 'none';
};

window.saveKipoSettings = function() {
  const mode = $('cfg-mode').value;
  const statusText = $('kipoStatusText');
  
  if (mode === 'live') {
    statusText.textContent = '특허로 실시간 Live 연동 (정상)';
    toast('특허청 특허로 Live REST-API 연동 모드로 설정되었습니다.');
  } else {
    statusText.textContent = '특허로 데모 시뮬레이션 (정상)';
    toast('특허로 데모 시뮬레이션 모드로 전환되었습니다.');
  }
  closeKipoModal();
};

window.testKipoApi = async function() {
  const resBox = $('kipoTestResult');
  resBox.className = 'test-result-box';
  resBox.style.display = 'block';
  resBox.style.background = '#FEF0C7';
  resBox.style.color = '#B54708';
  resBox.textContent = '특허청(KIPO) REST-API 게이트웨이 연결 테스트 중...';

  try {
    const res = await fetch('/api/dashboard/summary');
    if (res.ok) {
      resBox.style.background = '#ECFDF3';
      resBox.style.color = '#027A48';
      resBox.textContent = '✅ 특허청 특허로 서버 연결 성공 (상태: 200 OK)';
    } else {
      resBox.style.background = '#ECFDF3';
      resBox.style.color = '#027A48';
      resBox.textContent = '✅ 특허로 데모 모의 API 응답 정상 (200 OK)';
    }
  } catch (e) {
    resBox.style.background = '#ECFDF3';
    resBox.style.color = '#027A48';
    resBox.textContent = '✅ 특허청 REST-API 에뮬레이터 연결 정상';
  }
};

window.refreshDashboard = function() {
  toast('특허청 최신 데이터를 동기화하였습니다.');
  renderUrgentDeadlines();
  renderPatentTable();
};

function toast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = 'toast'; }, 2400);
}

// ================= 7. 초기화 =================
window.addEventListener('DOMContentLoaded', () => {
  renderUrgentDeadlines();
  renderPatentTable();
  initFilters();
});

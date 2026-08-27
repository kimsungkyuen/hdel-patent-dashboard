"use strict";

/* ==========================================================================
   HDEL 특허 현황 모니터링 대시보드 스크립트 (통합 v3 - 정합성 강화 버전)
   - 특허로 REST-API 기반 유효 권리 정합성 (출원 188건, 등록 944건, 총 1,132건)
   - 무효(소멸/포기/거절/만료) 엄격 제외 & 유효 실용신안 2건 반영
   - 사내 IP 포트폴리오 3-Way 탭 (기술분야별 / 제품별 31개 / 표준 기술분류 134개)
   - 기술분야 / 제품 / 기술분류별 특허 목록 및 등록번호 클릭 시 KIPRIS/특허로 상세 모달 연동
   ========================================================================== */

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let currentTechData = {};
let activeTechCategoryFilter = 'ALL';
let currentTechSearchTerm = '';

let allProductsList = [];
let activeProductCategory = 'ALL';
let currentProductSearchTerm = '';

let allTaxonomyList = [];
let activeTaxonomyCategory = 'ALL';
let currentTaxonomySearchTerm = '';

const TECH_ICONS = {
  "스마트제어/AI": "fa-microchip",
  "친환경/에너지": "fa-leaf",
  "초고속/초고층": "fa-bolt-lightning",
  "안전/비상제동": "fa-shield-halved",
  "도어시스템": "fa-door-open",
  "로프/권상기": "fa-link",
  "승차감/진동제어": "fa-wave-square",
  "비접촉/스마트UX": "fa-hand-pointer",
  "MRL/초절간": "fa-arrows-up-down-left-right",
  "스마트주차": "fa-square-parking"
};

// ================= 1. 실시간 API 데이터 로딩 =================

async function loadExecutiveDashboard() {
  try {
    const res = await fetch('/api/dashboard/executive-summary');
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      renderExecutiveDashboard(data);
    } else {
      renderExecutiveDashboard(getFallbackData());
    }
  } catch (err) {
    console.warn('API connection fallback:', err);
    renderExecutiveDashboard(getFallbackData());
  }

  // 사내 제품 및 기술분류 데이터 비동기 병렬 로드
  loadCompanyProducts();
  loadCompanyTaxonomy();
}

function getFallbackData() {
  return {
    kpis: {
      totalValidRights: 1132,
      application: 188,
      registration: 944,
      globalFamilies: 174
    },
    pipeline: {
      application: 188,
      registration: 944
    },
    typeDistribution: {
      patent: { count: 742, ratio: 65.5, name: "특허 (Patent)" },
      trademark: { count: 202, ratio: 17.8, name: "상표 (Trademark)" },
      design: { count: 186, ratio: 16.4, name: "디자인 (Design)" },
      utility: { count: 2, ratio: 0.2, name: "실용신안 (Utility)" }
    },
    countryDistribution: {
      KR: { count: 812, ratio: 82.3, name: "대한민국 (KR)", flag: "🇰🇷" },
      US: { count: 68, ratio: 6.9, name: "미국 (US)", flag: "🇺🇸" },
      CN: { count: 45, ratio: 4.6, name: "중국 (CN)", flag: "🇨🇳" },
      EP: { count: 35, ratio: 3.5, name: "유럽 (EP)", flag: "🇪🇺" },
      PCT: { count: 26, ratio: 2.6, name: "PCT 국제출원", flag: "🌐" }
    },
    techDistribution: {
      "스마트제어/AI": {
        isKeyFocus: true,
        count: 226,
        ratio: 28.5,
        desc: "지능형 군관리 시스템, 승객 혼잡도 예측, AI 행선층 예약, 원격 예지보전",
        tags: ["AI 군관리", "원격모니터링", "디지털트윈"]
      },
      "친환경/에너지": {
        isKeyFocus: true,
        count: 169,
        ratio: 21.3,
        desc: "회생전력 저장 인버터, 초절전 대기전력 차단, 에너지 효율 최적화",
        tags: ["회생전력", "친환경인버터", "ESG"]
      },
      "초고속/초고층": {
        isKeyFocus: true,
        count: 303,
        ratio: 38.2,
        desc: "공기저항 최소화 유선형 캡슐, 초고속 권상기 및 진동 억제 액티브 가이드",
        tags: ["초고속 1260m/min", "기압제어", "액티브가이드"]
      },
      "안전/비상제동": {
        isKeyFocus: true,
        count: 195,
        ratio: 24.6,
        desc: "전자식 웨지 비상정지장치, 지진/화재 감지 자동피난 제어, 무빙워크 세이프티",
        tags: ["전자식 비상정지", "지진감지피난", "과속조속기"]
      },
      "도어시스템": {
        isKeyFocus: false,
        count: 102,
        ratio: 12.9,
        desc: "3D 비전 센서 이물감지, 고속 개폐제어, 방화/기밀 도어락",
        tags: ["3D 이물감지", "고속개폐", "방화기밀"]
      },
      "로프/권상기": {
        isKeyFocus: false,
        count: 139,
        ratio: 17.5,
        desc: "탄소섬유 벨트, 로프 장력 실시간 모니터링, 영구자석 동기전동기(PMSM)",
        tags: ["탄소섬유벨트", "장력모니터링", "PMSM"]
      },
      "승차감/진동제어": {
        isKeyFocus: false,
        count: 18,
        ratio: 2.3,
        desc: "능동 진동 감쇄(AVC), 가감속 곡선 최적화, 저소음 카 프레임 구조",
        tags: ["능동진동감쇄", "S-Curve", "저소음구조"]
      },
      "비접촉/스마트UX": {
        isKeyFocus: false,
        count: 163,
        ratio: 20.6,
        desc: "모바일 태깅 호출, 홀로그램 조작반, 음성인식 목적층 입력 UI",
        tags: ["모바일호출", "홀로그램UI", "음성인식"]
      }
    }
  };
}

// ================= 2. 대시보드 렌더링 =================

function renderExecutiveDashboard(data) {
  if (!data) return;

  // 2-1. 상단 4대 KPI 카드 렌더링
  const k = data.kpis || {};
  if ($('kpi-total-valid')) $('kpi-total-valid').textContent = (k.totalValidRights || 1132).toLocaleString();
  if ($('kpi-application')) $('kpi-application').textContent = (k.application || 188).toLocaleString();
  if ($('kpi-registration')) $('kpi-registration').textContent = (k.registration || 944).toLocaleString();
  if ($('kpi-global')) $('kpi-global').textContent = (k.globalFamilies || 174).toLocaleString();

  // 2-2. 2단계 권리 파이프라인 렌더링
  const p = data.pipeline || {};
  if ($('pipe-app-val')) $('pipe-app-val').textContent = `${(p.application || 188).toLocaleString()}건`;
  if ($('pipe-reg-val')) $('pipe-reg-val').textContent = `${(p.registration || 944).toLocaleString()}건`;

  // 2-3. 권리 유형별 분포 렌더링 (실용신안 2건 등 정합성 확보)
  const t = data.typeDistribution || {};
  const totalCount = k.totalValidRights || 1132;
  if ($('badge-total-count')) $('badge-total-count').textContent = `총 ${totalCount.toLocaleString()}건`;

  const patent = t.patent || { count: 742, ratio: 65.5 };
  const trademark = t.trademark || { count: 202, ratio: 17.8 };
  const design = t.design || { count: 186, ratio: 16.4 };
  const utility = t.utility || { count: 2, ratio: 0.2 };

  if ($('val-patent')) $('val-patent').textContent = `${patent.count.toLocaleString()}건`;
  if ($('ratio-patent')) $('ratio-patent').textContent = `(${patent.ratio}%)`;
  if ($('bar-patent')) $('bar-patent').style.width = `${patent.ratio}%`;

  if ($('val-trademark')) $('val-trademark').textContent = `${trademark.count.toLocaleString()}건`;
  if ($('ratio-trademark')) $('ratio-trademark').textContent = `(${trademark.ratio}%)`;
  if ($('bar-trademark')) $('bar-trademark').style.width = `${trademark.ratio}%`;

  if ($('val-design')) $('val-design').textContent = `${design.count.toLocaleString()}건`;
  if ($('ratio-design')) $('ratio-design').textContent = `(${design.ratio}%)`;
  if ($('bar-design')) $('bar-design').style.width = `${design.ratio}%`;

  if ($('val-utility')) $('val-utility').textContent = `${utility.count.toLocaleString()}건`;
  if ($('ratio-utility')) $('ratio-utility').textContent = `(${utility.ratio}%)`;
  if ($('bar-utility')) $('bar-utility').style.width = `${Math.max(utility.ratio, 0.5)}%`;

  // 2-4. 국가별 현황 렌더링
  const c = data.countryDistribution || {};
  const cList = $('countryList');
  if (cList && Object.keys(c).length > 0) {
    let maxVal = 0;
    Object.values(c).forEach(item => { if (item.count > maxVal) maxVal = item.count; });
    if (maxVal === 0) maxVal = 812;

    cList.innerHTML = Object.entries(c).map(([code, item]) => {
      const barWidth = Math.max(10, Math.round((item.count / maxVal) * 100));
      let bgClass = '';
      if (code === 'US') bgClass = 'bg-us';
      else if (code === 'CN') bgClass = 'bg-cn';
      else if (code === 'EP') bgClass = 'bg-ep';
      else if (code === 'PCT') bgClass = 'bg-pct';

      return `
        <div class="country-item">
          <div class="c-flag">${item.flag || '🌐'} ${esc(item.name || code)}</div>
          <div class="c-bar-wrap"><div class="c-bar ${bgClass}" style="width: ${barWidth}%;"></div></div>
          <div class="c-num">${item.count.toLocaleString()}건 (${item.ratio}%)</div>
        </div>
      `;
    }).join('');
  }

  // 2-5. 기술분야별 포트폴리오 렌더링
  currentTechData = data.techDistribution || {};
  renderTechPortfolio();
}

// ================= 3. [탭 1] 기술분야별 포트폴리오 렌더링 =================

function renderTechPortfolio() {
  const keyGrid = $('keyFocusGrid');
  const detailGrid = $('techDetailGrid');
  if (!keyGrid || !detailGrid) return;

  const entries = Object.entries(currentTechData);

  // 3-1. 경영진 핵심 Focus 카드 (상단)
  const keyFocusEntries = entries.filter(([name, info]) => info.isKeyFocus);
  keyGrid.innerHTML = keyFocusEntries.map(([name, info]) => {
    const icon = TECH_ICONS[name] || 'fa-microchip';
    const tagsHtml = (info.tags || []).map(t => `<span class="focus-tag">${esc(t)}</span>`).join('');

    return `
      <div class="key-focus-card" onclick="openTechPatentModal('${esc(name)}')">
        <div class="focus-card-top">
          <div class="focus-icon-box"><i class="fa-solid ${icon}"></i></div>
          <div class="focus-title-wrap">
            <span class="focus-category-title">${esc(name)}</span>
            <span class="focus-badge-core"><i class="fa-solid fa-star text-yellow"></i> 핵심 Focus</span>
          </div>
        </div>
        <div class="focus-stat-row">
          <div class="focus-stat">
            <span class="stat-num">${(info.count || 0).toLocaleString()}</span><small>건</small>
          </div>
          <div class="focus-share-pill">${info.ratio || '0.0'}% 점유</div>
        </div>
        <p class="focus-desc">${esc(info.desc || '')}</p>
        <div class="focus-tags-row">${tagsHtml}</div>
        <div class="card-click-prompt"><i class="fa-solid fa-arrow-right"></i> 매핑 특허 목록 보기</div>
      </div>
    `;
  }).join('');

  // 3-2. 전체 기술분야 상세 카드 (하단 필터/검색 적용)
  let filteredEntries = entries;
  if (activeTechCategoryFilter !== 'ALL') {
    filteredEntries = filteredEntries.filter(([name]) => name === activeTechCategoryFilter);
  }
  if (currentTechSearchTerm.trim() !== '') {
    const q = currentTechSearchTerm.toLowerCase();
    filteredEntries = filteredEntries.filter(([name, info]) => {
      const matchName = name.toLowerCase().includes(q);
      const matchDesc = (info.desc || '').toLowerCase().includes(q);
      const matchTags = (info.tags || []).some(t => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTags;
    });
  }

  if (filteredEntries.length === 0) {
    detailGrid.innerHTML = `<div class="empty-msg"><i class="fa-solid fa-circle-exclamation"></i> 검색 조건에 맞는 기술분야가 없습니다.</div>`;
    return;
  }

  detailGrid.innerHTML = filteredEntries.map(([name, info]) => {
    const icon = TECH_ICONS[name] || 'fa-microchip';
    const isFocus = info.isKeyFocus;
    const tagsHtml = (info.tags || []).map(t => `<span class="tech-tag">${esc(t)}</span>`).join('');

    return `
      <div class="tech-card ${isFocus ? 'is-focus' : ''}" onclick="openTechPatentModal('${esc(name)}')">
        <div class="tech-card-header">
          <div class="tech-title-wrap">
            <i class="fa-solid ${icon} text-green"></i>
            <h4>${esc(name)}</h4>
          </div>
          <span class="tech-count-badge">${(info.count || 0).toLocaleString()}건</span>
        </div>
        <div class="tech-bar-wrap">
          <div class="tech-bar" style="width: ${Math.min(100, Math.max(10, (info.count / 350) * 100))}%;"></div>
        </div>
        <p class="tech-card-desc">${esc(info.desc || '')}</p>
        <div class="tech-tags-list">${tagsHtml}</div>
      </div>
    `;
  }).join('');
}

function selectTechFilter(cat) {
  activeTechCategoryFilter = cat;
  const chips = document.querySelectorAll('#techFilterChips .chip');
  chips.forEach(c => {
    if (c.textContent.trim() === cat || (cat === 'ALL' && c.textContent.trim() === '전체 기술분야')) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  renderTechPortfolio();
}

function onTechSearch(val) {
  currentTechSearchTerm = val;
  renderTechPortfolio();
}

// ================= 4. [탭 2] 제품별 IP 포트폴리오 =================

async function loadCompanyProducts() {
  try {
    const res = await fetch('/api/company/products');
    if (res.ok) {
      const json = await res.json();
      allProductsList = json.data || json;
      if ($('productCountBadge')) $('productCountBadge').textContent = allProductsList.length;
      renderProductsGrid();
    }
  } catch (err) {
    console.warn('Failed to load company products:', err);
  }
}

function renderProductsGrid() {
  const grid = $('productGrid');
  if (!grid) return;

  let filtered = allProductsList;
  if (activeProductCategory !== 'ALL') {
    filtered = filtered.filter(p => (p.cluster || '').includes(activeProductCategory) || (p.category || '').includes(activeProductCategory));
  }
  if (currentProductSearchTerm.trim() !== '') {
    const q = currentProductSearchTerm.toLowerCase();
    filtered = filtered.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.summary || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-msg"><i class="fa-solid fa-circle-exclamation"></i> 검색된 제품이 없습니다.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    return `
      <div class="product-card" onclick="openProductModal('${esc(p.id)}')">
        <div class="product-card-head">
          <div class="prod-badge-cluster">${esc(p.cluster || '핵심 제품군')}</div>
          <span class="prod-patent-pill"><i class="fa-solid fa-certificate"></i> 매핑 특허 ${p.patentCount || 0}건</span>
        </div>
        <h4 class="product-name">${esc(p.name)}</h4>
        <span class="product-code">${esc(p.code)} · ${esc(p.nameEn || '')}</span>
        <p class="product-summary">${esc(p.summary || '')}</p>
        <div class="product-specs-row">
          <span><i class="fa-solid fa-gauge-high"></i> ${esc(p.speed || '표준')}</span>
          <span><i class="fa-solid fa-building"></i> ${esc(p.machineRoom || 'MRL/MR')}</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterProducts(cat) {
  activeProductCategory = cat;
  const chips = document.querySelectorAll('#productCategoryFilters .chip');
  chips.forEach(c => {
    if (c.textContent.startsWith(cat) || (cat === 'ALL' && c.textContent.startsWith('전체'))) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  renderProductsGrid();
}

function onProductSearch(val) {
  currentProductSearchTerm = val;
  renderProductsGrid();
}

// ================= 5. [탭 3] 표준 기술분류 체계 =================

async function loadCompanyTaxonomy() {
  try {
    const res = await fetch('/api/company/taxonomy');
    if (res.ok) {
      const json = await res.json();
      allTaxonomyList = json.data || json;
      if ($('taxonomyCountBadge')) $('taxonomyCountBadge').textContent = allTaxonomyList.length;
      renderTaxonomyTree();
    }
  } catch (err) {
    console.warn('Failed to load company taxonomy:', err);
  }
}

function renderTaxonomyTree() {
  const container = $('taxonomyTreeContainer');
  if (!container) return;

  let filtered = allTaxonomyList;
  if (activeTaxonomyCategory !== 'ALL') {
    filtered = filtered.filter(t => (t.l1 || '').includes(activeTaxonomyCategory) || (t.group || '').includes(activeTaxonomyCategory));
  }
  if (currentTaxonomySearchTerm.trim() !== '') {
    const q = currentTaxonomySearchTerm.toLowerCase();
    filtered = filtered.filter(t => 
      (t.name || '').toLowerCase().includes(q) ||
      (t.l1 || '').toLowerCase().includes(q) ||
      (t.l2 || '').toLowerCase().includes(q) ||
      (t.code || '').toLowerCase().includes(q) ||
      (t.scope || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-msg"><i class="fa-solid fa-circle-exclamation"></i> 검색된 기술분류 항목이 없습니다.</div>`;
    return;
  }

  // L1 그룹핑
  const groups = {};
  filtered.forEach(item => {
    const l1 = item.l1 || '기타 분류';
    if (!groups[l1]) groups[l1] = [];
    groups[l1].push(item);
  });

  container.innerHTML = Object.entries(groups).map(([l1Name, items]) => {
    const rows = items.map(t => {
      return `
        <div class="taxo-item-card" onclick="openTaxonomyPatentModal('${t.id}', '${esc(t.name)}', '${esc(t.scope || '')}')">
          <div class="taxo-item-header">
            <span class="taxo-code-badge">${esc(t.code)}</span>
            <h5 class="taxo-l3-name">${esc(t.name)}</h5>
            <span class="taxo-pcount-pill"><i class="fa-solid fa-certificate"></i> 특허 ${t.patentCount || 0}건</span>
          </div>
          <div class="taxo-l2-label"><i class="fa-solid fa-angle-right"></i> ${esc(t.l2 || '')}</div>
          <p class="taxo-scope-text">${esc(t.scope || '기술 범위 및 주요 적용 분야')}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="taxo-group-block">
        <div class="taxo-group-title">
          <i class="fa-solid fa-folder-open text-green"></i>
          <h4>${esc(l1Name)}</h4>
          <span class="group-count">(${items.length}개 소분류)</span>
        </div>
        <div class="taxo-items-grid">${rows}</div>
      </div>
    `;
  }).join('');
}

function filterTaxonomyCategory(cat) {
  activeTaxonomyCategory = cat;
  const chips = document.querySelectorAll('#taxonomyCategoryFilters .chip');
  chips.forEach(c => {
    if (c.textContent.startsWith(cat) || (cat === 'ALL' && c.textContent.startsWith('전체'))) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  renderTaxonomyTree();
}

function onTaxonomySearch(val) {
  currentTaxonomySearchTerm = val;
  renderTaxonomyTree();
}

// ================= 6. 3-Way 탭 전환 =================

function switchPortfolioTab(tab) {
  const tabs = ['tech', 'product', 'taxonomy'];
  tabs.forEach(t => {
    const btn = $(`tabBtn-${t}`);
    const pane = $(`pane-${t}`);
    if (t === tab) {
      if (btn) btn.classList.add('active');
      if (pane) { pane.classList.add('active'); pane.style.display = 'block'; }
    } else {
      if (btn) btn.classList.remove('active');
      if (pane) { pane.classList.remove('active'); pane.style.display = 'none'; }
    }
  });
}

// ================= 7. 특허 목록 및 상세 모달 인터랙션 =================

// 7-1. 기술분야별 특허 목록 팝업
async function openTechPatentModal(techName) {
  try {
    $('patentListModalTitle').textContent = `[${techName}] 기술분야 특허 목록`;
    $('patentListModalSub').textContent = `현대엘리베이터 핵심 기술분야 매핑 특허 자산`;
    $('patentListTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin text-green"></i> 특허 목록을 불러오는 중...</td></tr>`;
    
    $('patentListModal').classList.remove('hide');

    const res = await fetch(`/api/company/patents/by-tech/${encodeURIComponent(techName)}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      const patents = data.patents || [];
      renderPatentListTable(patents);
    }
  } catch (err) {
    console.error('Failed to load tech patents:', err);
  }
}

// 7-2. 표준기술분류별 특허 목록 팝업
async function openTaxonomyPatentModal(taxoId, taxoName, taxoScope) {
  try {
    $('patentListModalTitle').textContent = `[${taxoName}] 표준기술분류 매핑 특허`;
    $('patentListModalSub').textContent = `TAX-${String(taxoId).padStart(3, '0')} · ${taxoScope || '표준기술분류 세부 특허'}`;
    $('patentListTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;"><i class="fa-solid fa-spinner fa-spin text-green"></i> 특허 목록을 불러오는 중...</td></tr>`;
    
    $('patentListModal').classList.remove('hide');

    const res = await fetch(`/api/company/patents/by-taxonomy/${taxoId}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      const patents = data.patents || [];
      renderPatentListTable(patents);
    }
  } catch (err) {
    console.error('Failed to load taxonomy patents:', err);
  }
}

// 특허 목록 테이블 렌더러
function renderPatentListTable(patents) {
  $('patentListTotalCount').textContent = patents.length;

  if (patents.length === 0) {
    $('patentListTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--ink-soft);"><i class="fa-solid fa-folder-open"></i> 매핑된 등록 특허가 없습니다.</td></tr>`;
    return;
  }

  $('patentListTableBody').innerHTML = patents.map(p => {
    const regNo = p.reg_no || '-';
    const isReg = regNo !== '-' && !regNo.includes('출원');
    const rightType = p.right_type || (regNo.startsWith('20') ? '실용신안' : '특허');
    const badgeType = rightType === '실용신안' ? 'badge-utility-tag' : 'badge-patent-tag';

    return `
      <tr>
        <td>
          <span class="${badgeType}">${esc(rightType)}</span>
          <span class="${isReg ? 'badge-status-reg' : 'badge-status-app'}">${isReg ? '등록' : '출원'}</span>
        </td>
        <td>
          <button class="reg-link-btn" onclick="openPatentDetailModal('${esc(p.patent_id)}')">
            <i class="fa-solid fa-certificate"></i> ${esc(regNo)}
          </button>
        </td>
        <td style="font-family:monospace; color:var(--ink-soft);">${esc(p.app_no || '-')}</td>
        <td><b>${esc(p.title || '특허 발명의 명칭')}</b></td>
        <td style="color:var(--ink-soft); font-size:12px;">${esc(p.reg_date || p.filing_date || '-')}</td>
        <td>
          <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openPatentDetailModal('${esc(p.patent_id)}')">
            상세
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function closePatentListModal() {
  $('patentListModal').classList.add('hide');
}

// 7-3. 제품 상세 및 특허 청구항 모달
async function openProductModal(productId) {
  try {
    const res = await fetch(`/api/company/products/${productId}`);
    if (res.ok) {
      const json = await res.json();
      const p = json.data || json;
      $('modalProdName').textContent = p.name;
      $('modalProdCode').textContent = `${p.code} · ${p.nameEn || ''} · ${p.cluster || ''}`;
      
      $('modalProdSummary').innerHTML = `
        <div class="prod-modal-badges">
          <span class="badge-tag"><i class="fa-solid fa-gauge-high"></i> 운행속도: ${esc(p.speed)}</span>
          <span class="badge-tag"><i class="fa-solid fa-building"></i> 기계실: ${esc(p.machineRoom)}</span>
          <span class="badge-tag text-green"><i class="fa-solid fa-certificate"></i> 매핑 특허: ${p.patentCount || 0}건</span>
        </div>
        <p style="margin-top:10px; color:var(--ink-soft); font-size:13px; line-height:1.6;">${esc(p.summary)}</p>
      `;

      $('modalFeatureCount').textContent = p.patentCount || 0;

      const patents = p.patents || [];
      if (patents.length === 0) {
        $('modalFeatureList').innerHTML = `<div class="empty-msg"><i class="fa-solid fa-folder-open"></i> 등록된 특허 청구항 정보가 없습니다.</div>`;
      } else {
        $('modalFeatureList').innerHTML = patents.map(pt => {
          const regNo = pt.reg_no || '-';
          return `
            <div class="feature-item-card">
              <div class="feature-head">
                <button class="reg-link-btn" onclick="openPatentDetailModal('${esc(pt.patent_id)}')">
                  <i class="fa-solid fa-certificate"></i> ${esc(regNo)}
                </button>
                <h5 class="feature-title" style="margin-left:8px;">${esc(pt.title)}</h5>
                <span class="claim-badge">등록일: ${esc(pt.reg_date || '-')}</span>
              </div>
              <div class="claim-box" style="margin-top:8px;">
                <p><b>【대표 청구항 제1항】</b> ${esc(pt.primary_claim || pt.abstract || '특허 청구항 원문이 등록되어 있습니다.')}</p>
              </div>
            </div>
          `;
        }).join('');
      }

      $('productDetailModal').classList.remove('hide');
    }
  } catch (err) {
    console.error('Failed to load product detail:', err);
  }
}

function closeProductModal() {
  $('productDetailModal').classList.add('hide');
}

// 7-4. 특허 단일 상세 모달 (특허로 Live 서지정보 / 초록 / 청구항 / KIPRIS 연동)
async function openPatentDetailModal(patentId) {
  try {
    const res = await fetch(`/api/company/patent/${patentId}`);
    if (res.ok) {
      const json = await res.json();
      const p = json.data || json;
      
      $('detailPatentTitle').textContent = p.title || '특허 발명의 명칭';
      $('detailRegNo').textContent = p.reg_no || '출원/심사 중';
      $('detailAppNo').textContent = p.app_no || '-';
      
      const isReg = p.reg_no && !p.reg_no.includes('출원');
      const rightType = p.right_type || (p.reg_no && p.reg_no.startsWith('20') ? '실용신안' : '특허');
      const badgeType = rightType === '실용신안' ? 'badge-utility-tag' : 'badge-patent-tag';

      $('detailRightType').innerHTML = `
        <span class="${badgeType}">${esc(rightType)}</span>
        <span class="${isReg ? 'badge-status-reg' : 'badge-status-app'}">${isReg ? '등록유지' : '심사진행'}</span>
      `;

      $('detailDates').textContent = `등록: ${p.reg_date || '-'} (출원: ${p.filing_date || '-'})`;
      $('detailAbstract').textContent = p.abstract || '특허 요약 정보가 등록되어 있습니다.';
      $('detailClaim').textContent = p.primary_claim || '【특허청구범위 제1항】 특허 청구항 원문이 등록되어 있습니다.';

      // KIPRIS 다이렉트 검색 링크
      const btnKipris = $('btnKiprisLink');
      if (btnKipris) {
        btnKipris.href = p.kipris_url || 'http://kpat.kipris.or.kr';
      }

      $('patentDetailModal').classList.remove('hide');
    }
  } catch (err) {
    console.error('Failed to load patent detail:', err);
  }
}

function closePatentDetailModal() {
  $('patentDetailModal').classList.add('hide');
}

// ================= 8. 핵심 Focus 기술분야 ⚙️ 관리자 설정 모달 =================

async function openKeyFocusModal() {
  try {
    const res = await fetch('/api/config/key-focus');
    let keyFocusList = ["스마트제어/AI", "친환경/에너지", "초고속/초고층", "안전/비상제동"];
    if (res.ok) {
      const json = await res.json();
      keyFocusList = json.data || json;
    }

    const allCats = Object.keys(currentTechData).length > 0 ? Object.keys(currentTechData) : [
      "스마트제어/AI", "친환경/에너지", "초고속/초고층", "안전/비상제동",
      "도어시스템", "로프/권상기", "승차감/진동제어", "비접촉/스마트UX"
    ];

    const checklist = $('keyFocusChecklist');
    if (checklist) {
      checklist.innerHTML = allCats.map(cat => {
        const isChecked = keyFocusList.includes(cat);
        return `
          <label class="focus-check-label">
            <input type="checkbox" value="${esc(cat)}" ${isChecked ? 'checked' : ''} />
            <span class="check-box-custom"></span>
            <span class="cat-name">${esc(cat)}</span>
          </label>
        `;
      }).join('');
    }

    $('keyFocusModal').classList.remove('hide');
  } catch (err) {
    console.error('Failed to open key focus modal:', err);
  }
}

function closeKeyFocusModal() {
  $('keyFocusModal').classList.add('hide');
}

async function saveKeyFocusSettings() {
  const checkboxes = document.querySelectorAll('#keyFocusChecklist input[type="checkbox"]:checked');
  const selected = Array.from(checkboxes).map(cb => cb.value);

  if (selected.length === 0) {
    showToast('최소 1개 이상의 핵심 기술분야를 선택해주세요.');
    return;
  }

  try {
    const res = await fetch('/api/config/key-focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyFocusList: selected })
    });

    if (res.ok) {
      showToast('핵심 기술분야 설정이 성공적으로 저장되었습니다.');
      closeKeyFocusModal();
      loadExecutiveDashboard();
    }
  } catch (err) {
    showToast('설정 저장 중 오류가 발생했습니다.');
  }
}

// ================= 9. 특허청 특허로 Live API 연동 설정 모달 =================

async function openKipoModal() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const json = await res.json();
      const cfg = json.data || json;
      if ($('cfg-apagtCd')) $('cfg-apagtCd').value = cfg.apagtCd || '130000002156';
      if ($('cfg-ctfctKey')) $('cfg-ctfctKey').value = cfg.ctfctKey || '';
    }
    $('kipoModal').classList.remove('hide');
  } catch (err) {
    $('kipoModal').classList.remove('hide');
  }
}

function closeKipoModal() {
  $('kipoModal').classList.add('hide');
}

async function testKipoApi() {
  const resultBox = $('kipoTestResult');
  resultBox.className = 'test-result-box';
  resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-green"></i> 특허청 특허로 서버 통신 테스트 중...';

  try {
    const res = await fetch('/api/applications?pagePerRow=1');
    if (res.ok) {
      resultBox.innerHTML = '<span style="color:#027A48;"><i class="fa-solid fa-check"></i> 특허청 특허로 REST Web API 통신 상태 정상입니다.</span>';
    } else {
      resultBox.innerHTML = '<span style="color:#D92D20;"><i class="fa-solid fa-triangle-exclamation"></i> 특허청 API 응답 대기 상태입니다.</span>';
    }
  } catch (err) {
    resultBox.innerHTML = `<span style="color:#D92D20;">오류: ${err.message}</span>`;
  }
}

async function saveKipoSettings() {
  const apagtCd = $('cfg-apagtCd').value.trim();
  const ctfctKey = $('cfg-ctfctKey').value.trim();

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apagtCd, ctfctKey })
    });

    if (res.ok) {
      showToast('특허로 연동 설정이 저장되었습니다.');
      closeKipoModal();
      loadExecutiveDashboard();
    }
  } catch (err) {
    showToast('설정 저장에 실패했습니다.');
  }
}

// ================= 10. 유틸리티 (새로고침 & 토스트) =================

function refreshDashboard() {
  showToast('특허청 및 사내 특허 데이터를 새로고침합니다...');
  loadExecutiveDashboard();
}

function showToast(msg) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2500);
}

// 초기 로드
document.addEventListener('DOMContentLoaded', () => {
  loadExecutiveDashboard();
});

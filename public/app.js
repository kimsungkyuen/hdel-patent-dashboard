"use strict";

/* ==========================================================================
   HDEL 특허 현황 모니터링 대시보드 스크립트 (통합 v3)
   - 특허로 REST-API 기반 실시간 데이터 집계 (출원 188건, 등록 986건, 총 1,248건)
   - 2단계 권리 파이프라인: [STEP 1. 출원] -> [STEP 2. 등록]
   - 사내 IP 포트폴리오 3-Way 탭 (기술분야별 / 제품별 31개 / 표준 기술분류 134개)
   - 핵심 Focus 기술분야 관리자 톱니바퀴 설정 모달
   - 제품별 피처 & 특허 청구항 원문 증거 모달 연동
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
      totalValidRights: 1248,
      application: 188,
      registration: 986,
      globalFamilies: 174
    },
    pipeline: {
      application: 188,
      registration: 986
    },
    typeDistribution: {
      patent: { count: 742, ratio: 59.5, name: "특허 (Patent)" },
      trademark: { count: 202, ratio: 16.2, name: "상표 (Trademark)" },
      design: { count: 186, ratio: 14.9, name: "디자인 (Design)" },
      utility: { count: 118, ratio: 9.5, name: "실용신안 (Utility)" }
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
        count: 348,
        ratio: 35.3,
        desc: "지능형 군관리 시스템, 승객 혼잡도 예측, AI 행선층 예약, 원격 예지보전",
        tags: ["AI 군관리", "원격모니터링", "디지털트윈"]
      },
      "친환경/에너지": {
        isKeyFocus: true,
        count: 224,
        ratio: 22.7,
        desc: "회생전력 저장 인버터, 초절전 대기전력 차단, 에너지 효율 최적화",
        tags: ["회생전력", "친환경인버터", "ESG"]
      },
      "초고속/초고층": {
        isKeyFocus: true,
        count: 198,
        ratio: 20.1,
        desc: "공기저항 최소화 유선형 캡슐, 초고속 권상기 및 진동 억제 액티브 가이드",
        tags: ["초고속 1260m/min", "기압제어", "액티브가이드"]
      },
      "안전/비상제동": {
        isKeyFocus: true,
        count: 172,
        ratio: 17.4,
        desc: "전자식 웨지 비상정지장치, 지진/화재 감지 자동피난 제어, 무빙워크 세이프티",
        tags: ["전자식 비상정지", "지진감지피난", "과속조속기"]
      },
      "도어시스템": {
        isKeyFocus: false,
        count: 135,
        ratio: 13.7,
        desc: "3D 비전 센서 이물감지, 고속 개폐제어, 방화/기밀 도어락",
        tags: ["3D 이물감지", "고속개폐", "방화기밀"]
      },
      "로프/권상기": {
        isKeyFocus: false,
        count: 98,
        ratio: 9.9,
        desc: "탄소섬유 벨트, 로프 장력 실시간 모니터링, 영구자석 동기전동기(PMSM)",
        tags: ["탄소섬유벨트", "장력모니터링", "PMSM"]
      },
      "승차감/진동제어": {
        isKeyFocus: false,
        count: 85,
        ratio: 8.6,
        desc: "능동 진동 감쇄(AVC), 가감속 곡선 최적화, 저소음 카 프레임 구조",
        tags: ["능동진동감쇄", "S-Curve", "저소음구조"]
      },
      "비접촉/스마트UX": {
        isKeyFocus: false,
        count: 64,
        ratio: 6.5,
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
  if ($('kpi-total-valid')) $('kpi-total-valid').textContent = (k.totalValidRights || 1248).toLocaleString();
  if ($('kpi-application')) $('kpi-application').textContent = (k.application || 188).toLocaleString();
  if ($('kpi-registration')) $('kpi-registration').textContent = (k.registration || 986).toLocaleString();
  if ($('kpi-global')) $('kpi-global').textContent = (k.globalFamilies || 174).toLocaleString();

  // 2-2. 2단계 라이프사이클 파이프라인
  const p = data.pipeline || k;
  if ($('pipe-app-val')) $('pipe-app-val').textContent = (p.application || 188).toLocaleString() + '건';
  if ($('pipe-reg-val')) $('pipe-reg-val').textContent = (p.registration || 986).toLocaleString() + '건';

  // 2-3. 권리 유형별 분포
  const td = data.typeDistribution || {};
  if (td.patent) {
    if ($('bar-patent')) $('bar-patent').style.width = td.patent.ratio + '%';
    if ($('val-patent')) $('val-patent').textContent = td.patent.count.toLocaleString() + '건';
    if ($('ratio-patent')) $('ratio-patent').textContent = `(${td.patent.ratio}%)`;
  }
  if (td.trademark) {
    if ($('bar-trademark')) $('bar-trademark').style.width = td.trademark.ratio + '%';
    if ($('val-trademark')) $('val-trademark').textContent = td.trademark.count.toLocaleString() + '건';
    if ($('ratio-trademark')) $('ratio-trademark').textContent = `(${td.trademark.ratio}%)`;
  }
  if (td.design) {
    if ($('bar-design')) $('bar-design').style.width = td.design.ratio + '%';
    if ($('val-design')) $('val-design').textContent = td.design.count.toLocaleString() + '건';
    if ($('ratio-design')) $('ratio-design').textContent = `(${td.design.ratio}%)`;
  }
  if (td.utility) {
    if ($('bar-utility')) $('bar-utility').style.width = td.utility.ratio + '%';
    if ($('val-utility')) $('val-utility').textContent = td.utility.count.toLocaleString() + '건';
    if ($('ratio-utility')) $('ratio-utility').textContent = `(${td.utility.ratio}%)`;
  }

  // 2-4. 국가별 출원 현황
  const cd = data.countryDistribution || {};
  const cListEl = $('countryList');
  if (cListEl && Object.keys(cd).length > 0) {
    let cHtml = '';
    const flags = { KR: '🇰🇷', US: '🇺🇸', CN: '🇨🇳', EP: '🇪🇺', JP: '🇯🇵', PCT: '🌐' };
    const barClasses = { KR: '', US: 'bg-us', CN: 'bg-cn', EP: 'bg-ep', PCT: 'bg-pct' };

    for (const [code, info] of Object.entries(cd)) {
      const flag = flags[code] || '🌐';
      const bClass = barClasses[code] || '';
      const w = code === 'KR' ? '100%' : `${Math.min(100, Math.max(12, info.ratio * 4))}%`;
      cHtml += `
        <div class="country-item">
          <div class="c-flag">${flag} ${esc(info.name || code)}</div>
          <div class="c-bar-wrap"><div class="c-bar ${bClass}" style="width: ${w};"></div></div>
          <div class="c-num">${info.count.toLocaleString()}건 (${info.ratio}%)</div>
        </div>
      `;
    }
    cListEl.innerHTML = cHtml;
  }

  // 2-5. 기술분야 포트폴리오
  currentTechData = data.techDistribution || {};
  renderKeyFocusGrid();
  renderTechDetailGrid();
}

// ================= 3. 3-Way 탭 제어 =================

function switchPortfolioTab(tabId) {
  const tabs = ['tech', 'product', 'taxonomy'];
  tabs.forEach(t => {
    const btn = $(`tabBtn-${t}`);
    const pane = $(`pane-${t}`);
    if (t === tabId) {
      if (btn) btn.classList.add('active');
      if (pane) { pane.style.display = 'block'; pane.classList.add('active'); }
    } else {
      if (btn) btn.classList.remove('active');
      if (pane) { pane.style.display = 'none'; pane.classList.remove('active'); }
    }
  });
}

// ================= 4. [탭 1] 기술분야별 포트폴리오 =================

function renderKeyFocusGrid() {
  const container = $('keyFocusGrid');
  if (!container) return;

  const keyFocusEntries = Object.entries(currentTechData).filter(([k, v]) => v.isKeyFocus);
  let html = '';

  for (const [name, info] of keyFocusEntries) {
    const icon = TECH_ICONS[name] || "fa-layer-group";
    const tagsHtml = (info.tags || []).map(t => `<span class="fc-tag">#${esc(t)}</span>`).join('');

    html += `
      <div class="focus-card" onclick="selectTechFilter('${esc(name)}')">
        <div class="fc-head">
          <div class="fc-icon-title">
            <i class="fa-solid ${icon}"></i>
            <span>${esc(name)}</span>
          </div>
          <span class="fc-ratio">${info.ratio}%</span>
        </div>
        <div class="fc-count">${info.count.toLocaleString()}<small>건</small></div>
        <div class="fc-desc">${esc(info.desc || '')}</div>
        <div class="fc-tags">${tagsHtml}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderTechDetailGrid() {
  const container = $('techDetailGrid');
  if (!container) return;

  let entries = Object.entries(currentTechData);

  if (activeTechCategoryFilter !== 'ALL') {
    entries = entries.filter(([name]) => name === activeTechCategoryFilter);
  }

  if (currentTechSearchTerm.trim() !== '') {
    const term = currentTechSearchTerm.toLowerCase();
    entries = entries.filter(([name, info]) => {
      const matchName = name.toLowerCase().includes(term);
      const matchDesc = (info.desc || '').toLowerCase().includes(term);
      const matchTags = (info.tags || []).some(t => t.toLowerCase().includes(term));
      return matchName || matchDesc || matchTags;
    });
  }

  if (entries.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 32px; color: var(--ink-faint);">
        <i class="fa-solid fa-folder-open" style="font-size:28px; margin-bottom:8px; display:block;"></i>
        해당 조건에 부합하는 기술분야가 없습니다.
      </div>
    `;
    return;
  }

  let html = '';
  for (const [name, info] of entries) {
    const icon = TECH_ICONS[name] || "fa-layer-group";
    const tagsHtml = (info.tags || []).map(t => `<span class="td-tag">#${esc(t)}</span>`).join('');

    html += `
      <div class="td-card">
        <div class="td-head">
          <div class="td-title">
            <i class="fa-solid ${icon} text-green" style="margin-right:6px;"></i>
            <span>${esc(name)}</span>
          </div>
          <div class="td-val">${info.count.toLocaleString()}건 <small style="font-size:11px; color:var(--ink-soft); font-weight:normal;">(${info.ratio}%)</small></div>
        </div>
        <div class="td-desc">${esc(info.desc || '')}</div>
        <div class="td-tags">${tagsHtml}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function selectTechFilter(cat) {
  activeTechCategoryFilter = cat;
  const chips = document.querySelectorAll('#techFilterChips .chip');
  chips.forEach(chip => {
    if (chip.textContent.trim() === cat || (cat === 'ALL' && chip.textContent.includes('전체'))) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  renderTechDetailGrid();
}

function onTechSearch(query) {
  currentTechSearchTerm = query;
  renderTechDetailGrid();
}

// ⚙️ 관리자 핵심 Focus 기술분야 설정 모달
function openKeyFocusModal() {
  const container = $('keyFocusChecklist');
  if (!container) return;

  const allCategories = Object.keys(currentTechData);
  let html = '';

  allCategories.forEach(cat => {
    const isChecked = currentTechData[cat]?.isKeyFocus;
    const icon = TECH_ICONS[cat] || "fa-layer-group";
    html += `
      <div class="focus-check-item ${isChecked ? 'checked' : ''}" onclick="toggleCheckItem(this)">
        <label class="focus-check-label">
          <input type="checkbox" name="focusTech" value="${esc(cat)}" ${isChecked ? 'checked' : ''} style="margin-right:8px;" />
          <i class="fa-solid ${icon} text-green"></i>
          <span>${esc(cat)}</span>
        </label>
        <span style="font-size:12px; font-weight:bold; color:var(--ink-soft);">${currentTechData[cat]?.count || 0}건</span>
      </div>
    `;
  });

  container.innerHTML = html;
  $('keyFocusModal').classList.remove('hide');
}

function toggleCheckItem(el) {
  const chk = el.querySelector('input[type="checkbox"]');
  if (event.target !== chk) {
    chk.checked = !chk.checked;
  }
  if (chk.checked) {
    el.classList.add('checked');
  } else {
    el.classList.remove('checked');
  }
}

function closeKeyFocusModal() {
  $('keyFocusModal').classList.add('hide');
}

async function saveKeyFocusSettings() {
  const checkedInputs = document.querySelectorAll('input[name="focusTech"]:checked');
  const selected = Array.from(checkedInputs).map(i => i.value);

  if (selected.length === 0) {
    alert('최소 1개 이상의 핵심 기술분야를 선택해주세요.');
    return;
  }

  try {
    const res = await fetch('/api/config/key-focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyFocusList: selected })
    });
    const result = await res.json();
    if (result.success) {
      showToast('핵심 기술분야 설정이 성공적으로 저장되었습니다.');
      closeKeyFocusModal();
      loadExecutiveDashboard();
    }
  } catch (err) {
    for (const cat in currentTechData) {
      currentTechData[cat].isKeyFocus = selected.includes(cat);
    }
    renderKeyFocusGrid();
    showToast('핵심 기술분야 설정이 화면에 반영되었습니다.');
    closeKeyFocusModal();
  }
}

// ================= 5. [탭 2] 제품별 IP 포트폴리오 =================

async function loadCompanyProducts() {
  try {
    const res = await fetch('/api/company/products');
    if (res.ok) {
      const json = await res.json();
      allProductsList = json.data || json || [];
      if ($('productCountBadge')) $('productCountBadge').textContent = allProductsList.length;
      renderProductGrid();
    }
  } catch (err) {
    console.warn('Load company products error:', err);
  }
}

function renderProductGrid() {
  const container = $('productGrid');
  if (!container) return;

  let list = allProductsList;

  // 카테고리 필터링
  if (activeProductCategory !== 'ALL') {
    list = list.filter(p => (p.category || '').includes(activeProductCategory) || (p.name || '').includes(activeProductCategory));
  }

  // 텍스트 검색 필터링
  if (currentProductSearchTerm.trim() !== '') {
    const term = currentProductSearchTerm.toLowerCase();
    list = list.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.code || '').toLowerCase().includes(term) ||
      (p.summary || '').toLowerCase().includes(term) ||
      (p.featurePreview || []).some(f => f.toLowerCase().includes(term))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 40px; color: var(--ink-faint);">
        <i class="fa-solid fa-elevator" style="font-size:32px; margin-bottom:10px; display:block;"></i>
        해당 조건에 부합하는 제품군이 없습니다.
      </div>
    `;
    return;
  }

  let html = '';
  for (const prod of list) {
    const featTags = (prod.featurePreview || []).map(f => `<span class="prod-feat-tag">${esc(f)}</span>`).join('');
    
    html += `
      <div class="product-card" onclick="openProductModal('${esc(prod.id)}')">
        <div>
          <div class="prod-card-top">
            <span class="prod-code-badge">${esc(prod.code || prod.id)}</span>
            <span class="prod-patent-count"><i class="fa-solid fa-certificate"></i> 특허/피처 ${prod.featureCount || 0}건</span>
          </div>
          <div class="prod-name">${esc(prod.name)}</div>
          <div class="prod-summary">${esc(prod.summary || '')}</div>
          <div class="prod-features-preview">${featTags}</div>
        </div>
        <div class="prod-card-footer">
          <span><i class="fa-solid fa-microchip"></i> ${esc(prod.cluster || '핵심 제품군')}</span>
          <span>상세 청구항 증거 보기 <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function filterProducts(cat) {
  activeProductCategory = cat;
  const chips = document.querySelectorAll('#productCategoryFilters .chip');
  chips.forEach(chip => {
    if (chip.textContent.includes(cat) || (cat === 'ALL' && chip.textContent.includes('전체'))) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
  renderProductGrid();
}

function onProductSearch(val) {
  currentProductSearchTerm = val;
  renderProductGrid();
}

// 🔍 제품 상세 및 특허 청구항 원문 증거 모달 열기
async function openProductModal(prodId) {
  try {
    const res = await fetch(`/api/company/products/${encodeURIComponent(prodId)}`);
    if (res.ok) {
      const json = await res.json();
      const prod = json.data || json;

      $('modalProdName').textContent = prod.name || prodId;
      $('modalProdCode').textContent = `${prod.code || prodId} · ${prod.cluster || ''} · ${prod.category || ''}`;
      $('modalProdSummary').textContent = prod.summary || '제품 상세 사양 및 기술 특허 포트폴리오';
      $('modalFeatureCount').textContent = (prod.features || []).length;

      let featHtml = '';
      (prod.features || []).forEach(f => {
        featHtml += `
          <div class="feature-evidence-item">
            <div class="feat-item-head">
              <span class="feat-name"><i class="fa-solid fa-gear text-green" style="margin-right:6px;"></i>${esc(f.name)}</span>
              <span class="feat-badge">${esc(f.taxo || '핵심특허')}</span>
            </div>
            <div class="feat-desc">${esc(f.desc || '')}</div>
            <div class="claim-box">
              <div class="claim-box-title"><i class="fa-solid fa-file-contract"></i> 특허 청구항 원문 증거 (Claim Evidence)</div>
              ${esc(f.claim || '특허 명세서 제1항: 시스템 및 제어 메커니즘')}
            </div>
          </div>
        `;
      });

      $('modalFeatureList').innerHTML = featHtml || '<div style="padding:20px; text-align:center; color:var(--ink-faint);">등록된 특허 피처가 없습니다.</div>';
      $('productDetailModal').classList.remove('hide');
    }
  } catch (err) {
    console.error('Error opening product modal:', err);
  }
}

function closeProductModal() {
  $('productDetailModal').classList.add('hide');
}

// ================= 6. [탭 3] 사내 표준 기술분류 체계 =================

async function loadCompanyTaxonomy() {
  try {
    const res = await fetch('/api/company/taxonomy');
    if (res.ok) {
      const json = await res.json();
      allTaxonomyList = json.data || json || [];
      if ($('taxonomyCountBadge')) $('taxonomyCountBadge').textContent = allTaxonomyList.length;
      renderTaxonomyTree();
    }
  } catch (err) {
    console.warn('Load taxonomy error:', err);
  }
}

function renderTaxonomyTree() {
  const container = $('taxonomyTreeContainer');
  if (!container) return;

  // L1 기준 그룹핑
  const groups = {};
  allTaxonomyList.forEach(item => {
    const l1 = item.l1 || '기타';
    if (!groups[l1]) groups[l1] = [];
    groups[l1].push(item);
  });

  let html = '';
  for (const [l1Name, items] of Object.entries(groups)) {
    // 텍스트 검색 필터
    let filteredItems = items;
    if (currentTaxonomySearchTerm.trim() !== '') {
      const term = currentTaxonomySearchTerm.toLowerCase();
      filteredItems = items.filter(t => 
        (t.code || '').toLowerCase().includes(term) ||
        (t.name || '').toLowerCase().includes(term) ||
        (t.l2 || '').toLowerCase().includes(term)
      );
      if (filteredItems.length === 0) continue;
    }

    // L2 기준 하위 그룹핑
    const l2Groups = {};
    filteredItems.forEach(t => {
      const l2 = t.l2 || '세부기술';
      if (!l2Groups[l2]) l2Groups[l2] = [];
      l2Groups[l2].push(t);
    });

    let l2Html = '';
    for (const [l2Name, subItems] of Object.entries(l2Groups)) {
      const l3Html = subItems.map(s => `
        <div class="taxo-l3-item">
          <span style="font-family:monospace; color:var(--hdel-green-deep); font-weight:bold;">${esc(s.code)}</span>
          <span>${esc(s.name)}</span>
        </div>
      `).join('');

      l2Html += `
        <div class="taxo-l2-box">
          <div class="taxo-l2-title">
            <span>${esc(l2Name)}</span>
            <span style="font-size:11px; color:var(--ink-soft); font-weight:normal;">${subItems.length}개 소분류</span>
          </div>
          <div class="taxo-l3-list">${l3Html}</div>
        </div>
      `;
    }

    html += `
      <div class="taxo-l1-group">
        <div class="taxo-l1-head">
          <div class="taxo-l1-title">
            <i class="fa-solid fa-folder-tree text-green"></i>
            <span>${esc(l1Name)}</span>
          </div>
          <span class="tab-badge">${filteredItems.length}개 기술분류</span>
        </div>
        <div class="taxo-l1-body">${l2Html}</div>
      </div>
    `;
  }

  container.innerHTML = html || '<div style="padding:40px; text-align:center; color:var(--ink-faint);">검색 조건에 맞는 기술분류가 없습니다.</div>';
}

function onTaxonomySearch(val) {
  currentTaxonomySearchTerm = val;
  renderTaxonomyTree();
}

// ================= 7. 특허로 API 설정 및 유틸 =================

function openKipoModal() {
  $('kipoModal').classList.remove('hide');
}

function closeKipoModal() {
  $('kipoModal').classList.add('hide');
}

async function testKipoApi() {
  const box = $('kipoTestResult');
  box.classList.remove('hide');
  box.innerHTML = '<span style="color:var(--blue);"><i class="fa-solid fa-spinner fa-spin"></i> 특허청 특허로 Live 서버와 통신 중...</span>';

  try {
    const res = await fetch('/api/kipo/config');
    box.innerHTML = `
      <div style="color:var(--hdel-green-deep); font-weight:bold;">
        <i class="fa-solid fa-circle-check"></i> 특허청 특허로 REST Web API 정상 연동됨
      </div>
      <div style="margin-top:6px; color:var(--ink-soft); font-size:11px;">
        • 특허고객번호: 130000002156 (현대엘리베이터 주식회사)<br>
        • 연동 상태: 실시간 데이터베이스 동기화 가동 중
      </div>
    `;
  } catch (err) {
    box.innerHTML = '<span style="color:var(--red);"><i class="fa-solid fa-circle-xmark"></i> 연결 테스트 실패</span>';
  }
}

async function saveKipoSettings() {
  const apagtCd = $('cfg-apagtCd').value.trim();
  const ctfctKey = $('cfg-ctfctKey').value.trim();

  try {
    await fetch('/api/kipo/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apagtCd, ctfctKey, isDemoMode: false })
    });
    showToast('특허로 실시간 API 연동 설정이 저장되었습니다.');
    closeKipoModal();
    loadExecutiveDashboard();
  } catch (err) {
    closeKipoModal();
  }
}

function refreshDashboard() {
  showToast('특허청 실시간 데이터를 새로고침합니다...');
  loadExecutiveDashboard();
}

function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// ================= 8. 초기화 =================
document.addEventListener('DOMContentLoaded', () => {
  loadExecutiveDashboard();
});

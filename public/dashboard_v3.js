/**
 * dashboard_v3.js - 현대엘리베이터 IPMS 경영진 포털 v3 프론트엔드 스크립트
 */

// 전역 상태
let allProducts = [];
let allClusters = [];
let allTaxonomy = [];
let currentProductFilter = 'ALL';
let currentSearchQuery = '';
let currentSelectedL1 = '';

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  initSearch();
  initFilterChips();
  initRefresh();
  
  // 데이터 동기화
  fetchDashboardData();
  fetchCompanyData();
});

/* ================= 1. 데이터 호출 (특허로 Live & 사내 DB) ================= */
async function fetchDashboardData() {
  try {
    const res = await fetch('/api/dashboard/executive-summary');
    const result = await res.json();
    if (result.success && result.data) {
      renderKpis(result.data.kpis);
      renderPipeline(result.data.pipeline);
      document.getElementById('liveStatusBadge').innerHTML = `
        <span class="pulse-dot"></span>
        <span class="status-text">특허로 Live 정상 연동</span>
      `;
    }
  } catch (err) {
    console.error('Failed to fetch executive summary:', err);
    document.getElementById('liveStatusBadge').innerHTML = `
      <span class="pulse-dot" style="background:#e74c3c; box-shadow:0 0 8px #e74c3c;"></span>
      <span class="status-text" style="color:#e74c3c;">Live 동기화 대기중</span>
    `;
  }
}

async function fetchCompanyData() {
  try {
    // 1. 클러스터
    const resClusters = await fetch('/api/company/clusters');
    const jsonClusters = await resClusters.json();
    if (jsonClusters.success) {
      allClusters = jsonClusters.data;
      renderClusters(allClusters);
    }

    // 2. 제품군
    const resProducts = await fetch('/api/company/products');
    const jsonProducts = await resProducts.json();
    if (jsonProducts.success) {
      allProducts = jsonProducts.data;
      renderProducts(allProducts);
    }

    // 3. 기술분류
    const resTaxonomy = await fetch('/api/company/taxonomy');
    const jsonTaxonomy = await resTaxonomy.json();
    if (jsonTaxonomy.success) {
      allTaxonomy = jsonTaxonomy.data;
      renderTaxonomyTree(allTaxonomy);
    }
  } catch (err) {
    console.error('Failed to fetch company data:', err);
  }
}

/* ================= 2. KPI 및 파이프라인 렌더링 ================= */
function renderKpis(kpis) {
  if (!kpis) return;
  animateValue('kpiTotal', kpis.totalValidRights || kpis.totalHoldings || 1248);
  animateValue('kpiApp', kpis.application || kpis.applicationCount || 44);
  animateValue('kpiExam', kpis.examination || kpis.examinationCount || 144);
  animateValue('kpiReg', kpis.registration || kpis.registrationCount || 986);
  animateValue('kpiGlobal', kpis.globalFamilies || kpis.globalFilingCount || 174);
}

function renderPipeline(pipe) {
  if (!pipe) return;
  animateValue('pipeApp', pipe.application || 44);
  animateValue('pipeExam', pipe.examination || 144);
  animateValue('pipeReg', pipe.registration || 986);
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 600;
  const startTime = performance.now();

  function update(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuad = 1 - (1 - progress) * (1 - progress);
    const current = Math.floor(start + (target - start) * easeOutQuad);
    el.innerText = current.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.innerText = Number(target).toLocaleString();
    }
  }
  requestAnimationFrame(update);
}

/* ================= 3. 6대 전략 클러스터 렌더링 ================= */
function renderClusters(clusters) {
  const container = document.getElementById('clusterGrid');
  if (!container) return;

  container.innerHTML = clusters.map(c => `
    <div class="cluster-card">
      <div>
        <div class="cluster-card-top">
          <h3 class="cluster-name">${escapeHtml(c.name)}</h3>
          <span class="cluster-weight-badge">가중치 ${Math.round(c.weight * 100)}%</span>
        </div>
        <p class="cluster-desc">${escapeHtml(c.desc)}</p>
        <div class="cluster-kpi-box">
          <span class="cluster-kpi-label"><i class="fa-solid fa-chart-line"></i> 핵심 목표 KPI</span>
          <span class="cluster-kpi-val">${escapeHtml(c.kpi)}</span>
        </div>
      </div>
      <div class="cluster-footer">
        <span class="cluster-family-stat">특허 패밀리 <strong>${c.family_count || c.family_ids?.length || 0}</strong>건</span>
        <span class="p-class-badge" style="background:rgba(0,168,107,0.15); color:#1de9b6;">전략우선순위</span>
      </div>
    </div>
  `).join('');
}

/* ================= 4. 31대 제품 포트폴리오 렌더링 ================= */
function renderProducts(products) {
  const container = document.getElementById('productGrid');
  if (!container) return;

  const filtered = products.filter(p => {
    // 1. 분류 필터
    if (currentProductFilter !== 'ALL' && p.entity_class !== currentProductFilter) {
      return false;
    }
    // 2. 검색어 필터
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      const matchName = (p.product_name || '').toLowerCase().includes(q);
      const matchApp = (p.application || '').toLowerCase().includes(q);
      const matchModel = (p.model_name || '').toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchApp && !matchModel && !matchNotes) return false;
    }
    return true;
  });

  document.getElementById('productCountSummary').innerText = `총 ${filtered.length}개 제품 표시 중`;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">조건에 일치하는 제품이 없습니다.</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const classLabel = {
      'CURRENT_PRODUCT': '주력제품',
      'SERVICE': '디지털서비스',
      'SPECIAL': '특수용도',
      'OPTION': '옵션패키지'
    }[p.entity_class] || p.entity_class;

    return `
      <div class="product-card" onclick="openProductDetailModal('${p.product_id}')">
        <div>
          <div class="product-card-head">
            <h4 class="p-name">${escapeHtml(p.product_name)}</h4>
            <span class="p-class-badge">${classLabel}</span>
          </div>
          <p class="p-app-desc">${escapeHtml(p.application || p.notes || '용도 정의')} - ${escapeHtml(p.speed_range || '')}</p>
          <div class="p-meta-tags">
            ${p.machine_room_type ? `<span class="p-tag">${escapeHtml(p.machine_room_type)}</span>` : ''}
            ${p.active_feature_count ? `<span class="p-tag">${p.active_feature_count} Features</span>` : ''}
          </div>
        </div>
        <div class="product-card-foot">
          <span>연계 특허 패밀리</span>
          <span class="p-family-cnt"><strong>${p.total_family_count || 0}</strong>건</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ================= 5. 사내 134개 기술분류(Taxonomy) 트리 렌더링 ================= */
function renderTaxonomyTree(taxonomy) {
  const l1ListContainer = document.getElementById('taxonomyL1List');
  if (!l1ListContainer) return;

  // L1 그룹핑
  const l1Groups = {};
  taxonomy.forEach(t => {
    const l1 = t.category_l1 || '기타';
    if (!l1Groups[l1]) l1Groups[l1] = [];
    l1Groups[l1].push(t);
  });

  const l1Keys = Object.keys(l1Groups);
  if (l1Keys.length === 0) return;

  if (!currentSelectedL1 || !l1Groups[currentSelectedL1]) {
    currentSelectedL1 = l1Keys[0];
  }

  // L1 메뉴 렌더링
  l1ListContainer.innerHTML = l1Keys.map(l1 => `
    <div class="l1-item ${l1 === currentSelectedL1 ? 'active' : ''}" onclick="selectTaxonomyL1('${escapeHtml(l1)}')">
      <span>${escapeHtml(l1)}</span>
      <span class="l1-item-cnt">${l1Groups[l1].length}건</span>
    </div>
  `).join('');

  renderTaxonomyDetail(l1Groups[currentSelectedL1] || []);
}

function selectTaxonomyL1(l1) {
  currentSelectedL1 = l1;
  renderTaxonomyTree(allTaxonomy);
}

function renderTaxonomyDetail(items) {
  const detailContainer = document.getElementById('taxonomyDetailView');
  if (!detailContainer) return;

  // L2 그룹핑
  const l2Groups = {};
  items.forEach(t => {
    const l2 = t.category_l2 || '일반';
    if (!l2Groups[l2]) l2Groups[l2] = [];
    l2Groups[l2].push(t);
  });

  detailContainer.innerHTML = Object.keys(l2Groups).map(l2 => `
    <div class="tax-l2-group">
      <h4 class="tax-l2-title"><i class="fa-solid fa-angle-right"></i> ${escapeHtml(l2)} <span style="font-size:0.75rem; color:var(--text-muted);">(${l2Groups[l2].length}개 항목)</span></h4>
      <div class="tax-l3-grid">
        ${l2Groups[l2].map(t => `
          <div class="tax-l3-card">
            <div class="tax-l3-name">${escapeHtml(t.category_l3)}</div>
            <div class="tax-l3-scope">${escapeHtml(t.representative_scope || '권리 범위 정의')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/* ================= 6. 제품 상세 모달 ================= */
async function openProductDetailModal(productId) {
  try {
    const res = await fetch(`/api/company/products/${productId}`);
    const json = await res.json();
    if (!json.success || !json.data) return;

    const data = json.data;
    const p = data.product;

    document.getElementById('modalProductName').innerText = p.product_name;
    document.getElementById('modalProductSub').innerText = p.product_name_en ? `${p.product_name_en} — ${p.model_name || ''}` : p.model_name || '';
    document.getElementById('modalProductBadge').innerText = p.entity_class;
    document.getElementById('modalApp').innerText = p.application || 'N/A';
    document.getElementById('modalMR').innerText = p.machine_room_type || 'N/A';
    document.getElementById('modalSpeed').innerText = p.speed_range || 'N/A';
    document.getElementById('modalFeatureCnt').innerText = `${data.featureCount || 0}개 매핑`;

    const featureListContainer = document.getElementById('modalFeatureList');
    if (data.features && data.features.length > 0) {
      featureListContainer.innerHTML = data.features.map(f => `
        <div class="feat-card">
          <div class="feat-head">
            <span class="feat-name"><i class="fa-solid fa-cube"></i> ${escapeHtml(f.object_name || f.feature_id)}</span>
            <span class="feat-ev-badge">증거 등급 ${f.evidence_grade || 'A'} (${f.representative_claim_type || '독립항'})</span>
          </div>
          <div class="feat-patent-title">
            <strong>[대표 특허]</strong> ${escapeHtml(f.representative_patent_title || '특허 명칭')} (${f.representative_patent_id})
          </div>
          ${f.representative_claim_excerpt ? `
            <div class="feat-claim-excerpt">
              <strong>청구항 ${f.representative_claim_no || 1}항 발췌:</strong> "${escapeHtml(f.representative_claim_excerpt)}"
            </div>
          ` : ''}
        </div>
      `).join('');
    } else {
      featureListContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">연계된 세부 피처가 없습니다.</div>`;
    }

    document.getElementById('productModalBackdrop').classList.add('active');
  } catch (err) {
    console.error('Failed to open product modal:', err);
  }
}

/* ================= 7. 이벤트 및 UI 초기화 ================= */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function initModals() {
  // 제품 모달 닫기
  document.getElementById('btnCloseProductModal').addEventListener('click', () => {
    document.getElementById('productModalBackdrop').classList.remove('active');
  });
  document.getElementById('productModalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('productModalBackdrop').classList.remove('active');
    }
  });

  // 설정 모달
  const cfgModal = document.getElementById('configModalBackdrop');
  document.getElementById('btnConfig').addEventListener('click', () => {
    cfgModal.classList.add('active');
  });
  document.getElementById('btnCloseConfigModal').addEventListener('click', () => {
    cfgModal.classList.remove('active');
  });
  document.getElementById('btnCancelConfig').addEventListener('click', () => {
    cfgModal.classList.remove('active');
  });
  cfgModal.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) cfgModal.classList.remove('active');
  });

  document.getElementById('btnSaveConfig').addEventListener('click', async () => {
    const applicantCode = document.getElementById('cfgApplicantCode').value;
    const ctfctKey = document.getElementById('cfgCtfctKey').value;
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantCode, ctfctKey })
      });
      alert('특허로 설정이 저장되었습니다. 실시간 동기화를 시작합니다.');
      cfgModal.classList.remove('active');
      fetchDashboardData();
    } catch (e) {
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  });
}

function initSearch() {
  const searchInput = document.getElementById('portfolioSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      renderProducts(allProducts);
    });
  }
}

function initFilterChips() {
  const chips = document.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentProductFilter = chip.dataset.class;
      renderProducts(allProducts);
    });
  });
}

function initRefresh() {
  const refreshBtn = document.getElementById('btnRefresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.querySelector('i').classList.add('fa-spin');
      Promise.all([fetchDashboardData(), fetchCompanyData()]).then(() => {
        setTimeout(() => {
          refreshBtn.querySelector('i').classList.remove('fa-spin');
        }, 500);
      });
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

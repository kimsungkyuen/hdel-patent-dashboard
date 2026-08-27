// kipoService.js - 특허로 REST Web API 통신 클라이언트 모듈
const https = require('https');
const http = require('http');
const querystring = require('querystring');
const { URL } = require('url');
const { mockApplications, mockRegistrations, mockDeadlines, mockTrials } = require('./mockData');

const KIPO_BASE_URL = 'https://www.patent.go.kr/smart/webservice/';

// 시스템 기본 설정 (사용자가 웹 UI에서 동적으로 변경 가능)
let currentConfig = {
  isDemoMode: true,
  apagtCd: "130000002156", // 기본 샘플 특허고객번호
  ctfctKey: ""             // 특허업무용 인증서 전자서명키
};

/**
 * 특허로 API 직접 호출 헬퍼 함수
 */
function callKipoApi(apiUri, params) {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = new URL(apiUri, KIPO_BASE_URL).toString();
      const postData = querystring.stringify(params);

      const urlObj = new URL(fullUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + '?' + postData,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'KIPO-IPMS-Client/2.0'
        },
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ procResult: "false", errorType: "PARSE_ERR", raw: data });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('KIPO API Timeout (10s)'));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 설정 업데이트 및 가져오기
 */
function getConfig() {
  return { ...currentConfig };
}

function updateConfig(newConfig) {
  currentConfig = { ...currentConfig, ...newConfig };
  return currentConfig;
}

/**
 * 1. 출원 현황 목록 조회 (apl/readApplNoInfo.do)
 */
async function getApplications(options = {}) {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    let list = [...mockApplications];
    if (options.query) {
      const q = options.query.toLowerCase();
      list = list.filter(item => 
        item.applNo.includes(q) || 
        item.inventTitle.toLowerCase().includes(q) ||
        (item.invntrNm && item.invntrNm.toLowerCase().includes(q))
      );
    }
    if (options.rightType && options.rightType !== 'ALL') {
      list = list.filter(item => item.rightType === options.rightType);
    }
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      totalCount: list.length,
      resultListData: list
    };
  }

  // 실시간 KIPO API 호출
  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      applierNo: currentConfig.apagtCd,
      sortType: options.sortType || "1",
      pagePerRow: options.pagePerRow || "50",
      pageNo: options.pageNo || "1"
    };
    if (options.period) params.period = options.period;

    const res = await callKipoApi('apl/readApplNoInfo.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    console.error('KIPO API getApplications Error:', err.message);
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      totalCount: mockApplications.length,
      resultListData: mockApplications
    };
  }
}

/**
 * 2. 출원 상세정보 조회 (apl/readApplBasicInfo.do)
 */
async function getApplicationDetail(applNo) {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    const item = mockApplications.find(a => a.applNo === applNo) || mockApplications[0];
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      resultData: item
    };
  }

  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      applNo: applNo
    };
    const res = await callKipoApi('apl/readApplBasicInfo.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      resultData: mockApplications.find(a => a.applNo === applNo) || mockApplications[0]
    };
  }
}

/**
 * 3. 등록 권리 목록 조회 (rgt/readRgstNoInfo.do)
 */
async function getRegistrations(options = {}) {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    let list = [...mockRegistrations];
    if (options.query) {
      const q = options.query.toLowerCase();
      list = list.filter(item => 
        item.rgstNo.includes(q) || 
        item.invntTtl.toLowerCase().includes(q) ||
        item.applNo.includes(q)
      );
    }
    if (options.rightType && options.rightType !== 'ALL') {
      list = list.filter(item => item.rightType === options.rightType);
    }
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      totalCount: list.length,
      resultListData: list
    };
  }

  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      apAgtCd: currentConfig.apagtCd,
      sortType: options.sortType || "1",
      pagePerRow: options.pagePerRow || "50",
      pageNo: options.pageNo || "1"
    };
    const res = await callKipoApi('rgt/readRgstNoInfo.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      totalCount: mockRegistrations.length,
      resultListData: mockRegistrations
    };
  }
}

/**
 * 4. 등록 상세정보 조회 (rgt/readRgstBasicInfo.do)
 */
async function getRegistrationDetail(rgstNo) {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    const item = mockRegistrations.find(r => r.rgstNo === rgstNo) || mockRegistrations[0];
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      resultData: item
    };
  }

  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      rgstNo: rgstNo
    };
    const res = await callKipoApi('rgt/readRgstBasicInfo.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      resultData: mockRegistrations.find(r => r.rgstNo === rgstNo) || mockRegistrations[0]
    };
  }
}

/**
 * 5. 마감기한 및 통지서 모니터링 (applDeadline/readApplNoticeDeadlineInfoByApAgtCd.do)
 */
async function getDeadlines() {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      totalCount: mockDeadlines.length,
      resultListData: mockDeadlines
    };
  }

  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      pagePerRow: "50",
      pageNo: "1"
    };
    const res = await callKipoApi('applDeadline/readApplNoticeDeadlineInfoByApAgtCd.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      resultListData: mockDeadlines
    };
  }
}

/**
 * 6. 심판 현황 목록 (trial/readTrialNoInfo.do)
 */
async function getTrials() {
  if (currentConfig.isDemoMode || !currentConfig.ctfctKey) {
    return {
      isDemo: true,
      procResult: "true",
      errorType: "000",
      totalCount: mockTrials.length,
      resultListData: mockTrials
    };
  }

  try {
    const params = {
      ctfctKey: currentConfig.ctfctKey,
      apagtCd: currentConfig.apagtCd,
      applierNo: currentConfig.apagtCd,
      sortType: "1",
      pagePerRow: "50",
      pageNo: "1"
    };
    const res = await callKipoApi('trial/readTrialNoInfo.do', params);
    return { isDemo: false, ...res };
  } catch (err) {
    return {
      isDemo: true,
      procResult: "fallback",
      errorMsg: err.message,
      resultListData: mockTrials
    };
  }
}

/**
 * 7. 대시보드 종합 통계 요약 (Overview KPI & Distribution)
 */
async function getDashboardSummary() {
  const apps = await getApplications();
  const rgsts = await getRegistrations();
  const dls = await getDeadlines();
  const trls = await getTrials();

  const appList = apps.resultListData || [];
  const rgstList = rgsts.resultListData || [];
  const dlList = dls.resultListData || [];
  const trlList = trls.resultListData || [];

  // 권리 유형별 분포 계산
  const distribution = {
    patent: appList.filter(a => a.rightType === '특허').length + rgstList.filter(r => r.rightType === '특허').length,
    utility: appList.filter(a => a.rightType === '실용신안').length + rgstList.filter(r => r.rightType === '실용신안').length,
    design: appList.filter(a => a.rightType === '디자인').length + rgstList.filter(r => r.rightType === '디자인').length,
    trademark: appList.filter(a => a.rightType === '상표').length + rgstList.filter(r => r.rightType === '상표').length
  };

  return {
    kpi: {
      totalApplications: appList.length,
      totalRegistrations: rgstList.length,
      activeTrials: trlList.length,
      urgentDeadlines: dlList.filter(d => d.daysLeft <= 30 || d.urgency === 'CRITICAL' || d.urgency === 'HIGH').length
    },
    distribution,
    recentDeadlines: dlList.slice(0, 5),
    recentApplications: appList.slice(0, 5),
    recentRegistrations: rgstList.slice(0, 5)
  };
}

module.exports = {
  getConfig,
  updateConfig,
  getApplications,
  getApplicationDetail,
  getRegistrations,
  getRegistrationDetail,
  getDeadlines,
  getTrials,
  getDashboardSummary
};

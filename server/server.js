// server.js - 순수 Node.js 내장 모듈 기반 초경량/고신뢰성 IPMS 서버
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const kipoService = require('./kipoService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

// 요청 바디 파싱 헬퍼
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// JSON 응답 헬퍼
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS 프리플라이트 처리
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ================= API ENDPOINTS =================
  if (pathname.startsWith('/api/')) {
    try {
      // 1. 경영진 보고용 종합 요약 (Executive Summary)
      if (pathname === '/api/dashboard/executive-summary' && method === 'GET') {
        const summary = await kipoService.getExecutiveSummary();
        return sendJson(res, 200, { success: true, data: summary.data || summary });
      }

      // 기존 대시보드 종합 요약 (호환성 유지)
      if (pathname === '/api/dashboard/summary' && method === 'GET') {
        const summary = await kipoService.getExecutiveSummary();
        return sendJson(res, 200, { success: true, data: summary.data || summary });
      }

      // 1-1. 기술분류 매핑 API (조회 및 저장)
      if (pathname === '/api/tech-categories') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: kipoService.getAllTechCategories() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          if (body.appNo && body.category) {
            const result = kipoService.updateTechCategory(body.appNo, body.category, body.subCategory || '');
            return sendJson(res, 200, { success: true, data: result, message: "기술분류가 매핑되었습니다." });
          }
          return sendJson(res, 400, { success: false, error: "appNo and category are required" });
        }
      }

      // 2. 출원 현황 목록
      if (pathname === '/api/applications' && method === 'GET') {
        const result = await kipoService.getApplications(parsedUrl.query);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 3. 출원 상세
      if (pathname.startsWith('/api/applications/') && method === 'GET') {
        const applNo = pathname.replace('/api/applications/', '');
        const result = await kipoService.getApplicationDetail(applNo);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 4. 등록 권리 목록
      if (pathname === '/api/registrations' && method === 'GET') {
        const result = await kipoService.getRegistrations(parsedUrl.query);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 5. 등록 상세
      if (pathname.startsWith('/api/registrations/') && method === 'GET') {
        const rgstNo = pathname.replace('/api/registrations/', '');
        const result = await kipoService.getRegistrationDetail(rgstNo);
        return sendJson(res, 200, { success: true, data: result });
      }

      // 6. 마감기한 / 통지서 현황
      if (pathname === '/api/deadlines' && method === 'GET') {
        const result = await kipoService.getDeadlines();
        return sendJson(res, 200, { success: true, data: result });
      }

      // 7. 심판 현황
      if (pathname === '/api/trials' && method === 'GET') {
        const result = await kipoService.getTrials();
        return sendJson(res, 200, { success: true, data: result });
      }

      // 8. 설정 조회 및 변경
      if (pathname === '/api/config') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: kipoService.getConfig() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const updated = kipoService.updateConfig(body);
          return sendJson(res, 200, { success: true, data: updated, message: "설정이 성공적으로 저장되었습니다." });
        }
      }

      // 8-1. 핵심 Focus 기술분야 관리자 설정 API
      if (pathname === '/api/config/key-focus') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: kipoService.getKeyFocus() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          if (body && Array.isArray(body.keyFocusList)) {
            const updated = kipoService.updateKeyFocus(body.keyFocusList);
            return sendJson(res, 200, { success: true, data: updated, message: "핵심 기술분야 설정이 저장되었습니다." });
          }
          return sendJson(res, 400, { success: false, error: "keyFocusList array is required" });
        }
      }

      // 9. 사내 제품군 현황 API
      if (pathname === '/api/company/products' && method === 'GET') {
        const products = kipoService.getCompanyProducts();
        return sendJson(res, 200, { success: true, data: products });
      }

      // 10. 사내 특정 제품 상세 및 피처/특허패밀리 API
      if (pathname.startsWith('/api/company/products/') && method === 'GET') {
        const productId = pathname.replace('/api/company/products/', '');
        const detail = kipoService.getProductDetail(productId);
        if (!detail) {
          return sendJson(res, 404, { success: false, error: 'Product not found' });
        }
        return sendJson(res, 200, { success: true, data: detail });
      }

      // 11. 사내 6대 전략 클러스터 API
      if (pathname === '/api/company/clusters' && method === 'GET') {
        const clusters = kipoService.getStrategicClusters();
        return sendJson(res, 200, { success: true, data: clusters });
      }

      // 12. 사내 표준 134개 기술분류(Taxonomy) API
      if (pathname === '/api/company/taxonomy' && method === 'GET') {
        const taxonomy = kipoService.getCompanyTaxonomy();
        return sendJson(res, 200, { success: true, data: taxonomy });
      }

      // 알 수 없는 API 엔드포인트
      return sendJson(res, 404, { success: false, error: 'API route not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ================= 정적 파일 서빙 =================
  let targetFile = 'index.html';
  if (pathname === '/' || pathname === '/index.html') {
    targetFile = 'index.html';
  } else if (pathname === '/legacy') {
    targetFile = 'index_legacy.html';
  } else if (pathname === '/v3') {
    targetFile = 'dashboard_v3.html';
  } else if (pathname === '/atlas') {
    targetFile = 'atlas.html';
  } else {
    targetFile = pathname.startsWith('/') ? pathname.substring(1) : pathname;
  }

  let filePath = path.join(PUBLIC_DIR, targetFile);

  // 상위 경로 탐색 방지 (Security)
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 발생 시 index.html 서빙 (SPA 지원)
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 현대엘리베이터 IPMS 특허 현황 모니터링 포털 실행 완료!`);
  console.log(`🌐 [기본 대시보드]: http://localhost:${PORT}/`);
  console.log(`====================================================`);
});

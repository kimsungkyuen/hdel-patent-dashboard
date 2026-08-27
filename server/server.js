const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const kipoService = require('./kipoService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        return sendJson(res, 200, { success: true, data: summary });
      }

      // 기존 대시보드 종합 요약 (호환성 유지)
      if (pathname === '/api/dashboard/summary' && method === 'GET') {
        const summary = await kipoService.getExecutiveSummary();
        return sendJson(res, 200, { success: true, data: summary });
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
          return sendJson(res, 400, { success: false, message: "appNo와 category는 필수 항목입니다." });
        }
      }

      // 2. 출원 목록 조회
      if (pathname === '/api/kipo/applications' && method === 'GET') {
        const list = await kipoService.getApplications(parsedUrl.query);
        return sendJson(res, 200, { success: true, data: list });
      }

      // 3. 출원 상세정보 조회
      if (pathname.startsWith('/api/kipo/applications/') && method === 'GET') {
        const applNo = pathname.replace('/api/kipo/applications/', '');
        const detail = await kipoService.getApplicationDetail(decodeURIComponent(applNo));
        return sendJson(res, 200, { success: true, data: detail });
      }

      // 4. 등록 권리 목록 조회
      if (pathname === '/api/kipo/registrations' && method === 'GET') {
        const list = await kipoService.getRegistrations(parsedUrl.query);
        return sendJson(res, 200, { success: true, data: list });
      }

      // 5. 등록 상세정보 조회
      if (pathname.startsWith('/api/kipo/registrations/') && method === 'GET') {
        const rgstNo = pathname.replace('/api/kipo/registrations/', '');
        const detail = await kipoService.getRegistrationDetail(decodeURIComponent(rgstNo));
        return sendJson(res, 200, { success: true, data: detail });
      }

      // 6. 마감기한 및 통지서 모니터링
      if (pathname === '/api/kipo/deadlines' && method === 'GET') {
        const deadlines = await kipoService.getDeadlines();
        return sendJson(res, 200, { success: true, data: deadlines });
      }

      // 7. 심판 현황
      if (pathname === '/api/kipo/trials' && method === 'GET') {
        const trials = await kipoService.getTrials();
        return sendJson(res, 200, { success: true, data: trials });
      }

      // 8. 환경설정 조회 및 저장
      if (pathname === '/api/kipo/config') {
        if (method === 'GET') {
          return sendJson(res, 200, { success: true, data: kipoService.getConfig() });
        }
        if (method === 'POST') {
          const body = await parseBody(req);
          const updated = kipoService.updateConfig(body);
          return sendJson(res, 200, { success: true, data: updated, message: "환경설정이 저장되었습니다." });
        }
      }

      // 9. 실시간 연결 테스트
      if (pathname === '/api/kipo/test-connection' && method === 'POST') {
        const body = await parseBody(req);
        if (body.apagtCd) kipoService.updateConfig(body);
        const testRes = await kipoService.getApplications({ pagePerRow: "1" });
        return sendJson(res, 200, {
          success: testRes.procResult === "true" || testRes.procResult === true,
          data: testRes,
          message: testRes.procResult === "true" ? "특허청 웹서비스 정상 연결 성공" : "연결 응답 확인 필요"
        });
      }

      return sendJson(res, 404, { success: false, error: "API Endpoint Not Found" });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ================= STATIC FILES =================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath)) {
    const rootPath = path.join(__dirname, '..', pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(rootPath)) {
      filePath = rootPath;
    } else {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error loading static file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` HDEL Patent Executive Monitoring Dashboard Server   `);
  console.log(` Running on: http://localhost:${PORT}               `);
  console.log(`====================================================`);
});

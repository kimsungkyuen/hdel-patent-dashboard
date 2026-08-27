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
      // 1. 대시보드 종합 요약
      if (pathname === '/api/dashboard/summary' && method === 'GET') {
        const summary = await kipoService.getDashboardSummary();
        return sendJson(res, 200, { success: true, data: summary });
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

      // 알 수 없는 API 엔드포인트
      return sendJson(res, 404, { success: false, error: 'API route not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // ================= 정적 파일 서빙 =================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // 상위 경로 탐색 방지 (Security)
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
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
  console.log(`🚀 특허로 REST-API 연동 당사 IPMS 시스템 실행 완료!`);
  console.log(`🌐 접속 주소: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

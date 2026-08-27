// mockData.js - 시연 및 테스트용 특허/IP 데이터셋
const mockApplications = [
  {
    applNo: "1020240012345",
    applDate: "20240115",
    inventTitle: "인공지능 기반 지능형 특허 문서 자동 분석 및 분류 시스템",
    rightType: "특허",
    applicantNm: "(주)현대기술연구원",
    repApltNm: "(주)현대기술연구원",
    invntrNm: "홍길동, 김철수",
    repAgtNm: "특허법인 에이아이",
    exmnStartDate: "20240620",
    exmnStartExpDate: "20240620",
    lstDspslNm: "심사진행중 (1차 의견제출통지서 발송)",
    rgstLstDspslNm: "출원계속",
    openNo: "1020240056789",
    openDate: "20240810",
    publicNo: "",
    publicDate: "",
    registNo: "",
    registDate: "",
    ipcCd: "G06F 40/20",
    exmnrNm: "이심사",
    exmnrDept: "인공지능빅데이터심사과",
    exmnrTelno: "042-481-8899",
    history: [
      { rcptSendDate: "20240115", rcptSendDocNm: "특허출원서", procStDesc: "접수완료", rcptSendNo: "1-1-2024-0012345-01" },
      { rcptSendDate: "20240115", rcptSendDocNm: "심사청구서", procStDesc: "접수완료", rcptSendNo: "1-1-2024-0012345-02" },
      { rcptSendDate: "20240530", rcptSendDocNm: "출원공개공보", procStDesc: "공개완료", rcptSendNo: "10-2024-0056789" },
      { rcptSendDate: "20240715", rcptSendDocNm: "의견제출통지서 (의견서/보정서 제출요구)", procStDesc: "발송완료", rcptSendNo: "9-5-2024-0123456-78" }
    ]
  },
  {
    applNo: "1020230089123",
    applDate: "20230710",
    inventTitle: "친환경 전기차 배터리 열관리 최적화 냉각 모듈 장치",
    rightType: "특허",
    applicantNm: "(주)현대모빌리티",
    repApltNm: "(주)현대모빌리티",
    invntrNm: "박영수, 이정우",
    repAgtNm: "특허법인 미래",
    exmnStartDate: "20231215",
    exmnStartExpDate: "20231215",
    lstDspslNm: "등록결정",
    rgstLstDspslNm: "설정등록대기",
    openNo: "1020240003412",
    openDate: "20240122",
    publicNo: "",
    publicDate: "",
    registNo: "",
    registDate: "",
    ipcCd: "H01M 10/613",
    exmnrNm: "김그린",
    exmnrDept: "이차전지심사과",
    exmnrTelno: "042-481-7744",
    history: [
      { rcptSendDate: "20230710", rcptSendDocNm: "특허출원서", procStDesc: "접수완료", rcptSendNo: "1-1-2023-0089123-01" },
      { rcptSendDate: "20240122", rcptSendDocNm: "출원공개공보", procStDesc: "공개완료", rcptSendNo: "10-2024-0003412" },
      { rcptSendDate: "20240801", rcptSendDocNm: "등록결정서", procStDesc: "발송완료", rcptSendNo: "9-5-2024-0899123-11" }
    ]
  },
  {
    applNo: "4020240019874",
    applDate: "20240218",
    inventTitle: "ECOHYBRID (브랜드 상표)",
    rightType: "상표",
    applicantNm: "(주)현대코퍼레이션",
    repApltNm: "(주)현대코퍼레이션",
    invntrNm: "-",
    repAgtNm: "리앤목 특허법인",
    exmnStartDate: "20240810",
    exmnStartExpDate: "20240810",
    lstDspslNm: "출원공고",
    rgstLstDspslNm: "출원계속",
    openNo: "",
    openDate: "",
    publicNo: "4020240087654",
    publicDate: "20240814",
    registNo: "",
    registDate: "",
    ipcCd: "09류 (전기전자/배터리)",
    exmnrNm: "정상표",
    exmnrDept: "상표심사과",
    exmnrTelno: "042-481-5522",
    history: [
      { rcptSendDate: "20240218", rcptSendDocNm: "상표등록출원서", procStDesc: "접수완료", rcptSendNo: "1-1-2024-0019874-01" },
      { rcptSendDate: "20240814", rcptSendDocNm: "출원공고결정서", procStDesc: "발송완료", rcptSendNo: "9-5-2024-0087654-22" }
    ]
  },
  {
    applNo: "3020240005432",
    applDate: "20240305",
    inventTitle: "도심 항공 모빌리티(UAM)용 수직 이착륙기 캐빈 디자인",
    rightType: "디자인",
    applicantNm: "(주)현대기술연구원",
    repApltNm: "(주)현대기술연구원",
    invntrNm: "최민지",
    repAgtNm: "특허법인 에이아이",
    exmnStartDate: "20240510",
    exmnStartExpDate: "20240510",
    lstDspslNm: "심사진행중",
    rgstLstDspslNm: "출원계속",
    openNo: "",
    openDate: "",
    publicNo: "",
    publicDate: "",
    registNo: "",
    registDate: "",
    ipcCd: "D12-07 (항공기/모빌리티)",
    exmnrNm: "강디자인",
    exmnrDept: "디자인심사과",
    exmnrTelno: "042-481-3311",
    history: [
      { rcptSendDate: "20240305", rcptSendDocNm: "디자인등록출원서", procStDesc: "접수완료", rcptSendNo: "1-1-2024-0005432-01" }
    ]
  },
  {
    applNo: "2020230004112",
    applDate: "20230912",
    inventTitle: "다목적 래치 힌지 조립체",
    rightType: "실용신안",
    applicantNm: "(주)현대모빌리티",
    repApltNm: "(주)현대모빌리티",
    invntrNm: "윤상현",
    repAgtNm: "특허법인 미래",
    exmnStartDate: "20240211",
    exmnStartExpDate: "20240211",
    lstDspslNm: "심사관보정요구",
    rgstLstDspslNm: "출원계속",
    openNo: "",
    openDate: "",
    publicNo: "",
    publicDate: "",
    registNo: "",
    registDate: "",
    ipcCd: "E05D 11/00",
    exmnrNm: "장실용",
    exmnrDept: "기계금속심사과",
    exmnrTelno: "042-481-2244",
    history: [
      { rcptSendDate: "20230912", rcptSendDocNm: "실용신안등록출원서", procStDesc: "접수완료", rcptSendNo: "1-1-2023-0004112-01" },
      { rcptSendDate: "20240720", rcptSendDocNm: "보정요구서", procStDesc: "발송완료", rcptSendNo: "9-5-2024-0041122-01" }
    ]
  }
];

const mockRegistrations = [
  {
    rgstNo: "1025896320000",
    rgstDt: "20231015",
    applNo: "1020220054321",
    applDt: "20220420",
    pubNo: "1020230154321",
    pubDt: "20231022",
    invntTtl: "수소 연료전지 스택 분리판의 표면 내식성 코팅 제조방법",
    invntTtlEng: "METHOD FOR PRODUCING SURFACE CORROSION RESISTANT COATING OF FUEL CELL BIPOLAR PLATE",
    rightType: "특허",
    rgstLstDspslNm: "등록유지(정상)",
    rgstTermDt: "20420420",
    nmKorLong: "(주)현대기술연구원",
    registrantNum: "1",
    dmndItmCnt: "8",
    annualFee: {
      currentYear: 3,
      payDt: "20231015",
      nextDueDate: "20261015",
      amount: 144000,
      status: "납부완료"
    },
    history: [
      { rsDt: "20231015", rsDocNm: "설정등록료납부서", procStCd: "등록완료", rsNo: "2-1-2023-0099881-00" },
      { rsDt: "20230910", rsDocNm: "등록결정서", procStCd: "발송완료", rsNo: "9-5-2023-0099881-01" }
    ]
  },
  {
    rgstNo: "1024512890000",
    rgstDt: "20220812",
    applNo: "1020210041289",
    applDt: "20210330",
    pubNo: "1020220124512",
    pubDt: "20220819",
    invntTtl: "자율주행 차량용 다중 라이다 센서 융합 물체 인식 알고리즘",
    invntTtlEng: "MULTI-LIDAR SENSOR FUSION OBJECT RECOGNITION ALGORITHM FOR AUTONOMOUS VEHICLE",
    rightType: "특허",
    rgstLstDspslNm: "등록유지(정상)",
    rgstTermDt: "20410330",
    nmKorLong: "(주)현대모빌리티",
    registrantNum: "1",
    dmndItmCnt: "12",
    annualFee: {
      currentYear: 4,
      payDt: "20240810",
      nextDueDate: "20250812",
      amount: 180000,
      status: "납부완료"
    },
    history: [
      { rsDt: "20240810", rsDocNm: "연차등록료납부서(4년차)", procStCd: "납부완료", rsNo: "2-1-2024-0012451-00" },
      { rsDt: "20220812", rsDocNm: "설정등록료납부서(1~3년차)", procStCd: "등록완료", rsNo: "2-1-2022-0041289-00" }
    ]
  },
  {
    rgstNo: "4018952400000",
    rgstDt: "20210518",
    applNo: "4020200021548",
    applDt: "20200210",
    pubNo: "4020210051895",
    pubDt: "20210525",
    invntTtl: "HYUNDAI SMART CONNECT (상표)",
    invntTtlEng: "HYUNDAI SMART CONNECT",
    rightType: "상표",
    rgstLstDspslNm: "등록유지(정상)",
    rgstTermDt: "20310518",
    nmKorLong: "(주)현대코퍼레이션",
    registrantNum: "1",
    dmndItmCnt: "1",
    annualFee: {
      currentYear: 5,
      payDt: "20210518",
      nextDueDate: "20310518",
      amount: 0,
      status: "10년일시납"
    },
    history: [
      { rsDt: "20210518", rsDocNm: "상표설정등록료납부서", procStCd: "등록완료", rsNo: "2-1-2021-0021548-00" }
    ]
  },
  {
    rgstNo: "3011245800000",
    rgstDt: "20230214",
    applNo: "3020220011458",
    applDt: "20220311",
    pubNo: "3020230021124",
    pubDt: "20230221",
    invntTtl: "스마트 모빌리티용 인체공학적 조향 핸들",
    invntTtlEng: "STEERING WHEEL FOR SMART MOBILITY",
    rightType: "디자인",
    rgstLstDspslNm: "등록유지(정상)",
    rgstTermDt: "20420311",
    nmKorLong: "(주)현대모빌리티",
    registrantNum: "1",
    dmndItmCnt: "1",
    annualFee: {
      currentYear: 3,
      payDt: "20230214",
      nextDueDate: "20260214",
      amount: 72000,
      status: "납부완료"
    },
    history: [
      { rsDt: "20230214", rsDocNm: "디자인설정등록료납부서", procStCd: "등록완료", rsNo: "2-1-2023-0011458-00" }
    ]
  }
];

const mockDeadlines = [
  {
    id: "DL-001",
    applNo: "1020240012345",
    title: "인공지능 기반 지능형 특허 문서 자동 분석 및 분류 시스템",
    docName: "의견제출통지서 (1차 거절이유 통지)",
    noticeNo: "9-5-2024-0123456-78",
    mailDt: "20240715",
    sbmtDueDt: "20240915",
    type: "출원심사",
    actionRequired: "의견서 및 보정서 작성/제출",
    urgency: "HIGH",
    daysLeft: 19
  },
  {
    id: "DL-002",
    applNo: "1020230089123",
    title: "친환경 전기차 배터리 열관리 최적화 냉각 모듈 장치",
    docName: "등록결정서 발송 (설정등록료 납부기한)",
    noticeNo: "9-5-2024-0899123-11",
    mailDt: "20240801",
    sbmtDueDt: "20241101",
    type: "설정등록",
    actionRequired: "설정등록료 (1~3년차) 납부",
    urgency: "MEDIUM",
    daysLeft: 66
  },
  {
    id: "DL-003",
    applNo: "2020230004112",
    title: "다목적 래치 힌지 조립체",
    docName: "보정요구서",
    noticeNo: "9-5-2024-0041122-01",
    mailDt: "20240720",
    sbmtDueDt: "20240830",
    type: "출원심사",
    actionRequired: "도면 및 명세서 보정서 제출",
    urgency: "CRITICAL",
    daysLeft: 3
  },
  {
    id: "DL-004",
    applNo: "1020210041289",
    rgstNo: "1024512890000",
    title: "자율주행 차량용 다중 라이다 센서 융합 물체 인식 알고리즘",
    docName: "연차등록료 납부안내 (5년차 납부 도래)",
    noticeNo: "9-5-2024-0099412-05",
    mailDt: "20240805",
    sbmtDueDt: "20250812",
    type: "연차등록료",
    actionRequired: "5년차 연차등록료 납부",
    urgency: "NORMAL",
    daysLeft: 350
  }
];

const mockTrials = [
  {
    trlNo: "2024당001245",
    hanGulTrlNo: "2024당1245 (권리범위확인심판)",
    applNo: "1020220054321",
    rgstNo: "1025896320000",
    invntTtl: "수소 연료전지 스택 분리판의 표면 내식성 코팅 제조방법",
    trlDmndDt: "20240410",
    trlStDesc: "심리진행중",
    trlStCd: "02",
    rqstrNmList: "경쟁사 (A사)",
    dfndTrNmList: "(주)현대기술연구원",
    mainJdgNm: "박심판",
    chfJdg1Nm: "최수석심판장",
    dmndPurp: "피청구인의 특허발명은 청구인의 실시제품과 권리범위가 상이하여 그 권리범위에 속하지 아니한다는 심결을 구함",
    trlDcsnDesc: "",
    trlDcsnDt: ""
  },
  {
    trlNo: "2023원008912",
    hanGulTrlNo: "2023원8912 (거절결정불복심판)",
    applNo: "1020210099887",
    rgstNo: "",
    invntTtl: "차세대 전고체 배터리 고체전해질 조성물 및 그 제조공정",
    trlDmndDt: "20231120",
    trlStDesc: "심판청구인용(승소)",
    trlStCd: "09",
    rqstrNmList: "(주)현대기술연구원",
    dfndTrNmList: "특허청장",
    mainJdgNm: "김심판관",
    chfJdg1Nm: "이심판장",
    dmndPurp: "원결정을 취소하고 다시 특허결정을 구함",
    trlDcsnDesc: "특허청 심사관의 거절결정을 취소하고 특허심사부로 환송함",
    trlDcsnDt: "20240615"
  }
];

module.exports = {
  mockApplications,
  mockRegistrations,
  mockDeadlines,
  mockTrials
};

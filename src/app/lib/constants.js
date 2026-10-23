export const SERVER_LIST = [
  { id: "cain", name: "카인" },
  { id: "diregie", name: "디레지에" },
  { id: "siroco", name: "시로코" },
  { id: "prey", name: "프레이" },
  { id: "casillas", name: "카시야스" },
  { id: "hilder", name: "힐더" },
  { id: "anton", name: "안톤" },
  { id: "bakal", name: "바칼" }
];

export const ADVANCED_DUNGEONS = [
  { name: '최후의 과업', fame: 108921 },
  { name: '배교자의 성', fame: 101853 },
  { name: '별거북 대서고', fame: 91582 },
  { name: '해방된 흉몽', fame: 71179 },
  { name: '죽음의 여신전', fame: 55950 },
  { name: '애쥬어 메인', fame: 44929 },
  { name: '달이 잠긴 호수', fame: 34749 }
];

export const RAIDS = [
  { name: '이내 황혼전', fame: 72688 }
];

export const APOCALYPSE = [
  { name: '2단계', fame: 105881 },
  { name: '1단계', fame: 98171 },
  { name: '매칭', fame: 73993 }
];

// 미카엘라 레이드: 매칭은 명성 기준(초과), 일반/하드는 역할군별 장비·버프 점수 기준(초과)으로 진입 가능.
export const MICHAELA_TIERS = [
  { key: 'matching', name: '매칭', type: 'fame', fame: 104292, strict: true },
  { key: 'normal', name: '일반', type: 'score', dealer: 180000, buffer: 115000, strict: true },
  { key: 'hard', name: '하드', type: 'score', dealer: 350000, buffer: 130000, strict: true }
];

// 디레지에 레이드: 매칭은 명성 기준(이상), 악연은 역할군별 장비·버프 점수 기준(이상)으로 진입 가능.
export const DIREGIE_TIERS = [
  { key: 'matching', name: '매칭', type: 'fame', fame: 63257 },
  { key: 'akyeon', name: '악연', type: 'score', dealer: 50000, buffer: 60000 }
];

// 유일장비 제작 현황: 태초 소울/순례의 인장은 두 장비 모두에 각각 필요하므로(material.key가
// 같으면), 두 장비를 전부 만들려면 두 장비의 요구량을 합산한 만큼 있어야 한다(개별 장비
// 카드에서는 그 장비 하나에 필요한 만큼만, 전체 합산 카드에서는 두 장비 몫을 합해서 보여준다).
// weeklyTracked: true인 재료만 "현재 보유 + 주간 수급량"으로 소요 주차를 계산한다.
// sourceKeys가 있으면 보유량 입력창을 여러 개로 나누고 합산해서 그 재료의 보유량으로 쓴다.
export const UNIQUE_EQUIPMENT_ITEMS = [
  {
    key: 'plagueHeart',
    name: '만병을 잉태한 역병의 심장',
    materials: [
      { key: 'primordialSoul', name: '태초 소울', required: 25 },
      { key: 'epicSoul', name: '에픽 소울', required: 500 },
      { key: 'pilgrimageSeal', name: '순례의 인장', required: 20000 }
    ]
  },
  {
    key: 'radiantEye',
    name: '광휘를 머금은 눈동자',
    materials: [
      { key: 'primordialSoul', name: '태초 소울', required: 25 },
      { key: 'pilgrimageSeal', name: '순례의 인장', required: 20000 },
      {
        key: 'dawnDroplet', name: '여명의 빛망울', required: 2400, weeklyTracked: true,
        sourceKeys: [
          { key: 'dawnDropletUntradeable', name: '여명의 빛망울 (교환불가)' },
          { key: 'dawnDropletBound', name: '여명의 빛망울 (계정귀속)' }
        ]
      }
    ]
  }
];

// 유일장비 정밀도: 완성 후 정밀도 100%를 채우기 위해 "시도"를 반복해야 하며, 시도 1회마다
// 아래 재료가 추가로(완성 재료와는 별개로) 소모된다. 100% 도달까지 필요한 평균 시도 횟수는
// 정확히 알 수 없어 25회로 가정한다(UI에도 이 가정을 명시해서 보여준다).
export const PRECISION_AVG_ATTEMPTS = 25;
export const UNIQUE_EQUIPMENT_PRECISION_COST = {
  plagueHeart: [
    { key: 'epicSoul', name: '에픽 소울', perAttempt: 40 },
    { key: 'pilgrimageSeal', name: '순례의 인장', perAttempt: 800 }
  ],
  radiantEye: [
    { key: 'epicSoul', name: '에픽 소울', perAttempt: 60 },
    { key: 'pilgrimageSeal', name: '순례의 인장', perAttempt: 800 },
    { key: 'dawnDroplet', name: '여명의 빛망울', perAttempt: 60 }
  ]
};

export const BUFFER_KEYWORDS = ['패러메딕', '크루세이더', '뮤즈', '인챈트리스'];

export const DEFAULT_CUSTOM_OPTIONS = {
  enchant: ['기본', '가성비', '준종결', '종결'],
  title: ['기본', '가성비', '준종결', '종결'],
  creature: ['기본', '가성비', '준종결', '종결'],
  creatureArtifact: ['없음', '언커먼', '레어', '유니크'],
  avatar: ['기본', '이벤압', '레압', '클레압', '엔드'],
  emblem: ['없음', '화려', '찬란', '다발'],
  platEmblem: ['없음', '잡플티', '유효', '종결'],
  skinAvatar: ['없음', '기본', '특판', '프리미엄'],
  skinSocket: ['막힘', '뚫림'],
  skinEmblem: ['없음', '화려', '찬란'],
  weaponAvatar: ['없음', '기본', '레어'],
  weaponSocket: ['막힘', '뚫림'],
  weaponEmblem: ['없음', '화려', '찬란'],
  aura: ['기본', '가성비', '준종결', '종결'],
  auraEmblem: ['없음', '화려', '찬란']
};

export const ALL_MANUAL_KEYS = [
  'enchant', 'title', 'creature', 'creatureArtifact',
  'avatar', 'emblem', 'platEmblem',
  'skinAvatar', 'skinSocket', 'skinEmblem',
  'weaponAvatar', 'weaponSocket', 'weaponEmblem',
  'aura', 'auraEmblem'
];

export const PILGRIMAGE_BASE_ITEMS = [
  '무결점 라이언 코어', '무결점 조화의 결정체', '닳아버린 순례의 증표',
  '순례의 인장(1회 교환 가능)', '순례의 인장(1회 교환 가능) 교환권 1개 상자',
  '레전더리 소울 결정', '에픽 소울 결정'
];

export const DEFAULT_AUCTION_PRICES = {
  '무결점 라이언 코어': 0,
  '무결점 조화의 결정체': 0,
  '닳아버린 순례의 증표': 0,
  '순례의 인장(1회 교환 가능)': 0,
  '순례의 인장(1회 교환 가능) 교환권 1개 상자': 0,
  '레전더리 소울 결정': 0,
  '에픽 소울 결정': 0,
};

// 증폭(장비 증폭) 단계별 기본값 — 나무위키("100레벨 에픽 아이템" 기준) 수치를 그대로 옮긴 것으로,
// 실제 서버/패치 수치와 다를 수 있다. 계산기 화면에서 직접 수정 가능하며, 이 값은 그 초기값일 뿐이다.
// onFail: null(실패해도 단계 유지) | { dropTo }(해당 단계로 강등) | 'destroy'(장비 파괴, +11 이상)
export const AMP_GENERAL_STAGES = [
  { from: 0, to: 1, successProb: 1, material: 1, onFail: null },
  { from: 1, to: 2, successProb: 1, material: 2, onFail: null },
  { from: 2, to: 3, successProb: 1, material: 3, onFail: null },
  { from: 3, to: 4, successProb: 1, material: 4, onFail: null },
  { from: 4, to: 5, successProb: 0.8, material: 5, onFail: { dropTo: 3 } },
  { from: 5, to: 6, successProb: 0.7, material: 6, onFail: { dropTo: 4 } },
  { from: 6, to: 7, successProb: 0.6, material: 7, onFail: { dropTo: 5 } },
  { from: 7, to: 8, successProb: 0.7, material: 8, onFail: { dropTo: 4 } },
  { from: 8, to: 9, successProb: 0.6, material: 9, onFail: { dropTo: 5 } },
  { from: 9, to: 10, successProb: 0.5, material: 10, onFail: { dropTo: 6 } },
  { from: 10, to: 11, successProb: 0.4, material: 11, onFail: 'destroy' },
  { from: 11, to: 12, successProb: 0.3, material: 12, onFail: 'destroy' },
  { from: 12, to: 13, successProb: 0.2, material: 13, onFail: 'destroy' }
];
// 일반 증폭 1회 시도당 골드 수수료(단계 무관 고정, 나무위키 "증폭 시 소모 골드량" 기준).
export const AMP_GENERAL_GOLD_PER_ATTEMPT = { weapon: 739200, nonWeapon: 258720 };
// 무색 큐브 조각 1000개 = 모순의 결정체 1개로 교환 가능.
export const CUBE_FRAGMENTS_PER_CONTRADICTION = 1000;
// 조화의 결정체 자체는 교환 불가라, 교환 가능한 무결점 조화의 결정체 시세를 1:1로 가치 기준 삼는다
// (광휘의 순례 탭에서 귀속 조화의 결정체를 평가하는 방식과 동일).
export const AMP_AUCTION_ITEMS = {
  cube: '무색 큐브 조각',
  contradiction: '모순의 결정체',
  harmony: '무결점 조화의 결정체'
};

export const AMP_SAFE_STAGES = [
  { from: 0, to: 1, successProb: 1, material: 36, weaponGold: 430100, nonWeaponGold: 189860, pityIncrement: 0 },
  { from: 1, to: 2, successProb: 1, material: 41, weaponGold: 490600, nonWeaponGold: 250360, pityIncrement: 0 },
  { from: 2, to: 3, successProb: 1, material: 46, weaponGold: 551100, nonWeaponGold: 310860, pityIncrement: 0 },
  { from: 3, to: 4, successProb: 1, material: 51, weaponGold: 611600, nonWeaponGold: 371360, pityIncrement: 0 },
  { from: 4, to: 5, successProb: 0.7, material: 55, weaponGold: 876652, nonWeaponGold: 490750, pityIncrement: 0.10 },
  { from: 5, to: 6, successProb: 0.6, material: 67, weaponGold: 1072098, nonWeaponGold: 615450, pityIncrement: 0.10 },
  { from: 6, to: 7, successProb: 0.5, material: 109, weaponGold: 1730400, nonWeaponGold: 1043132, pityIncrement: 0.10 },
  { from: 7, to: 8, successProb: 0.5, material: 122, weaponGold: 1932679, nonWeaponGold: 1157283, pityIncrement: 0.05 },
  { from: 8, to: 9, successProb: 0.4, material: 230, weaponGold: 3656400, nonWeaponGold: 2246200, pityIncrement: 0.05 },
  { from: 9, to: 10, successProb: 0.3, material: 320, weaponGold: 5084870, nonWeaponGold: 2937440, pityIncrement: 0.05 }
];

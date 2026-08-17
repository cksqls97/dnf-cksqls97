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

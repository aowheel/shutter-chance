export type FestivalNode = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type FestivalEdge = {
  id: string;
  source: FestivalNode["id"];
  target: FestivalNode["id"];
  strokeWeight: number;
};

export const festivalNodes: FestivalNode[] = [
  {
    id: "node-1",
    label: "浜松餃子＆ご当地グルメ屋台",
    lat: 34.7075,
    lng: 137.7338,
  },
  {
    id: "node-2",
    label: "クラフトビール＆地元ドリンクバー",
    lat: 34.7079,
    lng: 137.7349,
  },
  {
    id: "node-3",
    label: "音楽グッズマーケット",
    lat: 34.7084,
    lng: 137.7358,
  },
  {
    id: "node-4",
    label: "楽器体験ブース（ヤマハ・ローランド協賛）",
    lat: 34.7089,
    lng: 137.7371,
  },
  {
    id: "node-5",
    label: "キッズミュージックパーク",
    lat: 34.7093,
    lng: 137.7382,
  },
  {
    id: "node-6",
    label: "ハンドメイド＆アート雑貨ブース",
    lat: 34.7071,
    lng: 137.7326,
  },
  {
    id: "node-7",
    label: "フォトブース（フェス公式ロゴ背景）",
    lat: 34.7087,
    lng: 137.7342,
  },
  {
    id: "node-8",
    label: "環境・エコ推進ブース",
    lat: 34.7068,
    lng: 137.735,
  },
  {
    id: "node-9",
    label: "音楽学校・教室紹介コーナー",
    lat: 34.7062,
    lng: 137.7375,
  },
  {
    id: "node-10",
    label: "地域NPO・文化団体紹介ブース",
    lat: 34.7056,
    lng: 137.7347,
  },
];

export const festivalEdges: FestivalEdge[] = [
  {
    id: "edge-1-2",
    source: "node-1",
    target: "node-2",
    strokeWeight: 16,
  },
  {
    id: "edge-2-3",
    source: "node-2",
    target: "node-3",
    strokeWeight: 12,
  },
  {
    id: "edge-3-4",
    source: "node-3",
    target: "node-4",
    strokeWeight: 16,
  },
  {
    id: "edge-4-5",
    source: "node-4",
    target: "node-5",
    strokeWeight: 12,
  },
  {
    id: "edge-1-6",
    source: "node-1",
    target: "node-6",
    strokeWeight: 8,
  },
  {
    id: "edge-2-7",
    source: "node-2",
    target: "node-7",
    strokeWeight: 12,
  },
  {
    id: "edge-3-8",
    source: "node-3",
    target: "node-8",
    strokeWeight: 8,
  },
  {
    id: "edge-5-9",
    source: "node-5",
    target: "node-9",
    strokeWeight: 8,
  },
  {
    id: "edge-6-10",
    source: "node-6",
    target: "node-10",
    strokeWeight: 12,
  },
  {
    id: "edge-4-7",
    source: "node-4",
    target: "node-7",
    strokeWeight: 12,
  },
  {
    id: "edge-2-9",
    source: "node-2",
    target: "node-9",
    strokeWeight: 8,
  },
];

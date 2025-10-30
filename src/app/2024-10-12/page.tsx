"use client";

import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { festivalEdges, festivalNodes } from "@/utils/data/latlng";

const hamamatsuBoothId = "node-1";

const ageGroups = ["10代", "20代", "30代", "40代", "50代", "60代以上"] as const;
type AgeGroup = (typeof ageGroups)[number];

type GenderAgeDistributionRow = {
  gender: string;
  counts: Record<AgeGroup, number>;
};

const hamamatsuBoothAnalysis = {
  title: "浜松餃子＆ご当地グルメ屋台",
  summary:
    "2024年フェス期間中に実施した来場者アンケート（n=528）を集計した、浜松餃子＆ご当地グルメ屋台の利用分析レポートです。",
  period: "調査期間：2024年10月12日／サンプル数：528名",
  takeaways: [
    "女性30代の支持が最多で、全体の約17%を占める",
    "30〜40代のファミリー層で男女ともにリピート率が高い",
    "男性20代は夜公演後の“追い餃子”需要が顕著で、追加オーダー率42%",
  ],
  genderAgeDistribution: [
    {
      gender: "男性",
      counts: {
        "10代": 28,
        "20代": 84,
        "30代": 68,
        "40代": 54,
        "50代": 21,
        "60代以上": 12,
      },
    },
    {
      gender: "女性",
      counts: {
        "10代": 26,
        "20代": 74,
        "30代": 87,
        "40代": 52,
        "50代": 15,
        "60代以上": 7,
      },
    },
  ] satisfies GenderAgeDistributionRow[],
  reviews: [
    {
      id: "review-1",
      comment:
        "ライブ後でも行列がスムーズに流れて、餃子がアツアツで出てくるのがありがたい。柚子胡椒タレがさっぱりしてて無限に食べられる！",
    },
    {
      id: "review-2",
      comment:
        "浜松焼きそばの麺がモチモチで、しらすの香りがしっかり。夜中の撮影終わりにスタッフみんなでシェアして元気回復できました。",
    },
    {
      id: "review-3",
      comment:
        "子ども用に辛味抜きをお願いしたら快く対応してもらえました。餃子スープが野菜たっぷりで、冷えた体が一気に温まります。",
    },
    {
      id: "review-4",
      comment:
        "昼と夜で味の印象が変わるので、次回はお酒とのペアリング解説があると嬉しい。とはいえ餃子の焼き目が見事で毎回注文してしまう。",
    },
    {
      id: "review-5",
      comment:
        "ベジ餃子があるのが助かる！友人と色んな味をシェアできて、フェス飯の中でも一番バリエーションが豊富でした。",
    },
  ],
};

const hamamatsuBounds = {
  south: 34.525,
  west: 137.3,
  north: 35.1,
  east: 138.3,
  padding: 48,
};

type LatLngLiteral = {
  lat: number;
  lng: number;
};

type FestivalEdgePolylinesProps = {
  nodePositions: Record<string, LatLngLiteral>;
};

const FestivalEdgePolylines = ({
  nodePositions,
}: FestivalEdgePolylinesProps) => {
  const map = useMap();
  const mapsLibrary = useMapsLibrary("maps");
  const polylinesRef = useRef<any[] | null>(null);

  useEffect(() => {
    if (!map || !mapsLibrary) {
      return;
    }

    if (!polylinesRef.current) {
      polylinesRef.current = festivalEdges.map(
        (edge) =>
          new mapsLibrary.Polyline({
            strokeColor: "#1e88e5",
            strokeOpacity: 0.85,
            strokeWeight: edge.strokeWeight,
          }),
      );
    }

    polylinesRef.current.forEach((polyline, index) => {
      const edge = festivalEdges[index];
      const source = nodePositions[edge.source];
      const target = nodePositions[edge.target];

      if (!source || !target) {
        polyline.setMap(null);
        return;
      }

      polyline.setPath([source, target]);
      polyline.setOptions({
        strokeWeight: edge.strokeWeight,
      });
      polyline.setMap(map);
    });

    return () => {
      polylinesRef.current?.forEach((polyline) => {
        polyline.setMap(null);
      });
    };
  }, [map, mapsLibrary, nodePositions]);

  return null;
};

export default function FestivalNetworkPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral>();
  const [locationError, setLocationError] = useState(false);
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);
  const currentLocationIcon = useMemo(
    () => ({
      url: "/current-location-marker.svg",
      scaledSize: { width: 48, height: 48 },
      anchor: { x: 24, y: 24 },
    }),
    [],
  );

  const festivalBaseCenter = useMemo(() => {
    if (festivalNodes.length === 0) {
      return { lat: hamamatsuBounds.south, lng: hamamatsuBounds.west };
    }
    const totals = festivalNodes.reduce(
      (accumulator, node) => {
        accumulator.lat += node.lat;
        accumulator.lng += node.lng;
        return accumulator;
      },
      { lat: 0, lng: 0 },
    );
    return {
      lat: totals.lat / festivalNodes.length,
      lng: totals.lng / festivalNodes.length,
    };
  }, []);

  const festivalNodePositions = useMemo(() => {
    const center = currentLocation ?? festivalBaseCenter;
    const latOffset = center.lat - festivalBaseCenter.lat;
    const lngOffset = center.lng - festivalBaseCenter.lng;

    return festivalNodes.reduce<Record<string, LatLngLiteral>>(
      (accumulator, node) => {
        accumulator[node.id] = {
          lat: node.lat + latOffset,
          lng: node.lng + lngOffset,
        };
        return accumulator;
      },
      {},
    );
  }, [currentLocation, festivalBaseCenter]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError(true);
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("ja-JP"), []);
  const meshCounts = hamamatsuBoothAnalysis.genderAgeDistribution.flatMap(
    (row) => ageGroups.map((ageGroup) => row.counts[ageGroup]),
  );
  const meshMax = meshCounts.length ? Math.max(...meshCounts) : 0;
  const columnTotals = ageGroups.map((ageGroup) =>
    hamamatsuBoothAnalysis.genderAgeDistribution.reduce(
      (total, row) => total + row.counts[ageGroup],
      0,
    ),
  );
  const grandTotal = columnTotals.reduce((total, value) => total + value, 0);

  const getMeshCellStyle = (count: number) => {
    if (!meshMax) {
      return {
        backgroundImage:
          "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.12) 100%)",
      };
    }
    const ratio = count / meshMax;
    const primaryAlpha = Math.min(0.85, 0.12 + ratio * 0.7);
    const secondaryAlpha = Math.min(0.9, primaryAlpha + 0.05);

    return {
      backgroundImage: `linear-gradient(135deg, rgba(37,99,235,${primaryAlpha}) 0%, rgba(37,99,235,${secondaryAlpha}) 100%)`,
    };
  };

  const getMeshCellTextClass = (count: number) => {
    if (!meshMax) {
      return "text-neutral-700";
    }
    const ratio = count / meshMax;
    return ratio > 0.6 ? "text-white" : "text-neutral-800";
  };

  return (
    <div className="relative h-screen w-full overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultBounds={hamamatsuBounds}
          center={currentLocation ?? festivalBaseCenter}
          defaultZoom={17}
          zoom={currentLocation ? 18 : 17}
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={false}
          className="h-full w-full"
        >
          {currentLocation && (
            <Marker position={currentLocation} icon={currentLocationIcon} />
          )}
          <FestivalEdgePolylines nodePositions={festivalNodePositions} />
          {festivalNodes.map((node) => (
            <Marker
              key={node.id}
              position={festivalNodePositions[node.id]}
              label={{ text: node.label }}
              title={node.label}
              onClick={
                node.id === hamamatsuBoothId
                  ? () => setIsBoothModalOpen(true)
                  : undefined
              }
              options={{
                clickable: node.id === hamamatsuBoothId,
                cursor: node.id === hamamatsuBoothId ? "pointer" : "default",
              }}
            />
          ))}
        </GoogleMap>
      </APIProvider>
      {!locationError && !currentLocation && (
        <div className="pointer-events-none absolute left-4 top-4 rounded bg-white/90 px-3 py-2 text-sm text-neutral-600 shadow">
          現在地を取得しています…
        </div>
      )}
      {locationError && (
        <div className="pointer-events-none absolute left-4 top-4 rounded bg-white/90 px-3 py-2 text-sm text-red-600 shadow">
          現在地を取得できませんでした
        </div>
      )}
      {isBoothModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hamamatsu-booth-title"
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsBoothModalOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Escape" ||
              event.key === "Enter" ||
              event.key === " "
            ) {
              setIsBoothModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600 transition hover:bg-neutral-200"
              onClick={() => setIsBoothModalOpen(false)}
            >
              閉じる
            </button>
            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div>
                <h2
                  id="hamamatsu-booth-title"
                  className="text-xl font-semibold text-neutral-900 sm:text-2xl"
                >
                  {hamamatsuBoothAnalysis.title}
                </h2>
                <p className="mt-2 text-xs font-semibold text-indigo-600 sm:text-sm">
                  {hamamatsuBoothAnalysis.period}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                  {hamamatsuBoothAnalysis.summary}
                </p>
              </div>
              <section>
                <h3 className="text-sm font-semibold text-neutral-800 sm:text-base">
                  来場者分析サマリー
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-neutral-700 sm:text-base">
                  {hamamatsuBoothAnalysis.takeaways.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-neutral-800 sm:text-base">
                  男女×年代の分布
                </h3>
                <p className="mt-2 text-xs text-neutral-500 sm:text-sm">
                  人数が多いセルほど濃く表示されるメッシュヒートマップです。
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full border border-neutral-200 text-sm sm:text-base">
                    <thead>
                      <tr className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:text-sm">
                        <th className="border border-neutral-200 px-3 py-2 text-left text-neutral-600">
                          性別
                        </th>
                        {ageGroups.map((ageGroup) => (
                          <th
                            key={ageGroup}
                            className="border border-neutral-200 px-3 py-2 text-center text-neutral-600"
                          >
                            {ageGroup}
                          </th>
                        ))}
                        <th className="border border-neutral-200 px-3 py-2 text-center text-neutral-600">
                          合計
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {hamamatsuBoothAnalysis.genderAgeDistribution.map(
                        (row) => {
                          const rowTotal = ageGroups.reduce(
                            (total, ageGroup) => total + row.counts[ageGroup],
                            0,
                          );
                          return (
                            <tr
                              key={row.gender}
                              className="odd:bg-white even:bg-neutral-50/70"
                            >
                              <th className="border border-neutral-200 px-3 py-2 text-left text-sm font-semibold text-neutral-800 sm:text-base">
                                {row.gender}
                              </th>
                              {ageGroups.map((ageGroup) => {
                                const count = row.counts[ageGroup];
                                const meshStyle = getMeshCellStyle(count);
                                const meshTextClass =
                                  getMeshCellTextClass(count);

                                return (
                                  <td
                                    key={ageGroup}
                                    className={`border border-neutral-200 px-3 py-2 text-center font-medium ${meshTextClass}`}
                                    style={meshStyle}
                                  >
                                    {numberFormatter.format(count)}
                                  </td>
                                );
                              })}
                              <td className="border border-neutral-200 px-3 py-2 text-center font-semibold text-neutral-900">
                                {numberFormatter.format(rowTotal)}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-100 text-sm font-semibold text-neutral-800">
                        <th className="border border-neutral-200 px-3 py-2 text-left">
                          合計
                        </th>
                        {columnTotals.map((total, index) => (
                          <td
                            key={ageGroups[index]}
                            className="border border-neutral-200 px-3 py-2 text-center"
                          >
                            {numberFormatter.format(total)}
                          </td>
                        ))}
                        <td className="border border-neutral-200 px-3 py-2 text-center">
                          {numberFormatter.format(grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold text-neutral-800 sm:text-base">
                  口コミハイライト
                </h3>
                <ul className="mt-3 space-y-3">
                  {hamamatsuBoothAnalysis.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4"
                    >
                      <p className="text-sm leading-relaxed text-neutral-800 sm:text-base">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

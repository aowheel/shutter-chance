"use client";

import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
} from "@vis.gl/react-google-maps";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const genders = ["男性", "女性"] as const;
const ageGroups = ["10代", "20代", "30代", "40代", "50代", "60代"] as const;

type Gender = (typeof genders)[number];
type AgeGroup = (typeof ageGroups)[number];
type DemographicCounts = Record<Gender, Record<AgeGroup, number>>;

type UploadedEntry = {
  id: string;
  imageUrl: string;
  comment: string;
  location: LatLngLiteral;
};

const fiveMinutesInSeconds = 5 * 60;

const defaultMapCenter: LatLngLiteral = {
  lat: 34.7075,
  lng: 137.7345,
};

const createInitialCounts = (): DemographicCounts =>
  genders.reduce<DemographicCounts>((acc, gender) => {
    acc[gender] = ageGroups.reduce<Record<AgeGroup, number>>(
      (groupAcc, ageGroup) => {
        groupAcc[ageGroup] = 0;
        return groupAcc;
      },
      {} as Record<AgeGroup, number>,
    );
    return acc;
  }, {} as DemographicCounts);

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

export default function PhotoCapturePage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral>();
  const [locationError, setLocationError] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LatLngLiteral | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [uploadedEntries, setUploadedEntries] = useState<UploadedEntry[]>(
    () => [
      {
        id: "prefill-kitchen-car",
        imageUrl:
          "https://kitchen-car.com/kumiai/_wp/wp-content/uploads/2021/07/ae9290a5afea9657fe51c64f7524ca0c.jpg",
        comment:
          "昼下がりに立ち寄ったら、揚げたてのポテトが香ばしくて行列でも待つ価値ありでした。スタッフさんの掛け声も元気で、つい追加オーダー！",
        location: {
          lat: 34.7053,
          lng: 137.7321,
        },
      },
      {
        id: "prefill-aqula",
        imageUrl:
          "https://www.aqula.co.jp/wp01/wp-content/uploads/2017/08/IMG_0972.jpg",
        comment:
          "夜のライトに照らされたキッチンカーがとても映えていて、チーズドッグのとろけ具合が最高でした。写真を撮りたくなる雰囲気！",
        location: {
          lat: 34.7064,
          lng: 137.7289,
        },
      },
    ],
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [demographicCounts, setDemographicCounts] = useState<DemographicCounts>(
    () => createInitialCounts(),
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const latestCountsRef = useRef(demographicCounts);
  const latestLocationRef = useRef<LatLngLiteral | null>(selectedLocation);
  const currentLocationIcon = useMemo(
    () => ({
      url: "/current-location-marker.svg",
      scaledSize: { width: 48, height: 48 },
      anchor: { x: 24, y: 24 },
    }),
    [],
  );

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    const latLng = event.detail.latLng;
    if (!latLng) {
      return;
    }
    setSelectedLocation({
      lat: latLng.lat,
      lng: latLng.lng,
    });
    setSelectedFile(null);
    setComment("");
    setUploadError(null);
    setIsUploadModalOpen(true);
    setDemographicCounts(createInitialCounts());
    setIsTimerRunning(false);
    setTimerSeconds(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setComment("");
    setUploadError(null);
    setIsUploading(false);
    setIsTimerRunning(false);
    setTimerSeconds(null);
    setDemographicCounts(createInitialCounts());
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setSelectedFile(file);
      setUploadError(null);
    },
    [],
  );

  const handleCommentChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setComment(event.target.value);
      setUploadError(null);
    },
    [],
  );

  const handleEntryLocationClick = useCallback((location: LatLngLiteral) => {
    setSelectedLocation(location);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedLocation) {
      setUploadError(
        "撮影地点が取得できませんでした。もう一度お試しください。",
      );
      return;
    }
    if (!selectedFile) {
      setUploadError("アップロードする画像を選択してください。");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // デモモード: 画像のプレビューURLを作成
    try {
      const imageUrl = URL.createObjectURL(selectedFile);
      const commentContent = comment.trim();

      setUploadedEntries((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          imageUrl: imageUrl,
          comment: commentContent,
          location: { ...selectedLocation },
        },
      ]);

      setSelectedFile(null);
      setComment("");
      setUploadError(null);
      setIsUploadModalOpen(false);
      setIsTimerRunning(false);
      setTimerSeconds(null);
      setDemographicCounts(createInitialCounts());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "アップロードに失敗しました。時間をおいて再度お試しください。";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }, [comment, selectedFile, selectedLocation]);

  const handleIncrement = useCallback(
    (gender: Gender, ageGroup: AgeGroup) => {
      if (!isTimerRunning) {
        return;
      }
      setDemographicCounts((previous) => ({
        ...previous,
        [gender]: {
          ...previous[gender],
          [ageGroup]: previous[gender][ageGroup] + 1,
        },
      }));
    },
    [isTimerRunning],
  );

  const handleTimerStart = useCallback(() => {
    if (isTimerRunning) {
      return;
    }
    setTimerSeconds(fiveMinutesInSeconds);
    setIsTimerRunning(true);
  }, [isTimerRunning]);

  const getCountAppearanceClasses = useCallback(
    (count: number) => {
      if (!isTimerRunning) {
        return "bg-orange-100 text-orange-300";
      }
      if (count >= 15) {
        return "bg-orange-600 text-white";
      }
      if (count >= 10) {
        return "bg-orange-500 text-white";
      }
      if (count >= 5) {
        return "bg-orange-400 text-white";
      }
      if (count >= 1) {
        return "bg-orange-300 text-orange-900";
      }
      return "bg-orange-200 text-orange-900";
    },
    [isTimerRunning],
  );

  useEffect(() => {
    latestCountsRef.current = demographicCounts;
  }, [demographicCounts]);

  useEffect(() => {
    latestLocationRef.current = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds === null) {
      return;
    }

    if (timerSeconds <= 0) {
      setIsTimerRunning(false);
      setTimerSeconds(null);
      console.log("5分の計測が終了しました", {
        counts: latestCountsRef.current,
        location: latestLocationRef.current,
      });
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerSeconds((previous) =>
        previous !== null ? previous - 1 : previous,
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isTimerRunning, timerSeconds]);

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

  return (
    <div className="flex w-full justify-start gap-4">
      <div className="relative h-screen w-2/3 shrink-0 overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultBounds={hamamatsuBounds}
            center={selectedLocation ?? currentLocation ?? defaultMapCenter}
            defaultZoom={17}
            zoom={selectedLocation ? 18 : currentLocation ? 18 : 17}
            gestureHandling="greedy"
            mapTypeControl={false}
            streetViewControl={false}
            className="h-full w-full"
            onClick={handleMapClick}
          >
            {currentLocation && (
              <Marker position={currentLocation} icon={currentLocationIcon} />
            )}
            {selectedLocation && (
              <Marker position={selectedLocation} title="選択した地点" />
            )}
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
      </div>
      <aside className="flex h-screen w-1/3 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-800">
            アップロード一覧
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            アップロードした画像・コメント・座標がここに表示されます。
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {uploadedEntries.length === 0 ? (
            <p className="text-sm text-neutral-500">
              まだアップロードはありません。
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {uploadedEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col overflow-hidden rounded border border-neutral-200 bg-neutral-50"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-neutral-200">
                    <Image
                      src={entry.imageUrl}
                      alt="アップロードした写真"
                      fill
                      sizes="(min-width: 1536px) 180px, (min-width: 640px) 240px, 100vw"
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
                    <p className="whitespace-pre-wrap wrap-break-word text-sm text-neutral-700">
                      {entry.comment.length > 0
                        ? entry.comment
                        : "コメントなし"}
                    </p>
                    <button
                      className="w-full rounded border border-transparent bg-blue-50 px-2 py-1 text-left text-xs font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                      type="button"
                      onClick={() => handleEntryLocationClick(entry.location)}
                    >
                      座標: {entry.location.lat.toFixed(5)},{" "}
                      {entry.location.lng.toFixed(5)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-800">
              写真をアップロード
            </h2>
            {selectedLocation && (
              <p className="mt-2 text-sm text-neutral-600">
                座標: {selectedLocation.lat.toFixed(5)},{" "}
                {selectedLocation.lng.toFixed(5)}
              </p>
            )}
            <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 px-4 py-3">
              <h3 className="text-sm font-medium text-neutral-700">
                画像アップロード
              </h3>
              <label
                className="mt-3 block text-xs font-medium text-neutral-600"
                htmlFor="photo-upload-input"
              >
                画像ファイルを選択
              </label>
              <input
                accept="image/*"
                className="mt-2 w-full text-sm text-neutral-700"
                id="photo-upload-input"
                type="file"
                onChange={handleFileChange}
              />
              <label
                className="mt-4 block text-xs font-medium text-neutral-600"
                htmlFor="photo-comment-input"
              >
                コメント（任意）
              </label>
              <textarea
                className="mt-2 h-24 w-full resize-none rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                id="photo-comment-input"
                placeholder="撮影時の様子やメモを入力してください"
                value={comment}
                onChange={handleCommentChange}
                maxLength={500}
              />
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? "アップロード中…" : "アップロード"}
                </button>
              </div>
            </div>
            <div className="mt-6 rounded border border-neutral-200 bg-neutral-50 px-4 py-3">
              <h3 className="text-sm font-medium text-neutral-700">
                性別×年代カウント
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-24 border border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-medium text-neutral-700">
                        性別
                      </th>
                      {ageGroups.map((ageGroup) => (
                        <th
                          key={ageGroup}
                          className="border border-neutral-200 bg-neutral-50 px-3 py-2 text-center font-medium text-neutral-700"
                        >
                          {ageGroup}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {genders.map((gender) => (
                      <tr key={gender}>
                        <th className="border border-neutral-200 bg-neutral-50 px-3 py-2 text-left font-medium text-neutral-700">
                          {gender}
                        </th>
                        {ageGroups.map((ageGroup) => {
                          const count = demographicCounts[gender][ageGroup];
                          const appearanceClasses =
                            getCountAppearanceClasses(count);

                          return (
                            <td
                              key={ageGroup}
                              className="border border-neutral-200 px-2 py-2 text-center"
                            >
                              <button
                                className={`flex w-full flex-col items-center justify-center rounded border border-orange-200 px-2 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${appearanceClasses}`}
                                type="button"
                                onClick={() =>
                                  handleIncrement(gender, ageGroup)
                                }
                                disabled={!isTimerRunning}
                              >
                                <span className="text-base font-semibold">
                                  {count}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded border border-neutral-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">
                      {isTimerRunning ? "計測中…" : "未開始"}
                    </p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {timerSeconds !== null
                        ? formatTime(timerSeconds)
                        : formatTime(fiveMinutesInSeconds)}
                    </p>
                  </div>
                  <button
                    className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    type="button"
                    onClick={handleTimerStart}
                    disabled={isTimerRunning}
                  >
                    5分スタート
                  </button>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  計測終了後にカウントと座標を自動でコンソールに出力します。
                </p>
              </div>
            </div>
            {uploadError && (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}
            <div className="mt-6 flex justify-end">
              <button
                className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                onClick={handleModalClose}
                disabled={isUploading}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

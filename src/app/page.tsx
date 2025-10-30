"use client";

import type { MapMouseEvent } from "@vis.gl/react-google-maps";
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
} from "@vis.gl/react-google-maps";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

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

const STORAGE_BUCKET = "photos";

const genders = ["男性", "女性"] as const;
const ageGroups = ["10代", "20代", "30代", "40代", "50代", "60代"] as const;

type Gender = (typeof genders)[number];
type AgeGroup = (typeof ageGroups)[number];
type DemographicCounts = Record<Gender, Record<AgeGroup, number>>;

const fifteenMinutesInSeconds = 15 * 60;

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

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const supabase = useMemo(() => createClient(), []);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral>();
  const [locationError, setLocationError] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<LatLngLiteral | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [demographicCounts, setDemographicCounts] = useState<DemographicCounts>(
    () => createInitialCounts(),
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const latestCountsRef = useRef(demographicCounts);
  const latestLocationRef = useRef<LatLngLiteral | null>(selectedLocation);

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
    setUploadError(null);
    setIsUploadModalOpen(true);
    setDemographicCounts(createInitialCounts());
    setIsTimerRunning(false);
    setTimerSeconds(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
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

    const fileExt = selectedFile.name.split(".").pop() ?? "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const folder = `${selectedLocation.lat.toFixed(5)}_${selectedLocation.lng.toFixed(5)}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, selectedFile, {
        contentType: selectedFile.type,
        upsert: false,
      });

    if (error) {
      setUploadError(error.message);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    setSelectedFile(null);
  }, [selectedFile, selectedLocation, supabase]);

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
    setTimerSeconds(fifteenMinutesInSeconds);
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
      console.log("15分の計測が終了しました", {
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
    <div className="flex w-full justify-start">
      <div className="relative h-screen w-2/3 overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            defaultBounds={hamamatsuBounds}
            center={currentLocation ?? undefined}
            zoom={currentLocation ? 16 : undefined}
            gestureHandling="greedy"
            mapTypeControl={false}
            streetViewControl={false}
            className="h-full w-full"
            onClick={handleMapClick}
          >
            {currentLocation && <Marker position={currentLocation} />}
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
                                onClick={() => handleIncrement(gender, ageGroup)}
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
                        : formatTime(fifteenMinutesInSeconds)}
                    </p>
                  </div>
                  <button
                    className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    type="button"
                    onClick={handleTimerStart}
                    disabled={isTimerRunning}
                  >
                    15分スタート
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

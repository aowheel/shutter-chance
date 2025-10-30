"use client";

import {
  APIProvider,
  Map as GoogleMap,
  Marker,
} from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

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

export default function Home() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(
    null,
  );
  const [locationError, setLocationError] = useState(false);

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
            zoom={currentLocation ? 14 : undefined}
            gestureHandling="greedy"
            mapTypeControl={false}
            streetViewControl={false}
            className="h-full w-full"
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
    </div>
  );
}

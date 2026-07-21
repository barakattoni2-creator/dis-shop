import { useEffect, useRef, useState } from "react";
import { JUBA_CENTER, ZONE_COORDINATES } from "@/data/delivery";
import { SearchIcon, PinIcon, CheckIcon } from "@/components/icons";
import styles from "@/styles/DeliveryMap.module.css";

const ZONE_ZOOM = 15;
const DEFAULT_ZOOM = 13;

function mapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// A single branded pin (DIS orange) with a pulse ring that plays once when
// the marker element is first created — since the marker is created only
// once and reused via setLatLng() for every later click/drag, the pulse
// naturally only ever fires on first selection.
function createMarkerIcon(L) {
  return L.divIcon({
    className: styles.markerDivIcon,
    html: `<span class="${styles.markerPulse}"></span><span class="${styles.markerPin}"></span>`,
    iconSize: [30, 42],
    iconAnchor: [15, 38],
  });
}

// Free, no-API-key geocoding via OpenStreetMap's Nominatim, scoped to a
// bounding box around Juba so results stay locally relevant. Debounced by
// the caller — this is meant for occasional checkout-time lookups, not
// bulk queries, consistent with Nominatim's fair-use policy.
async function searchJuba(query) {
  const viewbox = "31.45,4.95,31.75,4.75"; // roughly Juba's extent
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&countrycodes=ss&viewbox=${viewbox}&bounded=1&limit=5`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed.");
  return res.json();
}

export default function DeliveryMap({ zone, onLocationChange, landmark, errorMessage }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | error
  const [selected, setSelected] = useState(null); // { lat, lng, label }
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const placeMarker = (lat, lng, recenter = false) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon: createMarkerIcon(L),
      }).addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current.getLatLng();
        updateSelection(pos.lat, pos.lng);
      });
    }
    if (recenter) map.setView([lat, lng], ZONE_ZOOM);
  };

  const updateSelection = (lat, lng, label) => {
    const resolvedLabel = label || zone || "Pinned location";
    setSelected({ lat, lng, label: resolvedLabel });
    onLocationChange({
      lat,
      lng,
      locationLabel: resolvedLabel,
      mapUrl: mapsLink(lat, lng),
    });
  };

  // Init the map once, client-side only — Leaflet touches `window`/`document`
  // directly and isn't SSR-safe.
  useEffect(() => {
    let cancelled = false;

    import("leaflet")
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const L = leaflet.default || leaflet;
        leafletRef.current = L;

        const start = (zone && ZONE_COORDINATES[zone]) || JUBA_CENTER;
        const map = L.map(containerRef.current).setView(
          [start.lat, start.lng],
          zone && ZONE_COORDINATES[zone] ? ZONE_ZOOM : DEFAULT_ZOOM
        );
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        map.on("click", (e) => {
          placeMarker(e.latlng.lat, e.latlng.lng);
          updateSelection(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center (not re-pin) when the Delivery Area dropdown changes — the
  // customer's own marker placement is never overwritten by this.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !zone) return;
    const coords = ZONE_COORDINATES[zone];
    if (coords) map.setView([coords.lat, coords.lng], ZONE_ZOOM);
  }, [zone]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("idle");
        placeMarker(pos.coords.latitude, pos.coords.longitude, true);
        updateSelection(pos.coords.latitude, pos.coords.longitude, "My Current Location");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReset = () => {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setSelected(null);
    setQuery("");
    setResults([]);
    onLocationChange(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const data = await searchJuba(query.trim());
      setResults(data);
      if (data.length === 0) setSearchError("No matches found in Juba.");
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleResultSelect = (result) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    placeMarker(lat, lng, true);
    updateSelection(lat, lng, result.display_name);
    setResults([]);
    setQuery(result.display_name);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Pin Your Delivery Location</h3>
      <p className={styles.subtext}>
        Search for your area or place the marker at the exact delivery location.
      </p>

      <form className={styles.controlsRow} onSubmit={handleSearch}>
        <div className={styles.searchInputWrap}>
          <SearchIcon width="18" height="18" className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search an area or landmark in Juba"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.searchBtn} disabled={searching}>
          {searching && <span className={styles.btnSpinner} />}
          {searching ? "Searching…" : "Search"}
        </button>
        <button
          type="button"
          className={styles.locateBtn}
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === "loading"}
        >
          {geoStatus === "loading" ? (
            <span className={styles.btnSpinner} />
          ) : (
            <PinIcon width="16" height="16" />
          )}
          {geoStatus === "loading" ? "Locating…" : "Use My Current Location"}
        </button>
      </form>

      {searchError && <p className={styles.error}>{searchError}</p>}
      {results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" onClick={() => handleResultSelect(r)}>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {geoStatus === "error" && (
        <p className={styles.error}>
          Couldn&apos;t get your location. Check your browser&apos;s location permission, or place
          the marker manually.
        </p>
      )}

      <div className={styles.mapBox}>
        {status === "loading" && <div className={styles.mapOverlay}>Loading map…</div>}
        {status === "error" && (
          <div className={styles.mapOverlay}>
            Couldn&apos;t load the map. You can still fill in your address below.
          </div>
        )}
        <div ref={containerRef} className={styles.map} />
      </div>

      {selected && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsPanelHead}>
            <p className={styles.confirmationBanner}>
              <CheckIcon width="13" height="13" /> Delivery location selected successfully.
            </p>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>
              Reset Location
            </button>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Delivery Area</span>
              <span className={styles.detailValue}>{zone || "Not set"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Location Label</span>
              <span className={styles.detailValue}>{selected.label}</span>
            </div>
            {landmark && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nearest Landmark</span>
                <span className={styles.detailValue}>{landmark}</span>
              </div>
            )}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Open in Google Maps</span>
              <a
                href={mapsLink(selected.lat, selected.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.detailLink}
              >
                View on Google Maps
              </a>
            </div>
          </div>

          <p className={styles.coordLine}>
            Coordinates: {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
          </p>
          <p className={styles.deliveryInstructions}>
            Delivery fee will be confirmed by WhatsApp before dispatch.
          </p>
          <a
            className={styles.openLocationBtn}
            href={mapsLink(selected.lat, selected.lng)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Selected Location
          </a>
        </div>
      )}

      {errorMessage && <p className={styles.locationError}>{errorMessage}</p>}
    </div>
  );
}

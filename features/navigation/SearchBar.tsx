import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Price from "@/components/Price";
import Skeleton from "@/components/Skeleton";
import { SearchIcon, MicIcon, ClockIcon, TrendingIcon, EyeIcon, CloseIcon } from "@/components/icons";
import { recordRecentSearch, getRecentSearches, removeRecentSearch } from "@/lib/recentSearches";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import styles from "@/styles/Header.module.css";

interface ProductSuggestion {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
}

// Minimal typing for the Web Speech API — not in TS's default lib, and
// only ever touched inside a click handler (never during render), so a
// small local shape is enough rather than pulling in @types for it.
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Support never changes after mount, so no real subscription is needed —
// useSyncExternalStore just gives a correctly-hydrated read of a
// browser-only API (false on the server, the real value on the client)
// without the ref-read-during-render / setState-in-effect issues either
// alternative runs into.
function subscribeNever() {
  return () => {};
}
function getVoiceSupportSnapshot() {
  return Boolean(getSpeechRecognition());
}
function getVoiceSupportServerSnapshot() {
  return false;
}

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  const [recentTerms, setRecentTerms] = useState<string[]>([]);
  const [trending, setTrending] = useState<ProductSuggestion[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ProductSuggestion[]>([]);
  const [results, setResults] = useState<ProductSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceSupported = useSyncExternalStore(
    subscribeNever,
    getVoiceSupportSnapshot,
    getVoiceSupportServerSnapshot
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/search-config")
      .then((r) => r.json())
      .then((data) => setPopularTerms(data.popularSearches || []))
      .catch(() => {});
  }, []);

  // Trending products load once, up front, so they're ready the instant the
  // input is focused with nothing typed yet — no spinner for the common case.
  useEffect(() => {
    fetch("/api/search-suggest")
      .then((r) => r.json())
      .then((data) => setTrending(data.trending || []))
      .catch(() => {});
  }, []);

  // Recent searches/recently-viewed only need to reflect localStorage at
  // the moment the user opens the dropdown — a discrete event, not a
  // subscription — so they're read directly in the focus handler below
  // rather than an effect keyed on `focused`.
  const handleFocus = () => {
    setFocused(true);
    setRecentTerms(getRecentSearches());
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) {
      setRecentlyViewed([]);
      return;
    }
    fetch(`/api/search-suggest?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then((r) => r.json())
      .then((data) => setRecentlyViewed(data.recentlyViewed || []))
      .catch(() => setRecentlyViewed([]));
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Empty query: nothing to fetch, and `showResults` already hides the
    // dropdown in this state, so stale `results`/`loading` are harmless.
    if (!query.trim()) return;
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search-suggest?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((data) => setResults(data.products || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click — focus/blur alone would close the dropdown
  // before a click on a suggestion/chip inside it registers.
  useEffect(() => {
    if (!focused) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [focused]);

  const runSearch = (term: string) => {
    const clean = term.trim();
    recordRecentSearch(clean || term);
    router.push(clean ? `/search?q=${encodeURIComponent(clean)}` : "/search");
    setQuery(clean);
    setFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleVoiceSearch = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuery(transcript);
        runSearch(transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const showEmptyState = focused && !query.trim();
  const showResults = focused && query.trim().length > 0;
  const hasEmptyContent =
    recentTerms.length > 0 || popularTerms.length > 0 || trending.length > 0 || recentlyViewed.length > 0;

  return (
    <div className={styles.searchWrap} ref={wrapRef}>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search products, brands and more"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          aria-label="Search"
          autoComplete="off"
        />
        {voiceSupported && (
          <button
            type="button"
            className={`${styles.voiceBtn} ${listening ? styles.voiceBtnActive : ""}`}
            onClick={handleVoiceSearch}
            aria-label={listening ? "Listening…" : "Search by voice"}
          >
            <MicIcon />
          </button>
        )}
        <button type="submit" className={styles.searchButton} aria-label="Search">
          <SearchIcon />
        </button>
      </form>

      {showEmptyState && hasEmptyContent && (
        <div className={styles.searchDropdown}>
          {recentTerms.length > 0 && (
            <div className={styles.searchDropdownSection}>
              <div className={styles.searchDropdownSectionHead}>
                <span className={styles.searchDropdownLabel}>Recent Searches</span>
              </div>
              <div className={styles.searchDropdownChips}>
                {recentTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.searchDropdownChip}
                    onMouseDown={() => runSearch(term)}
                  >
                    <ClockIcon />
                    {term}
                    <span
                      role="button"
                      tabIndex={-1}
                      className={styles.chipRemove}
                      aria-label={`Remove "${term}" from recent searches`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        removeRecentSearch(term);
                        setRecentTerms(getRecentSearches());
                      }}
                    >
                      <CloseIcon width="10" height="10" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentlyViewed.length > 0 && (
            <div className={styles.searchDropdownSection}>
              <span className={styles.searchDropdownLabel}>
                <EyeIcon /> Recently Viewed
              </span>
              <div className={styles.searchSuggestList}>
                {recentlyViewed.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={styles.searchSuggestRow}
                    onMouseDown={() => setFocused(false)}
                  >
                    <span className={styles.searchSuggestThumb}>
                      {product.imageUrl && (
                        <Image src={product.imageUrl} alt="" fill sizes="36px" className={styles.searchSuggestImg} />
                      )}
                    </span>
                    <span className={styles.searchSuggestName}>{product.name}</span>
                    <Price amount={product.price} className={styles.searchSuggestPrice} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {popularTerms.length > 0 && (
            <div className={styles.searchDropdownSection}>
              <span className={styles.searchDropdownLabel}>Popular Searches</span>
              <div className={styles.searchDropdownChips}>
                {popularTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.searchDropdownChip}
                    onMouseDown={() => runSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <div className={styles.searchDropdownSection}>
              <span className={styles.searchDropdownLabel}>
                <TrendingIcon /> Trending Now
              </span>
              <div className={styles.searchSuggestList}>
                {trending.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={styles.searchSuggestRow}
                    onMouseDown={() => setFocused(false)}
                  >
                    <span className={styles.searchSuggestThumb}>
                      {product.imageUrl && (
                        <Image src={product.imageUrl} alt="" fill sizes="36px" className={styles.searchSuggestImg} />
                      )}
                    </span>
                    <span className={styles.searchSuggestName}>{product.name}</span>
                    <Price amount={product.price} className={styles.searchSuggestPrice} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div className={styles.searchDropdown}>
          {loading ? (
            <div className={styles.searchSuggestList}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.searchSuggestRow}>
                  <Skeleton width="36px" height="36px" radius="8px" />
                  <Skeleton width={`${55 + (i % 3) * 12}%`} height="0.85rem" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className={styles.searchSuggestList}>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={styles.searchSuggestRow}
                    onMouseDown={() => setFocused(false)}
                  >
                    <span className={styles.searchSuggestThumb}>
                      {product.imageUrl && (
                        <Image src={product.imageUrl} alt="" fill sizes="36px" className={styles.searchSuggestImg} />
                      )}
                    </span>
                    <span className={styles.searchSuggestName}>{product.name}</span>
                    <Price amount={product.price} className={styles.searchSuggestPrice} />
                  </Link>
                ))}
              </div>
              <button type="button" className={styles.searchSeeAll} onMouseDown={() => runSearch(query)}>
                See all results for &ldquo;{query}&rdquo;
              </button>
            </>
          ) : (
            <p className={styles.searchNoResults}>No quick matches — press Enter to search the full catalog.</p>
          )}
        </div>
      )}
    </div>
  );
}

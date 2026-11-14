import React, { useState, useEffect, useRef } from "react";
import { ZENVYRA_CITIES, type CityClimateData } from "../data/zenvyraCities";

interface SearchBarProps {
  lang: "en" | "fr";
  onSelectCity: (city: CityClimateData) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ lang, onSelectCity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCities = query.trim()
    ? ZENVYRA_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : ZENVYRA_CITIES.slice(0, 8);

  const handleSelect = (city: CityClimateData) => {
    onSelectCity(city);
    setIsOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCities.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCities.length) % filteredCities.length);
    } else if (e.key === "Enter" && filteredCities[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCities[selectedIndex]);
    }
  };

  return (
    <div id="recherche" className="panneau">
      {!isOpen ? (
        <button
          id="explore-city"
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          aria-label={lang === "en" ? "Search a place" : "Chercher un lieu"}
        >
          <span className="city-search-label">
            {lang === "en" ? "Search a place — ⌘K" : "Chercher un lieu — ⌘K"}
          </span>
          <svg className="city-search-icon" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m12.5 12.5 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      ) : (
        <div className="search-active-shell">
          <input
            id="champ-recherche"
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            placeholder={lang === "en" ? "Type a city or country..." : "Tapez une ville ou un pays..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          />
          <button
            type="button"
            className="search-close-x"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {isOpen && filteredCities.length > 0 && (
        <ul id="resultats" role="listbox" className="search-dropdown-menu">
          {filteredCities.map((city, idx) => (
            <li
              key={city.id}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`search-result-item ${idx === selectedIndex ? "active" : ""}`}
              onMouseDown={() => handleSelect(city)}
            >
              <div className="search-item-left">
                <span className="search-item-name">{city.name}</span>
                <span className="search-item-country">{city.country}</span>
              </div>
              <div className="search-item-right">
                <span className="search-item-scope">{city.scope[lang]}</span>
                <span className="search-item-score" style={{ color: city.statusColor }}>
                  {city.score2050}/100
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

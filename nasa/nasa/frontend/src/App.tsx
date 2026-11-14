import React, { useState } from "react";
import "./zenvyra.css";
import { EarthLetterIntro } from "./components/EarthLetterIntro";
import { LoadingVeil } from "./components/LoadingVeil";
import { InteractiveGlobe3D, type RiskLayerType } from "./components/InteractiveGlobe3D";
import { HeaderBar } from "./components/HeaderBar";
import { SearchBar } from "./components/SearchBar";
import { TimelineDock } from "./components/TimelineDock";
import { UtilitiesBar } from "./components/UtilitiesBar";
import { DiagnosticDrawer } from "./components/DiagnosticDrawer";
import { CityComparisonModal } from "./components/CityComparisonModal";
import { StoryCardModal } from "./components/StoryCardModal";
import { AboutMethodologyModal } from "./components/AboutMethodologyModal";
import { GlassCursorHUD } from "./components/GlassCursorHUD";
import { ZENVYRA_CITIES, type CityClimateData } from "./data/zenvyraCities";

export const App: React.FC = () => {
  // App Navigation & Modal States
  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return localStorage.getItem("zenvyra-visited") === "true";
  });
  const [isVeilOpen, setIsVeilOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<"en" | "fr">("en");

  // Climate Projection States
  const [year, setYear] = useState<number>(2050);
  const [activeLayer, setActiveLayer] = useState<RiskLayerType>("chaleur");
  const [layerVisible, setLayerVisible] = useState<boolean>(true);

  // Selected Location for Diagnostic Drawer
  const [selectedCity, setSelectedCity] = useState<CityClimateData | null>(ZENVYRA_CITIES[0]); // Defaults to Paris
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(true);

  // Secondary Modals
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Glass Cursor hover info
  const [hoverCoords, setHoverCoords] = useState<{
    lat: number;
    lon: number;
    tempAnomaly: number;
  } | null>(null);

  // Handlers
  const handleProceedFromLetter = () => {
    localStorage.setItem("zenvyra-visited", "true");
    setHasEntered(true);
    setIsVeilOpen(true);
  };

  const handleEnterFromVeil = () => {
    setIsVeilOpen(false);
  };

  const handleRestart = () => {
    setHasEntered(false);
    setIsVeilOpen(false);
  };

  const handleSelectCity = (city: CityClimateData) => {
    setSelectedCity(city);
    setIsDossierOpen(true);
  };

  return (
    <div className="zenvyra-root">
      {/* 1. Intro Experience: A Letter from Earth */}
      {!hasEntered && (
        <EarthLetterIntro
          isOpen={!hasEntered}
          lang={lang}
          onProceed={handleProceedFromLetter}
        />
      )}

      {/* 2. Loading / Initialization Veil */}
      <LoadingVeil
        isVisible={isVeilOpen}
        lang={lang}
        onEnter={handleEnterFromVeil}
      />

      {/* 3. Core 3D Interactive WebGL Climate Globe */}
      <InteractiveGlobe3D
        year={year}
        activeLayer={activeLayer}
        layerVisible={layerVisible}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        onHoverCoords={setHoverCoords}
      />

      {/* 4. Top Header Brand Lockup */}
      <HeaderBar lang={lang} />

      {/* 5. Center Search Bar (⌘K) */}
      <SearchBar lang={lang} onSelectCity={handleSelectCity} />

      {/* 6. Top Right Utilities Bar (Sound, Lang, Restart, Settings) */}
      <UtilitiesBar
        lang={lang}
        setLang={setLang}
        onRestart={handleRestart}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* 7. Bottom Timeline Dock (Year Slider & Risk Layer Selector) */}
      <TimelineDock
        year={year}
        setYear={setYear}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        layerVisible={layerVisible}
        setLayerVisible={setLayerVisible}
        lang={lang}
      />

      {/* 8. Right Diagnostic Dossier Drawer */}
      {isDossierOpen && selectedCity && (
        <DiagnosticDrawer
          city={selectedCity}
          year={year}
          lang={lang}
          onClose={() => setIsDossierOpen(false)}
          onOpenCompare={() => setIsCompareOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
        />
      )}

      {/* 9. City Duel / Comparison Modal */}
      {selectedCity && (
        <CityComparisonModal
          isOpen={isCompareOpen}
          baseCity={selectedCity}
          lang={lang}
          year={year}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* 10. Story Snapshot Card Modal */}
      <StoryCardModal
        isOpen={isShareOpen}
        city={selectedCity}
        year={year}
        lang={lang}
        onClose={() => setIsShareOpen(false)}
      />

      {/* 11. About & Methodology Modal */}
      <AboutMethodologyModal
        isOpen={isAboutOpen}
        lang={lang}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 12. Glass Cursor Real-time HUD */}
      <GlassCursorHUD coords={hoverCoords} year={year} />
    </div>
  );
};

export default App;

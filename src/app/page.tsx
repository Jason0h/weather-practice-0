// Lesson: Typing makes refactoring & progressive building so much easier

"use client";

import { useEffect, useState, useRef, useEffectEvent } from "react";

import { fetchWeather, type Weather } from "@/lib/api";

type IdWeather = { id: string; weather: Weather };
type IdError = { id: string; error: Error };

function useDebounceSearch(
  input: string,
  setWeather: (weather: Weather | Error) => void,
) {
  const ueeSetWeather = useEffectEvent(setWeather);

  const DEBOUNCE_DELAY = 500;

  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (input.trim() === "") return;

    let cancelled = false;
    const id = setTimeout(() => {
      setSearching(true);
      fetchWeather(input)
        .then((weather) => {
          if (!cancelled) {
            ueeSetWeather(weather);
            setSearching(false);
          }
        })
        .catch((error) => {
          if (error instanceof Error) {
            ueeSetWeather(error);
          } else {
            ueeSetWeather(new Error("Unknown Error"));
          }
          setSearching(false); // successful bug hunt!!!
        });
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(id);
      cancelled = true;
      setSearching(false);
    };
  }, [input]);

  return { searching: searching };
}

function useRegularSearch(setWeather: (weather: Weather | Error) => void) {
  const [searching, setSearching] = useState(false);

  const currentSearch = useRef(0);

  async function handleSearch(input: string) {
    if (input.trim() === "") return;
    const closedSearch = (currentSearch.current += 1);
    setSearching(true);
    let weather: Weather | Error;
    try {
      weather = await fetchWeather(input);
    } catch (error) {
      weather = error instanceof Error ? error : new Error("Unknown Error");
    }

    setSearching(false);
    if (closedSearch === currentSearch.current) {
      setWeather(weather);
    }
  }

  return {
    searching: searching,
    handleSearch: handleSearch,
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [weather, setWeather] = useState<Weather | Error | null>(null);

  const { searching: dbSearching } = useDebounceSearch(input, setWeather);

  const { searching: rgSearching, handleSearch: handleRgSearch } =
    useRegularSearch(setWeather);

  const searching = dbSearching || rgSearching;

  const [history, setHistory] = useState<(IdWeather | IdError)[]>([]);

  function handleSave() {
    if (weather !== null && !(weather instanceof Error))
      setHistory([...history, { id: crypto.randomUUID(), weather: weather }]);
  }

  function handleDelete(id: string) {
    setHistory(history.filter((weather) => weather.id !== id));
  }

  // function is a piece of shit: error should have city info on it too. this suffices for now
  async function handleReload(id: string) {
    const find = history.find((weather) => weather.id === id);
    const cityName =
      find && "weather" in find ? find.weather.cityName : undefined;

    if (cityName !== undefined) {
      let idNewWeather: IdWeather | IdError;
      try {
        const weather = await fetchWeather(cityName);
        idNewWeather = { id: crypto.randomUUID(), weather: weather };
      } catch (error) {
        const weather =
          error instanceof Error ? error : new Error("Unknown Error");
        idNewWeather = { id: crypto.randomUUID(), error: weather };
      }

      setHistory(
        history.map((weather) => (weather.id === id ? idNewWeather : weather)),
      );
    }
  }

  function getSearchResult(): string {
    if (searching) return "Searching";
    if (weather === null) return "No Search Result";
    if (weather instanceof Error) return "Search Error";
    return `City: ${weather.cityName}. Temp: ${weather.temperature}. Date: ${weather.date}`;
  }

  return (
    <div
      data-id="screen"
      className="flex min-h-screen justify-center bg-orange-100 p-6"
    >
      <div
        data-id="app"
        className="flex w-full max-w-3xl flex-col gap-2 rounded-lg bg-gray-200 p-6"
      >
        <div
          data-id="search-card"
          className="flex flex-col gap-2 rounded-lg bg-gray-300 p-6"
        >
          <div
            data-id="search-bar"
            className="flex items-center justify-between gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleRgSearch(input);
              }}
              className="flex-1 rounded-lg border border-gray-400 bg-gray-300 p-2 focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={() => void handleRgSearch(input)}
              className="w-24 rounded-lg bg-orange-300 p-2 text-center hover:bg-orange-400"
            >
              search
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div data-id="result" className="flex-1 rounded-lg bg-gray-400 p-2">
              {getSearchResult()}
            </div>
            <div
              onClick={handleSave}
              className="w-24 rounded-lg bg-orange-300 p-2 text-center hover:bg-orange-400"
            >
              save
            </div>
          </div>
        </div>
        <div
          data-id="history"
          className="flex flex-col gap-2 rounded-lg bg-gray-300 p-6"
        >
          <div className="flex flex-col gap-2">
            {history.map((weather) => {
              return (
                <div key={weather.id} className="flex gap-2">
                  <div className="flex-1 rounded-lg bg-gray-400 p-2">
                    {"weather" in weather
                      ? `City: ${weather.weather.cityName}. Temp: ${weather.weather.temperature}. Date: ${weather.weather.date}`
                      : weather.error.message}
                  </div>
                  <div
                    onClick={() => void handleReload(weather.id)}
                    className="min-w-24 rounded-lg bg-orange-300 p-2 text-center hover:bg-orange-400"
                  >
                    reload
                  </div>
                  <div
                    onClick={() => handleDelete(weather.id)}
                    className="min-w-24 rounded-lg bg-orange-300 p-2 text-center hover:bg-orange-400"
                  >
                    delete
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

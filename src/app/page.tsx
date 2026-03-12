"use client";

import { useEffect, useState } from "react";

import { fetchWeather, type Weather } from "@/lib/api";

function useDebounceSearch(input: string) {
  const DEBOUNCE_DELAY = 500;

  const [weather, setWeather] = useState<Weather | null>(null);
  const [searching, setSearching] = useState(false);
  const [timestamp, setTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    if (input.trim() === "") return;

    let cancelled = false;
    const id = setTimeout(() => {
      setSearching(true);
      fetchWeather(input)
        .then((weather) => {
          if (!cancelled) {
            setWeather(weather);
            setSearching(false);
            setTimestamp(new Date());
          }
        })
        .catch(() => {});
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(id);
      cancelled = true;
      setSearching(false);
    };
  }, [input]);

  return { weather: weather, timestamp: timestamp, searching: searching };
}

function useRegularSearch() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [searching, setSearching] = useState(false);
  const [timestamp, setTimestamp] = useState<Date | null>(null);

  async function handleSearch(input: string) {
    if (input.trim() === "") return;
    setSearching(true);
    const weather = await fetchWeather(input);
    setSearching(false);
    setWeather(weather);
    setTimestamp(new Date());
  }

  return {
    weather: weather,
    timestamp: timestamp,
    searching: searching,
    handleSearch: handleSearch,
  };
}

export default function Home() {
  const [input, setInput] = useState("");

  const {
    weather: dbWeather,
    timestamp: dbTimestamp,
    searching: dbSearching,
  } = useDebounceSearch(input);
  const {
    weather: rgWeather,
    timestamp: rgTimestamp,
    searching: rgSearching,
    handleSearch: handleRgSearch,
  } = useRegularSearch();

  let weather: Weather | null = null;
  if (dbWeather === null && rgWeather === null) {
    weather = null;
  } else if (dbWeather === null) {
    weather = rgWeather;
  } else if (rgWeather === null) {
    weather = dbWeather;
  } else {
    if (rgTimestamp !== null && dbTimestamp !== null) {
      weather = rgTimestamp < dbTimestamp ? dbWeather : rgWeather;
    }
  }

  const searching = dbSearching || rgSearching;

  function handleSave() {
    if (weather !== null) setHistory([...history, weather]);
  }

  const [history, setHistory] = useState<Weather[]>([]);

  function handleDelete(date: string) {
    setHistory(history.filter((weather) => weather.date !== date));
  }

  async function handleReload(date: string) {
    const cityName = history.find((weather) => weather.date === date)?.cityName;
    if (cityName !== undefined) {
      const newWeather = await fetchWeather(cityName);
      setHistory(
        history.map((weather) =>
          weather.date === date ? newWeather : weather,
        ),
      );
    }
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
              {searching
                ? "Searching"
                : weather === null
                  ? "No Search Result"
                  : `City: ${weather.cityName}. Temp: ${weather.temperature}. Date: ${weather.date}`}
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
                <div key={weather.date} className="flex gap-2">
                  <div className="flex-1 rounded-lg bg-gray-400 p-2">
                    {`City: ${weather.cityName}. Temp: ${weather.temperature}. Date: ${weather.date}`}
                  </div>
                  <div
                    onClick={() => void handleReload(weather.date)}
                    className="min-w-24 rounded-lg bg-orange-300 p-2 text-center hover:bg-orange-400"
                  >
                    reload
                  </div>
                  <div
                    onClick={() => handleDelete(weather.date)}
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

export type Weather = { cityName: string; temperature: number; date: string };

const IO_DELAY = 500;

export async function fetchWeather(cityName: string): Promise<Weather> {
  const temperature = Math.round(Math.random() * 100 * 100) / 100;
  const weather = {
    cityName: cityName,
    temperature: temperature,
    date: new Date().toLocaleString(),
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(weather);
    }, IO_DELAY);
  });
}

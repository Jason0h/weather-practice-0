export type Weather = { cityName: string; temperature: number; date: string };

const IO_DELAY = 500;
const ERROR_RATE = 8 / 10;

export async function fetchWeather(cityName: string): Promise<Weather> {
  const temperature = Math.round(Math.random() * 100 * 100) / 100;
  const weather = {
    cityName: cityName,
    temperature: temperature,
    date: new Date().toLocaleString(),
  };
  let error = false;
  if (Math.random() < ERROR_RATE) error = true;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!error) {
        resolve(weather);
      } else {
        reject(new Error("Failure to fetch weather"));
      }
    }, IO_DELAY);
  });
}

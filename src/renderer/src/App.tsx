import { useState, useEffect } from "react";
import { BatteryInfo, Constants } from './globals';
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function App(): JSX.Element {
  const [devices, setDevices] = useState<Record<string, BatteryInfo>>({});
  const [sliderValue, setSliderValue] = useState<number[]>([0]);

  const fetchDevices = async () => {
    const devices = await window.electron.ipcRenderer.invoke('get-battery-info');
    setDevices(devices);
  };

  const fetchSliderValue = async () => {
    const value = await window.electron.ipcRenderer.invoke('get-slider-value');
    setSliderValue([value]);
  };

  const saveSliderValue = (value: number[]) => {
    window.electron.ipcRenderer.invoke('set-slider-value', value[0]);
  };

  useEffect(() => {
    fetchDevices();
    fetchSliderValue();
    const interval = setInterval(fetchDevices, Constants.INTERVAL_MS); // Fetch devices every second
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const getStatus = (discharging: boolean) => {
    return discharging ? "discharging" : "charging";
  };

  return (
    <div className="flex flex-col p-5">
      <p className="text-2xl font-bold tracking-tight">List of connected devices</p>
      <div className="flex flex-col w-full mt-4 gap-y-1">
        {
          Object.keys(devices).map((item) => (
            <div key={item} className="flex flex-row justify-between">
              <p className="font-normal tracking-tight items-center">
                {devices[item].name} - {devices[item].percentage}% <span className="font-light text-xs">( {getStatus(devices[item].discharging ?? false)} )</span>
              </p>
            </div>
          ))
        }

        <div className="flex flex-col gap-y-3 mt-2">
          <p className="font-normal tracking-tight items-center">Show red icons if battery goes below {sliderValue[0]}%</p>
          <Slider
            value={sliderValue}
            max={100}
            step={1}
            onValueChange={(v) => {
              setSliderValue(v);
              saveSliderValue(v);
            }}
            className={cn("w-[60%]")}
          />
        </div>
      </div>
      <p className="absolute bottom-0 mb-5 font-bold">Just close the app & it will run in the background</p>
    </div>
  );
}

export default App;

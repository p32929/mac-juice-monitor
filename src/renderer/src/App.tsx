import { useState, useEffect } from "react";
import { BatteryInfo, Constants } from './globals';

function App(): JSX.Element {
  const [devices, setDevices] = useState<BatteryInfo>({ name: "" });

  const fetchDevices = async () => {
    const devices = await window.electron.ipcRenderer.invoke('get-battery-info');
    setDevices(devices);
  };

  useEffect(() => {
    fetchDevices();
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
                {item} - {devices[item].percentage}% <span className="font-light text-xs">( {getStatus(devices[item].discharging)} )</span>
              </p>
            </div>
          ))
        }
      </div>

      <p className="absolute bottom-0 mb-5 font-bold">Just close the app & it will run in the background</p>
    </div>
  );
}

export default App;

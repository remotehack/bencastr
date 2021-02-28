import React, { useState } from 'react'


export const App = () => {
  return <>
    <h1>Bencaster</h1>

    <Recorder />
  </>;
}

const Recorder = () => {
  const [stream, setStream] = useState<MediaStream>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const start = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: false
    })

    const devices = (await navigator.mediaDevices.enumerateDevices())
      .filter(device => device.kind === 'audioinput')

    setStream(stream);
    setDevices(devices);
  }


  return <>

    {!stream && <button onClick={start}>start</button>}

    {devices.map(dev => <div key={dev.deviceId}>
      <h2>{dev.kind}</h2>
      <h3>{dev.label}</h3>
      <h4>{dev.deviceId}</h4>

    </div>)}

  </>
}

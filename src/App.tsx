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

  const init = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true, video: false
    })

    const devices = (await navigator.mediaDevices.enumerateDevices())
      .filter(device => device.kind === 'audioinput')

    setStream(stream);
    setDevices(devices);
  }

  const choose = async (info: MediaDeviceInfo) => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: info.deviceId },
      video: false
    })

    setStream(prev => {
      prev?.getTracks().forEach(track => track.stop())

      return stream;
    });

  }


  return <>


    {!stream && <button onClick={init}>init</button>}
    {stream && <>
      <h1>{stream.getAudioTracks()[0]?.label}</h1>
    </>}

    {devices.map(dev => <div key={dev.deviceId}>
      <h3> <button onClick={() => choose(dev)}>Use</button> {dev.label}</h3>
    </div>)}

  </>
}

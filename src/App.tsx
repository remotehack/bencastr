import React, { FC, MouseEventHandler, useEffect, useRef, useState } from 'react'


export const App = () => {
  return <div className="container">
    <h1>Bencaster</h1>

    <Recorder />
  </div>;
}

const Recorder = () => {
  const [stream, setStream] = useState<MediaStream>();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioCtx, setAudioCtx] = useState<AudioContext>();

  const init = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    const devices = (await navigator.mediaDevices.enumerateDevices())
      .filter(device => device.kind === 'audioinput')

    setStream(stream);
    setDevices(devices);
    setAudioCtx(new AudioContext());
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

    <Audio stream={stream} audioCtx={audioCtx} />

    <RecordStream stream={stream} />

  </>
}


const Audio: FC<{ stream?: MediaStream, audioCtx?: AudioContext }> = ({ stream, audioCtx }) => {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (stream && audioCtx) {

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();

      source.connect(analyser)

      analyser.fftSize = 2048;
      var bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      let raf: number;
      const ctx = canvas.current!.getContext('2d')!

      const loop = () => {
        raf = requestAnimationFrame(loop);
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = "rgb(200, 200, 200)";
        ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(0, 0, 0)";

        ctx.beginPath();

        var sliceWidth = canvas.current!.width * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {

          var v = dataArray[i] / 128.0;
          var y = v * canvas.current!.height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.current!.width, canvas.current!.height / 2);
        ctx.stroke();
      }

      loop();

      return () => {
        source.disconnect(analyser)
        cancelAnimationFrame(raf);
      }

    }
  }, [stream])


  return <div>

    <canvas width="500" height="100" ref={canvas}></canvas>
  </div>
}

const RecordStream: FC<{ stream?: MediaStream }> = ({ stream }) => {

  const [recorder, setRecorder] = useState<MediaRecorder>()
  const [data, setData] = useState<BlobEvent[]>([])

  useEffect(() => {

    if (stream) {
      const rec = new MediaRecorder(stream)
      setRecorder(rec)

      rec.addEventListener("dataavailable", (e) => {
        console.log("REC", e.data)
        setData(prev => prev.concat(e))
      })
    }

  }, [stream])

  const start = () => {
    recorder?.start()
  }

  const stop = () => {
    recorder?.stop()
  }

  const prep: MouseEventHandler<HTMLAnchorElement> = (event) => {



    const blob = new Blob(data.map(e => e.data), { type: "audio/webm;codecs=opus" })

    const url = URL.createObjectURL(blob);
    event.currentTarget.href = url;

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0)

  }

  if (!stream) return null

  return <>
    <button onClick={start}>Start</button>
    <button onClick={stop}>Stop</button>
    {data.length}

    <a href="" onClick={prep} download={true}>Download</a>
  </>;

}
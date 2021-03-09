import React, {
  FC,
  MouseEventHandler,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const App = () => {
  return (
    <div className="container">
      <h1>Bencaster</h1>

      <Provider>
        <Microphone />

        <Waveform />
        <RecordStream />
        {/*  <Recordings /> */}
      </Provider>
    </div>
  );
};

interface ICtx {
  audio: AudioContext;
  stream: MediaStream;
  devices: MediaDeviceInfo[];
  target: AudioNode;
  setDevice: (device: string) => void;
}

const Context = React.createContext<null | ICtx>(null);

// connects microphone & audio
const Provider: FC = ({ children }) => {
  const [ctx, setCtx] = useState<ICtx>();

  let started = false;
  const init = async () => {
    if (started) return;
    started = true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
      ({ kind }) => kind === "audioinput"
    );

    // todo: safari
    const audio = new AudioContext();

    const target = audio.createGain();

    const source = audio.createMediaStreamSource(stream);
    source.connect(target);

    const setDevice = async (device: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: device } },
      });

      const source = audio.createMediaStreamSource(stream);
      source.connect(target);

      setCtx((prev) => {
        prev!.stream.getTracks().forEach((track) => track.stop());

        return {
          ...prev!,
          stream,
        };
      });
    };

    setCtx({
      audio,
      stream,
      devices,
      target,
      setDevice,
    });
  };

  useEffect(() => {
    if (!ctx) {
      document.body.addEventListener("mouseenter", init);
      window.addEventListener("click", init);

      return () => {
        document.body.removeEventListener("mouseenter", init);
        window.removeEventListener("click", init);
      };
    }

    return;
  }, [ctx]);

  return ctx ? (
    <Context.Provider value={ctx}>{children}</Context.Provider>
  ) : (
    <p>
      <button onClick={init}>start</button>
    </p>
  );
};

const Microphone = () => {
  const ctx = useContext(Context);
  if (!ctx) return null;

  const labels = ctx.stream.getAudioTracks().map((c) => c.label);
  const device = ctx.devices.find((dev) => dev.label === labels[0]);

  const change = (e: any) => ctx.setDevice(e.target.value);

  return (
    <>
      <select onChange={change} value={device && device.deviceId}>
        {ctx.devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </>
  );
};

const Waveform: FC = () => {
  const actx = useContext(Context);
  if (!actx) return null;

  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const analyser = actx.audio.createAnalyser();

    actx.target.connect(analyser);

    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    let raf: number;
    const ctx = canvas.current!.getContext("2d")!;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue(
          "--bg-color"
        ) || "#ccc";

      ctx.fillRect(0, 0, canvas.current!.width, canvas.current!.height);

      ctx.lineWidth = 5;
      ctx.strokeStyle =
        getComputedStyle(document.documentElement).getPropertyValue(
          "--color-primary"
        ) || "#333";

      ctx.beginPath();

      var sliceWidth = (canvas.current!.width * 1.0) / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = (v * canvas.current!.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.current!.width, canvas.current!.height / 2);
      ctx.stroke();
    };

    loop();

    return () => {
      actx.target.disconnect(analyser);
      cancelAnimationFrame(raf);
    };
  }, []);

  const props = useMemo(() => {
    const size = {
      width: 900,
      height: 300,
    };

    const style = {
      width: size.width / (window.devicePixelRatio || 1),
      height: size.height / (window.devicePixelRatio || 1),
    };

    return {
      ...size,
      style,
    };
  }, [window.devicePixelRatio]);

  return (
    <div>
      <canvas {...props} ref={canvas}></canvas>
    </div>
  );
};

enum RecordState {
  NONE,
  RECORDING,
  FINISHED,
}

const RecordStream: FC = () => {
  const actx = useContext(Context);
  if (!actx) return null;

  const [state, setState] = useState<RecordState>(RecordState.NONE);
  const [recorder, setRecorder] = useState<MediaRecorder>();
  const [data, setData] = useState<BlobEvent[]>([]);

  useEffect(() => {
    const sout = actx.audio.createMediaStreamDestination();
    actx.target.connect(sout);

    const rec = new MediaRecorder(sout.stream);
    setRecorder(rec);

    rec.addEventListener("dataavailable", (e) => {
      console.log("REC", e.data);
      setData((prev) => prev.concat(e));
    });

    return () => {
      actx.target.disconnect(sout);
    };
  }, []);

  const start = () => {
    recorder!.start(); // chunk if streaming
    setState(RecordState.RECORDING);
  };

  const stop = () => {
    recorder!.stop();
    setState(RecordState.FINISHED);
  };

  const makeLink: MouseEventHandler<HTMLAnchorElement> = (event) => {
    // todo, pick mime type from blobs
    // debugger;
    const blob = new Blob(
      data.map((e) => e.data),
      { type: "audio/webm;codecs=opus" }
    );

    const url = URL.createObjectURL(blob);
    event.currentTarget.href = url;

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <>
      {state === RecordState.NONE ? (
        <button onClick={start}>Start</button>
      ) : state === RecordState.RECORDING ? (
        <button onClick={stop}>Stop</button>
      ) : (
        <a
          href=""
          onClick={makeLink}
          download={true}
          className="button primary"
        >
          Download
        </a>
      )}
    </>
  );
};

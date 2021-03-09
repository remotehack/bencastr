import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "../_snowpack/pkg/react.js";
export const App = () => {
  return /* @__PURE__ */ React.createElement("div", {
    className: "container"
  }, /* @__PURE__ */ React.createElement("h1", null, "Bencaster"), /* @__PURE__ */ React.createElement(Provider, null, /* @__PURE__ */ React.createElement(Microphone, null), /* @__PURE__ */ React.createElement(Waveform, null), /* @__PURE__ */ React.createElement(RecordStream, null)));
};
const Context = React.createContext(null);
const Provider = ({children}) => {
  const [ctx, setCtx] = useState();
  let started = false;
  const init = async () => {
    if (started)
      return;
    started = true;
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(({kind}) => kind === "audioinput");
    const audio = new AudioContext();
    const target = audio.createGain();
    const source = audio.createMediaStreamSource(stream);
    source.connect(target);
    const setDevice = async (device) => {
      const stream2 = await navigator.mediaDevices.getUserMedia({
        audio: {deviceId: {exact: device}}
      });
      const source2 = audio.createMediaStreamSource(stream2);
      source2.connect(target);
      setCtx((prev) => {
        prev.stream.getTracks().forEach((track) => track.stop());
        return {
          ...prev,
          stream: stream2
        };
      });
    };
    setCtx({
      audio,
      stream,
      devices,
      target,
      setDevice
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
  return ctx ? /* @__PURE__ */ React.createElement(Context.Provider, {
    value: ctx
  }, children) : /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("button", {
    onClick: init
  }, "start"));
};
const Microphone = () => {
  const ctx = useContext(Context);
  if (!ctx)
    return null;
  const labels = ctx.stream.getAudioTracks().map((c) => c.label);
  const device = ctx.devices.find((dev) => dev.label === labels[0]);
  const change = (e) => ctx.setDevice(e.target.value);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("select", {
    onChange: change,
    value: device && device.deviceId
  }, ctx.devices.map((device2) => /* @__PURE__ */ React.createElement("option", {
    key: device2.deviceId,
    value: device2.deviceId
  }, device2.label))));
};
const Waveform = () => {
  const actx = useContext(Context);
  if (!actx)
    return null;
  const canvas = useRef(null);
  useEffect(() => {
    const analyser = actx.audio.createAnalyser();
    actx.target.connect(analyser);
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    let raf;
    const ctx = canvas.current.getContext("2d");
    const loop = () => {
      raf = requestAnimationFrame(loop);
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bg-color") || "#ccc";
      ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
      ctx.lineWidth = 5;
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-primary") || "#333";
      ctx.beginPath();
      var sliceWidth = canvas.current.width * 1 / bufferLength;
      var x = 0;
      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128;
        var y = v * canvas.current.height / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.current.width, canvas.current.height / 2);
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
      height: 300
    };
    const style = {
      width: size.width / (window.devicePixelRatio || 1),
      height: size.height / (window.devicePixelRatio || 1)
    };
    return {
      ...size,
      style
    };
  }, [window.devicePixelRatio]);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("canvas", {
    ...props,
    ref: canvas
  }));
};
var RecordState;
(function(RecordState2) {
  RecordState2[RecordState2["NONE"] = 0] = "NONE";
  RecordState2[RecordState2["RECORDING"] = 1] = "RECORDING";
  RecordState2[RecordState2["FINISHED"] = 2] = "FINISHED";
})(RecordState || (RecordState = {}));
const RecordStream = () => {
  const actx = useContext(Context);
  if (!actx)
    return null;
  const [state, setState] = useState(0);
  const [recorder, setRecorder] = useState();
  const [data, setData] = useState([]);
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
    recorder.start();
    setState(1);
  };
  const stop = () => {
    recorder.stop();
    setState(2);
  };
  const makeLink = (event) => {
    const blob = new Blob(data.map((e) => e.data), {type: "audio/webm;codecs=opus"});
    const url = URL.createObjectURL(blob);
    event.currentTarget.href = url;
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, state === 0 ? /* @__PURE__ */ React.createElement("button", {
    onClick: start
  }, "Start") : state === 1 ? /* @__PURE__ */ React.createElement("button", {
    onClick: stop
  }, "Stop") : /* @__PURE__ */ React.createElement("a", {
    href: "",
    onClick: makeLink,
    download: true,
    className: "button primary"
  }, "Download"));
};

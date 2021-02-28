console.log("Yo!");
// alert("H0")


const button = document.createElement('button')

button.innerText = 'start'
document.body.append(button)


button.addEventListener("click", async () => {

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true, video: false
  });

  console.log("STR", stream)

  var devices = await navigator.mediaDevices.enumerateDevices();

  console.log(devices)

  const audioInputs = devices.filter(device => device.kind === "audioinput")

  console.log(">>>", audioInputs)

  // stream.

  // debugger;



}, { once: true })
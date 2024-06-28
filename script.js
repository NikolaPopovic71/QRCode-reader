const wrapper = document.querySelector(".wrapper");
const form = document.querySelector("form");
const fileInp = document.querySelector("input");
const infoText = document.querySelector("p");
const closeBtn = document.querySelector(".close");
const copyBtn = document.querySelector(".copy");
const shareBtn = document.querySelector(".share");
const openLinkBtn = document.querySelector(".open-link");
const detailsDiv = document.querySelector(".details-div");
const copyNotification = document.querySelector(".copy-notification");

// Read QR Code using jsQR
function readQRCode(file) {
  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.src = reader.result;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        handleQRCodeResult(code.data, file);
      } else {
        infoText.innerText = "Couldn't Scan QR Code";
      }
    };
  };
  reader.readAsDataURL(file);
}

function handleQRCodeResult(result, file) {
  form.querySelector("img").src = URL.createObjectURL(file);
  wrapper.classList.add("active");

  if (isValidURL(result)) {
    console.log("Handling as URL:", result);
    handleURL(result);
  } else if (isVCard(result)) {
    console.log("Handling as VCard:", result);
    handleVCard(result);
  } else {
    console.log("Handling as Text:", result);
    handleText(result);
  }
}

function isValidURL(string) {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$",
    "i"
  );
  return !!urlPattern.test(string);
}

function isVCard(data) {
  const vCard = data.includes("BEGIN:VCARD") && data.includes("END:VCARD");
  console.log("isVCard check:", vCard);
  return vCard;
}

function handleText(text) {
  detailsDiv.innerHTML = text;
  shareBtn.style.display = "block";
  openLinkBtn.style.display = "none";
  shareBtn.onclick = () => shareText(text);
}

function handleURL(url) {
  detailsDiv.innerHTML = url;
  shareBtn.style.display = "none";
  openLinkBtn.style.display = "block";
  openLinkBtn.onclick = () => window.open(url, "_blank");
}

function handleVCard(data) {
  const formattedVCard = transformVCardToText(data);
  console.log("Formatted VCard:", formattedVCard);
  detailsDiv.innerHTML = formattedVCard;
  shareBtn.style.display = "block";
  openLinkBtn.style.display = "none";
  shareBtn.onclick = () => shareText(formattedVCard);
}

function transformVCardToText(data) {
  const lines = data.split(/\r?\n/);
  let formattedData = "";
  let firstName = "";
  let lastName = "";

  lines.forEach((line) => {
    if (
      line.startsWith("BEGIN:VCARD") ||
      line.startsWith("VERSION:") ||
      line.startsWith("END:VCARD")
    ) {
      return;
    }
    if (line.startsWith("FN:")) {
      // Split the full name and extract the first name
      const fullName = line.substring(3).split(" ");
      firstName = fullName[0];
      formattedData += `First Name: ${firstName}<br>`;
    } else if (line.startsWith("N:")) {
      const nameParts = line.substring(2).split(";");
      lastName = nameParts[0];
      formattedData += `Last Name: ${lastName}<br>`;
    } else if (line.startsWith("TEL;TYPE=CELL:")) {
      formattedData += `Mobile: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("TEL;TYPE=VOICE:")) {
      formattedData += `Phone: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("TEL;TYPE=FAX:")) {
      formattedData += `Fax: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("EMAIL:")) {
      formattedData += `Email: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("ORG:")) {
      formattedData += `Company: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("TITLE:")) {
      formattedData += `Title: ${line.split(":")[1]}<br>`;
    } else if (line.startsWith("ADR;")) {
      const addressParts = line.split(":")[1].split(";");
      formattedData += `Address: ${addressParts.slice(2).join(";")}<br>`;
    } else if (line.startsWith("URL:")) {
      formattedData += `URL: ${line.split(":")[1]}<br>`;
    }
  });

  return formattedData.trim();
}

function shareText(text) {
  if (navigator.share) {
    navigator.share({
      text: text.replace(/<br>/g, "\n"),
    });
  } else {
    alert("Sharing not supported");
  }
}

// Send QR Code File With Request To Api
fileInp.addEventListener("change", async (e) => {
  let file = e.target.files[0];
  if (!file) return;
  readQRCode(file);
});

// Copy Text To Clipboard
copyBtn.addEventListener("click", () => {
  let text = detailsDiv.innerHTML;
  const tempElement = document.createElement("textarea");
  tempElement.value = text.replace(/<br>/g, "\n");
  document.body.appendChild(tempElement);
  tempElement.select();
  document.execCommand("copy");
  document.body.removeChild(tempElement);

  // Show the copy notification
  copyNotification.classList.add("show");
  setTimeout(() => {
    copyNotification.classList.remove("show");
  }, 2000); // Hide after 2 seconds
});

// When user click on form do fileInp Eventlistener function
form.addEventListener("click", () => fileInp.click());

closeBtn.addEventListener("click", () => wrapper.classList.remove("active"));

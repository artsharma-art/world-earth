let viewer = null;
let googleApiKey = "";

const loadingScreen =
  document.getElementById("loadingScreen");

const errorPanel =
  document.getElementById("errorPanel");

const errorMessage =
  document.getElementById("errorMessage");

const statusElement =
  document.getElementById("status");

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const searchMessage =
  document.getElementById("searchMessage");

async function getConfig() {
  const response = await fetch("/api/config", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to contact the WORLD EARTH server.");
  }

  const config = await response.json();

  if (!config.googleMapsApiKey) {
    throw new Error(
      "Google Maps API key has not been configured on the server."
    );
  }

  googleApiKey = config.googleMapsApiKey;
}

async function createEarth() {
  try {
    statusElement.textContent = "CONNECTING";

    await getConfig();

    viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      homeButton: false,
      geocoder: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      terrainProvider:
        new Cesium.EllipsoidTerrainProvider(),
      requestRenderMode: true,
      showRenderLoopErrors: false
    });

    viewer.scene.globe.show = false;

    viewer.scene.backgroundColor =
      Cesium.Color.BLACK;

    Cesium.RequestScheduler.requestsByServer[
      "tile.googleapis.com:443"
    ] = 18;

    statusElement.textContent = "LOADING";

    const tileset =
      await Cesium.createGooglePhotorealistic3DTileset({
        key: googleApiKey
      });

    viewer.scene.primitives.add(tileset);

    viewer.scene.globe.show = false;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        -98.5795,
        39.8283,
        15000000
      ),

      duration: 2.5
    });

    statusElement.textContent = "ONLINE";

    loadingScreen.style.opacity = "0";

    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);

  } catch (error) {

    console.error(error);

    statusElement.textContent = "ERROR";

    errorMessage.textContent =
      error.message ||
      "Unable to load the 3D Earth.";

    errorPanel.style.display = "block";
  }
}

function goHome() {
  if (!viewer) return;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      -98.5795,
      39.8283,
      15000000
    ),

    duration: 2
  });
}

async function searchLocation() {
  const query =
    searchInput.value.trim();

  if (!query) {
    searchMessage.textContent =
      "Enter a city or location.";

    return;
  }

  searchMessage.textContent =
    "Searching...";

  try {

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        "Location search failed."
      );
    }

    const results =
      await response.json();

    if (!results.length) {
      searchMessage.textContent =
        "Location not found.";

      return;
    }

    const location = results[0];

    const longitude =
      Number(location.lon);

    const latitude =
      Number(location.lat);

    if (!viewer) {
      return;
    }

    viewer.camera.flyTo({
      destination:
        Cesium.Cartesian3.fromDegrees(
          longitude,
          latitude,
          12000
        ),

      duration: 2.5
    });

    searchMessage.textContent =
      location.display_name;

  } catch (error) {

    console.error(error);

    searchMessage.textContent =
      "Search failed. Try again.";
  }
}

searchButton.addEventListener(
  "click",
  searchLocation
);

searchInput.addEventListener(
  "keydown",
  event => {
    if (event.key === "Enter") {
      searchLocation();
    }
  }
);

document
  .getElementById("homeButton")
  .addEventListener("click", goHome);

document
  .getElementById("retryButton")
  .addEventListener("click", () => {
    errorPanel.style.display = "none";
    createEarth();
  });

document
  .getElementById("locationButton")
  .addEventListener("click", () => {
    if (!navigator.geolocation) {
      searchMessage.textContent =
        "Location services are not available.";
      return;
    }

    searchMessage.textContent =
      "Requesting your location...";

    navigator.geolocation.getCurrentPosition(
      position => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        viewer.camera.flyTo({
          destination:
            Cesium.Cartesian3.fromDegrees(
              longitude,
              latitude,
              10000
            ),

          duration: 2
        });

        searchMessage.textContent =
          "Showing your approximate location.";
      },

      () => {
        searchMessage.textContent =
          "Location permission was not granted.";
      }
    );
  });

createEarth();

export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
}

/*
  Default location for FlowSafe.
  Thane, Maharashtra.
*/
export const DEFAULT_LOCATION: LocationData = {
  latitude: 19.2183,
  longitude: 72.9781,
  name: "Thane, Maharashtra",
};


/*
  Try browser GPS.

  If permission is denied or GPS fails,
  automatically use the default location.
*/
export function getUserLocation(): Promise<LocationData> {

  return new Promise((resolve) => {

    if (!navigator.geolocation) {

      resolve(DEFAULT_LOCATION);

      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: "Your current location",
        });

      },

      () => {

        console.warn(
          "Location permission unavailable. Using default location."
        );

        resolve(DEFAULT_LOCATION);

      },

      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      }

    );

  });

}
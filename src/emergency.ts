export type EmergencyContacts = {
  emergency: string;
  police: string;
  fire: string;
  ambulance: string;
};

const emergencyContacts: Record<string, EmergencyContacts> = {

  India: {
    emergency: "112",
    police: "100",
    fire: "101",
    ambulance: "108",
  },

  "United States": {
    emergency: "911",
    police: "911",
    fire: "911",
    ambulance: "911",
  },

  "United Kingdom": {
    emergency: "999",
    police: "999",
    fire: "999",
    ambulance: "999",
  },

  Canada: {
    emergency: "911",
    police: "911",
    fire: "911",
    ambulance: "911",
  },

  Australia: {
    emergency: "000",
    police: "000",
    fire: "000",
    ambulance: "000",
  },

  Singapore: {
    emergency: "999",
    police: "999",
    fire: "995",
    ambulance: "995",
  },

  Germany: {
    emergency: "112",
    police: "110",
    fire: "112",
    ambulance: "112",
  },

  France: {
    emergency: "112",
    police: "17",
    fire: "18",
    ambulance: "15",
  },

  Japan: {
    emergency: "110",
    police: "110",
    fire: "119",
    ambulance: "119",
  },

  "South Korea": {
    emergency: "119",
    police: "112",
    fire: "119",
    ambulance: "119",
  },

  China: {
    emergency: "110",
    police: "110",
    fire: "119",
    ambulance: "120",
  },

};

export function getEmergencyContacts(
  country: string
): EmergencyContacts {

  return (
    emergencyContacts[country] || {
      emergency: "112",
      police: "112",
      fire: "112",
      ambulance: "112",
    }
  );

}
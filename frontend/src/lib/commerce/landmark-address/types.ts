/**
 * Landmark-Based Addressing Types
 * Wave F5: Landmark-Based Addressing (SVM)
 * 
 * Nigeria-first addressing system using landmarks for delivery success.
 * Supports informal addresses common in Nigerian commerce.
 */

export interface NigerianState {
  code: string;
  name: string;
  capital: string;
  lgas: string[];
}

export interface LandmarkAddress {
  id?: string;
  recipientName: string;
  recipientPhone: string;
  alternatePhone?: string;
  
  state: string;
  lga: string;
  city?: string;
  area: string;
  
  landmark: string;
  landmarkType?: LandmarkType;
  nearbyLandmark?: string;
  
  streetName?: string;
  houseNumber?: string;
  buildingName?: string;
  floor?: string;
  
  deliveryInstructions?: string;
  
  isDefault?: boolean;
  label?: AddressLabel;
  
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export type LandmarkType = 
  | 'CHURCH'
  | 'MOSQUE'
  | 'SCHOOL'
  | 'HOSPITAL'
  | 'MARKET'
  | 'BANK'
  | 'FILLING_STATION'
  | 'BUS_STOP'
  | 'JUNCTION'
  | 'BRIDGE'
  | 'ROUNDABOUT'
  | 'HOTEL'
  | 'PLAZA'
  | 'ESTATE'
  | 'GOVERNMENT_OFFICE'
  | 'POLICE_STATION'
  | 'MAJOR_ROAD'
  | 'OTHER';

export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface AddressValidationResult {
  isValid: boolean;
  errors: AddressValidationError[];
  suggestions?: AddressSuggestion[];
  formattedAddress?: string;
}

export interface AddressValidationError {
  field: string;
  message: string;
}

export interface AddressSuggestion {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
}

export interface SavedAddress extends LandmarkAddress {
  id: string;
  customerId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressSearchResult {
  addresses: SavedAddress[];
  total: number;
}

export const LANDMARK_TYPE_LABELS: Record<LandmarkType, string> = {
  CHURCH: 'Church',
  MOSQUE: 'Mosque',
  SCHOOL: 'School',
  HOSPITAL: 'Hospital/Clinic',
  MARKET: 'Market',
  BANK: 'Bank',
  FILLING_STATION: 'Filling Station',
  BUS_STOP: 'Bus Stop',
  JUNCTION: 'Junction',
  BRIDGE: 'Bridge',
  ROUNDABOUT: 'Roundabout',
  HOTEL: 'Hotel',
  PLAZA: 'Plaza/Shopping Center',
  ESTATE: 'Estate/Housing',
  GOVERNMENT_OFFICE: 'Government Office',
  POLICE_STATION: 'Police Station',
  MAJOR_ROAD: 'Major Road',
  OTHER: 'Other',
};

export const ADDRESS_LABEL_LABELS: Record<AddressLabel, string> = {
  HOME: 'Home',
  WORK: 'Work',
  OTHER: 'Other',
};

export const NIGERIAN_STATES: NigerianState[] = [
  {
    code: 'AB',
    name: 'Abia',
    capital: 'Umuahia',
    lgas: ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umu Nneochi'],
  },
  {
    code: 'AD',
    name: 'Adamawa',
    capital: 'Yola',
    lgas: ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
  },
  {
    code: 'AK',
    name: 'Akwa Ibom',
    capital: 'Uyo',
    lgas: ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
  },
  {
    code: 'AN',
    name: 'Anambra',
    capital: 'Awka',
    lgas: ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  },
  {
    code: 'BA',
    name: 'Bauchi',
    capital: 'Bauchi',
    lgas: ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
  },
  {
    code: 'BY',
    name: 'Bayelsa',
    capital: 'Yenagoa',
    lgas: ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
  },
  {
    code: 'BE',
    name: 'Benue',
    capital: 'Makurdi',
    lgas: ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Vandeikya'],
  },
  {
    code: 'BO',
    name: 'Borno',
    capital: 'Maiduguri',
    lgas: ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
  },
  {
    code: 'CR',
    name: 'Cross River',
    capital: 'Calabar',
    lgas: ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
  },
  {
    code: 'DE',
    name: 'Delta',
    capital: 'Asaba',
    lgas: ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
  },
  {
    code: 'EB',
    name: 'Ebonyi',
    capital: 'Abakaliki',
    lgas: ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
  },
  {
    code: 'ED',
    name: 'Edo',
    capital: 'Benin City',
    lgas: ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  },
  {
    code: 'EK',
    name: 'Ekiti',
    capital: 'Ado-Ekiti',
    lgas: ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
  },
  {
    code: 'EN',
    name: 'Enugu',
    capital: 'Enugu',
    lgas: ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'],
  },
  {
    code: 'FC',
    name: 'Federal Capital Territory',
    capital: 'Abuja',
    lgas: ['Abaji', 'Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
  },
  {
    code: 'GO',
    name: 'Gombe',
    capital: 'Gombe',
    lgas: ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
  },
  {
    code: 'IM',
    name: 'Imo',
    capital: 'Owerri',
    lgas: ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
  },
  {
    code: 'JI',
    name: 'Jigawa',
    capital: 'Dutse',
    lgas: ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Kaugama', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
  },
  {
    code: 'KD',
    name: 'Kaduna',
    capital: 'Kaduna',
    lgas: ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
  },
  {
    code: 'KN',
    name: 'Kano',
    capital: 'Kano',
    lgas: ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  },
  {
    code: 'KT',
    name: 'Katsina',
    capital: 'Katsina',
    lgas: ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', 'Mai\'Adua', 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
  },
  {
    code: 'KE',
    name: 'Kebbi',
    capital: 'Birnin Kebbi',
    lgas: ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
  },
  {
    code: 'KO',
    name: 'Kogi',
    capital: 'Lokoja',
    lgas: ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  },
  {
    code: 'KW',
    name: 'Kwara',
    capital: 'Ilorin',
    lgas: ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
  },
  {
    code: 'LA',
    name: 'Lagos',
    capital: 'Ikeja',
    lgas: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  },
  {
    code: 'NA',
    name: 'Nasarawa',
    capital: 'Lafia',
    lgas: ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
  },
  {
    code: 'NI',
    name: 'Niger',
    capital: 'Minna',
    lgas: ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
  },
  {
    code: 'OG',
    name: 'Ogun',
    capital: 'Abeokuta',
    lgas: ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
  },
  {
    code: 'ON',
    name: 'Ondo',
    capital: 'Akure',
    lgas: ['Akoko North-East', 'Akoko North-West', 'Akoko South-West', 'Akoko South-East', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
  },
  {
    code: 'OS',
    name: 'Osun',
    capital: 'Osogbo',
    lgas: ['Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Egbedore', 'Ejigbo', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
  },
  {
    code: 'OY',
    name: 'Oyo',
    capital: 'Ibadan',
    lgas: ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo', 'Oyo East', 'Saki East', 'Saki West', 'Surulere'],
  },
  {
    code: 'PL',
    name: 'Plateau',
    capital: 'Jos',
    lgas: ['Bokkos', 'Barkin Ladi', 'Bassa', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang South', 'Langtang North', 'Mangu', 'Mikang', 'Pankshin', 'Qua\'an Pan', 'Riyom', 'Shendam', 'Wase'],
  },
  {
    code: 'RI',
    name: 'Rivers',
    capital: 'Port Harcourt',
    lgas: ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  },
  {
    code: 'SO',
    name: 'Sokoto',
    capital: 'Sokoto',
    lgas: ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
  },
  {
    code: 'TA',
    name: 'Taraba',
    capital: 'Jalingo',
    lgas: ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
  },
  {
    code: 'YO',
    name: 'Yobe',
    capital: 'Damaturu',
    lgas: ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
  },
  {
    code: 'ZA',
    name: 'Zamfara',
    capital: 'Gusau',
    lgas: ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Chafe', 'Zurmi'],
  },
];

export function getStateByCode(code: string): NigerianState | undefined {
  return NIGERIAN_STATES.find(s => s.code === code);
}

export function getStateByName(name: string): NigerianState | undefined {
  return NIGERIAN_STATES.find(s => s.name.toLowerCase() === name.toLowerCase());
}

export function getLGAsForState(stateCode: string): string[] {
  const state = getStateByCode(stateCode);
  return state?.lgas || [];
}

export function formatLandmarkAddress(address: LandmarkAddress): string {
  const parts: string[] = [];
  
  if (address.houseNumber || address.buildingName) {
    parts.push([address.houseNumber, address.buildingName].filter(Boolean).join(', '));
  }
  
  if (address.streetName) {
    parts.push(address.streetName);
  }
  
  parts.push(`Near ${address.landmark}`);
  
  if (address.nearbyLandmark) {
    parts.push(`(also near ${address.nearbyLandmark})`);
  }
  
  parts.push(address.area);
  parts.push(`${address.lga}, ${address.state}`);
  
  return parts.join(', ');
}

export function formatShortAddress(address: LandmarkAddress): string {
  return `${address.area}, near ${address.landmark} - ${address.lga}, ${address.state}`;
}

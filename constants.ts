
import { CustardShop, OperatingHours } from './types';

const KOPPS_HOURS: Record<number, OperatingHours> = {
  0: { open: "10:30", close: "22:00" },
  1: { open: "10:30", close: "22:00" },
  2: { open: "10:30", close: "22:00" },
  3: { open: "10:30", close: "22:00" },
  4: { open: "10:30", close: "22:00" },
  5: { open: "10:30", close: "23:00" },
  6: { open: "10:30", close: "23:00" },
};

const LEONS_HOURS: Record<number, OperatingHours> = {
  0: { open: "11:00", close: "23:00" },
  1: { open: "11:00", close: "23:00" },
  2: { open: "11:00", close: "23:00" },
  3: { open: "11:00", close: "23:00" },
  4: { open: "11:00", close: "23:00" },
  5: { open: "11:00", close: "23:00" },
  6: { open: "11:00", close: "23:00" },
};

const GILLES_HOURS: Record<number, OperatingHours> = {
  0: { open: "11:00", close: "22:00" },
  1: { open: "11:00", close: "22:00" },
  2: { open: "11:00", close: "22:00" },
  3: { open: "11:00", close: "22:00" },
  4: { open: "11:00", close: "22:00" },
  5: { open: "11:00", close: "22:00" },
  6: { open: "11:00", close: "22:00" },
};

const OSCARS_HOURS: Record<number, OperatingHours> = {
  0: { open: "10:30", close: "22:00" },
  1: { open: "10:30", close: "22:00" },
  2: { open: "10:30", close: "22:00" },
  3: { open: "10:30", close: "22:00" },
  4: { open: "10:30", close: "22:00" },
  5: { open: "10:30", close: "24:00" },
  6: { open: "10:30", close: "24:00" },
};

const LEDUCS_HOURS: Record<number, OperatingHours | null> = {
  0: { open: "11:00", close: "21:00" },
  1: null, // Monday: Closed
  2: { open: "11:00", close: "21:00" },
  3: { open: "11:00", close: "21:00" },
  4: { open: "11:00", close: "21:00" },
  5: { open: "11:00", close: "21:00" },
  6: { open: "11:00", close: "21:00" },
};

const CULVERS_HOURS_10: Record<number, OperatingHours> = {
  0: { open: "10:00", close: "22:00" },
  1: { open: "10:00", close: "22:00" },
  2: { open: "10:00", close: "22:00" },
  3: { open: "10:00", close: "22:00" },
  4: { open: "10:00", close: "22:00" },
  5: { open: "10:00", close: "22:00" },
  6: { open: "10:00", close: "22:00" },
};

const CULVERS_HOURS_11: Record<number, OperatingHours> = {
  0: { open: "10:00", close: "23:00" },
  1: { open: "10:00", close: "23:00" },
  2: { open: "10:00", close: "23:00" },
  3: { open: "10:00", close: "23:00" },
  4: { open: "10:00", close: "23:00" },
  5: { open: "10:00", close: "23:00" },
  6: { open: "10:00", close: "23:00" },
};

export const MILWAUKEE_SHOPS: CustardShop[] = [
  // --- ICONIC LOCALS FIRST ---
  {
    id: 'leons',
    name: "Leon's Frozen Custard",
    address: "3131 S 27th St, Milwaukee, WI 53215",
    lat: 42.9877,
    lng: -87.9482,
    website: "https://leonsfrozencustard.us",
    brandColor: "#e61919",
    chain: "Leon's",
    logoUrl: "/leons.png",
    hours: LEONS_HOURS
  },
  {
    id: 'gilles',
    name: "Gilles Frozen Custard",
    address: "7515 W Bluemound Rd, Milwaukee, WI 53213",
    lat: 43.0354,
    lng: -88.0061,
    website: "https://gillesfrozencustard.com",
    brandColor: "#004d99",
    chain: "Gilles",
    logoUrl: "https://www.google.com/s2/favicons?domain=gillesfrozencustard.com&sz=64",
    hours: GILLES_HOURS
  },
  {
    id: 'kopps-greenfield',
    name: "Kopp's - Greenfield",
    address: "7631 W Layton Ave, Greenfield, WI 53220",
    lat: 42.9608,
    lng: -88.0104,
    website: "https://kopps.com",
    brandColor: "#1a5e3e",
    chain: "Kopp's",
    logoUrl: "https://www.google.com/s2/favicons?domain=kopps.com&sz=64",
    hours: KOPPS_HOURS
  },
  {
    id: 'oscars-west-allis',
    name: "Oscar's - West Allis",
    address: "2362 S 108th St, West Allis, WI 53227",
    lat: 43.0042,
    lng: -88.0461,
    website: "https://oscarscustard.com",
    brandColor: "#f39c12",
    chain: "Oscar's",
    logoUrl: "https://www.google.com/s2/favicons?domain=oscarscustard.com&sz=64",
    hours: OSCARS_HOURS
  },

  // --- KOPP'S (Remaining) ---
  {
    id: 'kopps-brookfield',
    name: "Kopp's - Brookfield",
    address: "18880 W Bluemound Rd, Brookfield, WI 53045",
    lat: 43.0366,
    lng: -88.1691,
    website: "https://kopps.com",
    brandColor: "#1a5e3e",
    chain: "Kopp's",
    logoUrl: "https://www.google.com/s2/favicons?domain=kopps.com&sz=64",
    hours: KOPPS_HOURS
  },
  {
    id: 'kopps-glendale',
    name: "Kopp's - Glendale",
    address: "5373 N Port Washington Rd, Glendale, WI 53217",
    lat: 43.1167,
    lng: -87.9158,
    website: "https://kopps.com",
    brandColor: "#1a5e3e",
    chain: "Kopp's",
    logoUrl: "https://www.google.com/s2/favicons?domain=kopps.com&sz=64",
    hours: KOPPS_HOURS
  },

  // --- OSCAR'S (Remaining) ---
  {
    id: 'oscars-franklin',
    name: "Oscar's - Franklin",
    address: "7041 S 27th St, Franklin, WI 53132",
    lat: 42.9174,
    lng: -87.9507,
    website: "https://oscarscustard.com",
    brandColor: "#f39c12",
    chain: "Oscar's",
    logoUrl: "https://www.google.com/s2/favicons?domain=oscarscustard.com&sz=64",
    hours: OSCARS_HOURS
  },
  {
    id: 'oscars-waukesha',
    name: "Oscar's - Waukesha",
    address: "21165 E Moreland Blvd, Waukesha, WI 53186",
    lat: 43.0320,
    lng: -88.1760,
    website: "https://oscarscustard.com",
    brandColor: "#f39c12",
    chain: "Oscar's",
    logoUrl: "https://www.google.com/s2/favicons?domain=oscarscustard.com&sz=64",
    hours: OSCARS_HOURS,
    temporaryClosure: "Temporarily Closed (Fire)"
  },
  {
    id: 'leducs',
    name: "LeDuc's Frozen Custard",
    address: "240 W Summit Ave, Wales, WI 53183",
    lat: 43.0076,
    lng: -88.3752,
    website: "https://leducscustard.com",
    brandColor: "#d93025",
    chain: "LeDuc's",
    logoUrl: "https://www.google.com/s2/favicons?domain=leducscustard.com&sz=64",
    hours: LEDUCS_HOURS
  },

  // --- CULVER'S ---
  {
    id: 'culvers-brookfield-124th',
    name: "Culver's of Brookfield - N 124th St",
    address: "3705 North 124th St., Brookfield, WI 53005",
    lat: 43.08540725708008,
    lng: -88.06702423095703,
    website: "https://www.culvers.com/restaurants/brookfield-124th",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-brookfield-capitol',
    name: "Culver's of Brookfield - W Capitol Dr",
    address: "21300 W. Capitol Drive, Pewaukee, WI 53072",
    lat: 43.08415985107422,
    lng: -88.177490234375,
    website: "https://www.culvers.com/restaurants/brookfield-capitol",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-brown-deer',
    name: "Culver's of Brown Deer - W Schroeder Dr",
    address: "4327 W. Schroeder Drive, Brown Deer, WI 53223",
    lat: 43.18611145019531,
    lng: -87.96513366699219,
    website: "https://www.culvers.com/restaurants/brown-deer",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-elm-grove-wi',
    name: "Culver's of Elm Grove - W Bluemound Rd",
    address: "15280 W. Bluemound Road, Elm Grove, WI 53122",
    lat: 43.03653335571289,
    lng: -88.10372161865234,
    website: "https://www.culvers.com/restaurants/elm-grove-wi",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-franklin',
    name: "Culver's of Franklin - W Oakwood Park Ct",
    address: "4220 W. Oakwood Park Ct., Franklin, WI 53132",
    lat: 42.87202072143555,
    lng: -87.97013854980469,
    website: "https://www.culvers.com/restaurants/franklin",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-glendale-wi-bayside-dr',
    name: "Culver's of Glendale - Bayshore",
    address: "300 W Bayside Drive, Glendale, WI 53217",
    lat: 43.1245002746582,
    lng: -87.91290283203125,
    website: "https://www.culvers.com/restaurants/glendale-wi-bayside-dr",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-grafton',
    name: "Culver's of Grafton - Wisconsin Ave",
    address: "2001 Wisconsin Ave., Grafton, WI 53024",
    lat: 43.30497360229492,
    lng: -87.96100616455078,
    website: "https://www.culvers.com/restaurants/grafton",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-greenfield-wi-layton-ave',
    name: "Culver's of Greenfield - W Layton Ave",
    address: "6031 W Layton Ave, Greenfield, WI 53220",
    lat: 42.958984375,
    lng: -87.9899673461914,
    website: "https://www.culvers.com/restaurants/greenfield-wi-layton-ave",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-hales-corners',
    name: "Culver's of Hales Corners - S 108th St",
    address: "6101-A South 108th Street, Hales Corners, WI 53130",
    lat: 42.93419647216797,
    lng: -88.04946899414062,
    website: "https://www.culvers.com/restaurants/hales-corners",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-menomonee-falls',
    name: "Culver's of Menomonee Falls - County Line Rd",
    address: "W186 N9581 Bancroft Dr., Menomonee Falls, WI 53051",
    lat: 43.191654205322266,
    lng: -88.14076232910156,
    website: "https://www.culvers.com/restaurants/menomonee-falls",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-mequon',
    name: "Culver's of Mequon - N Port Washington Rd",
    address: "11150 N. Port Washington, Mequon, WI 53092",
    lat: 43.22075271606445,
    lng: -87.9234390258789,
    website: "https://www.culvers.com/restaurants/mequon",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-milwaukee-fond-du-lac',
    name: "Culver's of Milwaukee - W Fond du Lac Ave",
    address: "5501 W Fond du Lac Ave, Milwaukee, WI 53216",
    lat: 43.09434509277344,
    lng: -87.98262023925781,
    website: "https://www.culvers.com/restaurants/milwaukee-fond-du-lac",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_11
  },
  {
    id: 'culvers-milwaukee-good-hope',
    name: "Culver's of Milwaukee - W Good Hope Rd",
    address: "7515 West Good Hope Road, Milwaukee, WI 53223",
    lat: 43.148231506347656,
    lng: -88.00408172607422,
    website: "https://www.culvers.com/restaurants/milwaukee-good-hope",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-milwaukee-layton',
    name: "Culver's of Milwaukee - W Layton Ave",
    address: "575 W. Layton Avenue, Milwaukee, WI 53207",
    lat: 42.95858383178711,
    lng: -87.91893768310547,
    website: "https://www.culvers.com/restaurants/milwaukee-layton",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_11
  },
  {
    id: 'culvers-muskego',
    name: "Culver's of Muskego - Racine Ave",
    address: "W187 S7959 Racine Ave., Muskego, WI 53150",
    lat: 42.90005874633789,
    lng: -88.14868927001953,
    website: "https://www.culvers.com/restaurants/muskego",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-new-berlin',
    name: "Culver's of New Berlin - W National Ave",
    address: "14855 W. National Ave., New Berlin, WI 53151",
    lat: 42.98250961303711,
    lng: -88.09871673583984,
    website: "https://www.culvers.com/restaurants/new-berlin",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-oak-creek',
    name: "Culver's of Oak Creek - S Howell Ave",
    address: "7841 S. Howell Avenue, Oak Creek, WI 53154",
    lat: 42.901634216308594,
    lng: -87.9126205444336,
    website: "https://www.culvers.com/restaurants/oak-creek",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-racine-wi-douglas-ave',
    name: "Culver's of Racine - Douglas Ave",
    address: "4542 Douglas Ave, Racine, WI 53402",
    lat: 42.77839660644531,
    lng: -87.80684661865234,
    website: "https://www.culvers.com/restaurants/racine-wi-douglas-ave",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-shorewood',
    name: "Culver's of Shorewood - E Capitol Dr",
    address: "1325 E. Capitol Drive, Shorewood, WI 53211",
    lat: 43.08860778808594,
    lng: -87.89392852783203,
    website: "https://www.culvers.com/restaurants/shorewood",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-sussex',
    name: "Culver's of Sussex - Hwy 164",
    address: "W249 N6620 Hwy. 164, Sussex, WI 53089",
    lat: 43.1379508972168,
    lng: -88.24332427978516,
    website: "https://www.culvers.com/restaurants/sussex",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-waukesha-grandview',
    name: "Culver's of Waukesha - N Grandview Blvd",
    address: "2600 N. Grandview Blvd., Waukesha, WI 53188",
    lat: 43.03982925415039,
    lng: -88.25642395019531,
    website: "https://www.culvers.com/restaurants/waukesha-grandview",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-waukesha-hwy-164',
    name: "Culver's of Waukesha - E Main St",
    address: "1650 East Main Street, Waukesha, WI 53186",
    lat: 43.02266311645508,
    lng: -88.2018051147461,
    website: "https://www.culvers.com/restaurants/waukesha-hwy-164",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-waukesha-sunset',
    name: "Culver's of Waukesha - W Sunset Dr",
    address: "840 W. Sunset Drive, Waukesha, WI 53189-7018",
    lat: 42.988609313964844,
    lng: -88.24684143066406,
    website: "https://www.culvers.com/restaurants/waukesha-sunset",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-west-allis',
    name: "Culver's of West Allis - S 108th St",
    address: "1672 South 108th Street, West Allis, WI 53214",
    lat: 43.011837005615234,
    lng: -88.04576873779297,
    website: "https://www.culvers.com/restaurants/west-allis",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_10
  },
  {
    id: 'culvers-west-milwaukee',
    name: "Culver's of West Milwaukee - Miller Park Way",
    address: "1641 Miller Parkway, West Milwaukee, WI 53214",
    lat: 43.013084411621094,
    lng: -87.96820068359375,
    website: "https://www.culvers.com/restaurants/west-milwaukee",
    brandColor: "#005696",
    chain: "Culver's",
    logoUrl: "https://www.google.com/s2/favicons?domain=culvers.com&sz=64",
    hours: CULVERS_HOURS_11
  },
];

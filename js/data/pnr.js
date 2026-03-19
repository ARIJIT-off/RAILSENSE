// ═══════════════════════════════════════════════
// RailSmart — Mock PNR Records
// ═══════════════════════════════════════════════

const PNR_RECORDS = [
  {
    pnr: '2451876390',
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    journeyDate: '2026-03-16',
    from: 'NDLS',
    to: 'BCT',
    boardingPoint: 'NDLS',
    class: '2A',
    chartStatus: 'Prepared',
    passengers: [
      { name: 'Arjun Sharma', age: 32, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'A1', berth: '24', berthType: 'LB' },
      { name: 'Priya Sharma', age: 28, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'A1', berth: '25', berthType: 'MB' },
    ],
  },
  {
    pnr: '8723019456',
    trainNumber: '12301',
    trainName: 'Howrah Rajdhani Express',
    journeyDate: '2026-03-17',
    from: 'NDLS',
    to: 'HWH',
    boardingPoint: 'NDLS',
    class: '3A',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Rahul Verma', age: 45, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'B2', berth: '58', berthType: 'UB' },
      { name: 'Sunita Verma', age: 42, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'B2', berth: '57', berthType: 'MB' },
      { name: 'Rohan Verma', age: 18, gender: 'M', booking: 'RAC', current: 'RAC 5', coach: 'B4', berth: '62', berthType: 'SL' },
    ],
  },
  {
    pnr: '6190473825',
    trainNumber: '12621',
    trainName: 'Tamil Nadu Express',
    journeyDate: '2026-03-18',
    from: 'NDLS',
    to: 'MAS',
    boardingPoint: 'NDLS',
    class: 'SL',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Karthik Rajan', age: 25, gender: 'M', booking: 'WL 12', current: 'WL 4', coach: '--', berth: '--', berthType: '--' },
      { name: 'Deepa Lakshmi', age: 22, gender: 'F', booking: 'WL 13', current: 'WL 5', coach: '--', berth: '--', berthType: '--' },
    ],
  },
  {
    pnr: '3047261985',
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi Express',
    journeyDate: '2026-03-15',
    from: 'NDLS',
    to: 'BPL',
    boardingPoint: 'NDLS',
    class: 'CC',
    chartStatus: 'Prepared',
    passengers: [
      { name: 'Anil Kumar', age: 55, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'C2', berth: '37', berthType: 'WS' },
    ],
  },
  {
    pnr: '5839201674',
    trainNumber: '22691',
    trainName: 'KSR Bengaluru Rajdhani',
    journeyDate: '2026-03-19',
    from: 'NDLS',
    to: 'SBC',
    boardingPoint: 'NDLS',
    class: '2A',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Meera Nair', age: 30, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'A2', berth: '11', berthType: 'LB' },
      { name: 'Vijay Nair', age: 34, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'A2', berth: '12', berthType: 'UB' },
      { name: 'Baby Nair', age: 4, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'A2', berth: '11', berthType: 'LB' },
    ],
  },
  {
    pnr: '7412680359',
    trainNumber: '12723',
    trainName: 'Telangana Express',
    journeyDate: '2026-03-16',
    from: 'AGC',
    to: 'SC',
    boardingPoint: 'AGC',
    class: '3A',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Sai Krishna', age: 27, gender: 'M', booking: 'RAC 2', current: 'CNF', coach: 'B1', berth: '46', berthType: 'SU' },
    ],
  },
  {
    pnr: '1095834726',
    trainNumber: '12903',
    trainName: 'Golden Temple Mail',
    journeyDate: '2026-03-17',
    from: 'BCT',
    to: 'NDLS',
    boardingPoint: 'BCT',
    class: 'SL',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Gurpreet Singh', age: 38, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'S4', berth: '15', berthType: 'LB' },
      { name: 'Harsheet Kaur', age: 35, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'S4', berth: '16', berthType: 'MB' },
      { name: 'Jasleen Kaur', age: 10, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'S4', berth: '18', berthType: 'UB' },
      { name: 'Param Singh', age: 8, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'S4', berth: '17', berthType: 'SU' },
    ],
  },
  {
    pnr: '9263047185',
    trainNumber: '12431',
    trainName: 'Trivandrum Rajdhani Express',
    journeyDate: '2026-03-21',
    from: 'NDLS',
    to: 'TVC',
    boardingPoint: 'NDLS',
    class: '1A',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Dr. Suresh Menon', age: 60, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'H1', berth: '3', berthType: 'CP' },
      { name: 'Lakshmi Menon', age: 56, gender: 'F', booking: 'CNF', current: 'CNF', coach: 'H1', berth: '4', berthType: 'CP' },
    ],
  },
  {
    pnr: '4628190573',
    trainNumber: '12839',
    trainName: 'Howrah Chennai Mail',
    journeyDate: '2026-03-16',
    from: 'HWH',
    to: 'BBS',
    boardingPoint: 'HWH',
    class: '2A',
    chartStatus: 'Prepared',
    passengers: [
      { name: 'Amit Das', age: 40, gender: 'M', booking: 'CNF', current: 'CNF', coach: 'A1', berth: '7', berthType: 'LB' },
    ],
  },
  {
    pnr: '8150392647',
    trainNumber: '12627',
    trainName: 'Karnataka Express',
    journeyDate: '2026-03-20',
    from: 'NDLS',
    to: 'SBC',
    boardingPoint: 'NDLS',
    class: 'SL',
    chartStatus: 'Not Prepared',
    passengers: [
      { name: 'Naveen Gowda', age: 23, gender: 'M', booking: 'WL 34', current: 'WL 8', coach: '--', berth: '--', berthType: '--' },
    ],
  },
];

// Helper: Lookup PNR
function lookupPNR(pnrNumber) {
  return PNR_RECORDS.find(r => r.pnr === pnrNumber) || null;
}

// Get all PNR numbers for quick-select
function getAllPNRNumbers() {
  return PNR_RECORDS.map(r => r.pnr);
}

// A rate is enabled only after its population, unit and primary source are verified.
window.TMM_COUNTRIES = Object.freeze({
  jp: {currency: 'JPY', symbol: '¥', rates: {fullTime: 2500, partTime: 1500}, status: 'provisional', year: null, population: 'CE provisional assumptions; not national medians', source: null},
  us: {currency: 'USD', symbol: '$', rates: null, status: 'source-pending'},
  gb: {currency: 'GBP', symbol: '£', rates: null, status: 'source-pending'},
  ie: {currency: 'EUR', symbol: '€', rates: {fullTime: 18.24, partTime: 16.66}, status: 'verified-median', year: 2022, population: 'Administrative & Secretarial employees, full-time/part-time, Structure of Earnings Survey 2022 Table 4.2', source: 'https://www.cso.ie/en/releasesandpublications/ep/p-ses/structureofearningssurvey2022/occupationandeducation/'},
  cn: {currency: 'CNY', symbol: '¥', rates: null, status: 'source-pending'}
});

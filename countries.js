// A rate is enabled only after its population, unit and primary source are verified.
window.TMM_COUNTRIES = Object.freeze({
  jp: {currency: 'JPY', symbol: '¥', rates: {fullTime: 2500, partTime: 1500}, status: 'provisional', year: null, population: 'CE provisional assumptions; not national medians', source: null},
  us: {currency: 'USD', symbol: '$', rates: null, status: 'source-pending'},
  gb: {currency: 'GBP', symbol: '£', rates: {fullTime: 15.81, partTime: 14.03}, status: 'verified-median', year: 2025, population: 'Administrative and secretarial occupations (SOC 20 code 4), UK employee jobs, hourly pay excluding overtime, full-time/part-time, ASHE Table 14.6a 2025 revised row 281', source: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14'},
  ie: {currency: 'EUR', symbol: '€', rates: {fullTime: 18.24, partTime: 16.66}, status: 'verified-median', year: 2022, population: 'Administrative & Secretarial employees, full-time/part-time, Structure of Earnings Survey 2022 Table 4.2', source: 'https://www.cso.ie/en/releasesandpublications/ep/p-ses/structureofearningssurvey2022/occupationandeducation/'},
  cn: {currency: 'CNY', symbol: '¥', rates: null, status: 'source-pending'}
});

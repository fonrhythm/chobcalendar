export function feedRegion(value) {
  const map = {
    thai: 'thailand',
    thailand: 'thailand',
    china: 'china',
    oversea: 'oversea',
    overseas: 'oversea',
    泰国: 'thailand',
    中国: 'china',
    海外: 'oversea',
    'south korea': 'oversea',
    'republic of korea': 'oversea',
    korea: 'oversea',
    kr: 'oversea',
    韩国: 'oversea',
    韓國: 'oversea',
    เกาหลีใต้: 'oversea',
    ...Object.fromEntries(['越南','vietnam','vn','菲律宾','菲律賓','philippines','ph','巴西','brazil','br','中国香港','中國香港','香港','hong kong','hk','中国澳门','中國澳門','澳门','澳門','macau','macao','mo','中国台湾','中國台灣','台湾','台灣','taiwan','tw','日本','japan','jp','新加坡','singapore','sg','马来西亚','馬來西亞','malaysia','my','印度尼西亚','印尼','indonesia','id','美国','美國','united states','usa','us','英国','英國','united kingdom','uk','澳大利亚','澳洲','australia','au','加拿大','canada','ca'].map(value => [value, 'oversea'])),
  };
  const region =
    map[
      String(value || '')
        .trim()
        .toLowerCase()
    ];
  return region || value;
}

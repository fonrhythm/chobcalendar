export const dramaCategoryColors={
 'Boys Love':{background:'#C1E4D2',text:'#304E43',badge:'#F2FAF5'},
 'Girls Love':{background:'#E8C7D1',text:'#623E4B',badge:'#FFF4F7'},
 'BG':{background:'#EDDAC2',text:'#604B32',badge:'#FFF8EF'},
 'Bromance':{background:'#D7D3E7',text:'#4B4565',badge:'#F6F4FD'},
};
export function dramaCategoryStyle(types=[]){const color=types.map(t=>dramaCategoryColors[t]).find(Boolean)||{background:'#DDE6DD',text:'#425A4C',badge:'#F3F7F2'};return {'--drama-chip-bg':color.background,'--drama-chip-text':color.text,'--drama-chip-badge':color.badge};}

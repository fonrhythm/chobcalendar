// Shared focus containment for modal dialogs and long submission forms.
export function trapModalTab(event,root){
 if(event.key!=='Tab'||!root)return;
 const nodes=[...root.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
 if(!nodes.length){event.preventDefault();return;}
 if(event.shiftKey&&(document.activeElement===nodes[0]||document.activeElement===root)){event.preventDefault();nodes.at(-1).focus();}
 else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus();}
}

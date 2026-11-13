<script setup>
import {ref,computed} from 'vue';import {useLanguageStore} from '../stores/language';import {tours,tourCopy} from '../onboarding/config.js';
const props=defineProps({interactive:Boolean,initialModule:{type:String,default:'schedule'},guideState:{type:Object,default:()=>({modules:{},learned:[]})}});const emit=defineEmits(['replay']);const language=useLanguageStore(),chosen=ref(props.initialModule);
const copy=computed(()=>({zh:{title:'使用教程',intro:'两套日历各有独立教程，随时可以重新查看。已学过的共通步骤可选择跳过。',replay:'重新播放遮罩教程',completed:'已完成',skipped:'已跳过',new:'尚未学习'},en:{title:'User guide',intro:'Each calendar has its own guide. Replay anytime, and optionally skip shared topics already learned.',replay:'Replay guided tour',completed:'Completed',skipped:'Skipped',new:'Not started'},th:{title:'คู่มือการใช้งาน',intro:'แต่ละปฏิทินมีคู่มือแยกกัน เปิดดูใหม่ได้ทุกเมื่อและเลือกข้ามเนื้อหาร่วมที่เรียนแล้วได้',replay:'เริ่มคู่มือแบบไฮไลต์อีกครั้ง',completed:'เรียนแล้ว',skipped:'ข้ามแล้ว',new:'ยังไม่เริ่ม'}})[language.currentLanguage]);
</script>
<template>
  <article v-if="interactive" class="guide-hub"><h3>{{copy.title}}</h3><p>{{copy.intro}}</p><nav><button v-for="module in ['schedule','drama']" :key="module" :aria-pressed="chosen===module" :class="{active:chosen===module}" @click="chosen=module">{{module==='schedule'?'Schedule':'Drama'}}<small>{{copy[guideState.modules[module]?.status||'new']}}</small></button></nav><button class="guide-replay" @click="emit('replay',chosen)">{{chosen==='schedule'?'Schedule':'Drama'}} · {{copy.replay}}</button><ol><li v-for="step in tours[chosen]" :key="step.id"><h4>{{tourCopy(step.title,language.currentLanguage)}}</h4><p>{{tourCopy(step.body,language.currentLanguage)}}</p></li></ol></article>
  <article v-else class="tutorial-content">
    <h3>查看活动</h3>
    <p>
      从主页选择 CHINA、THAILAND 或
      OVERSEA。切换月份，点击日期查看当天全部活动，再点击姓名查看活动详情。关闭详情可返回当天列表。
    </p>
    <h3>筛选与收藏</h3>
    <p>
      使用公司、艺人类型筛选或搜索寻找活动。可以全选或全不选。通过个人菜单打开“我的收藏”；在详情中收藏活动，或加入“我的事项”。
    </p>
    <h3>参与事项</h3>
    <p>
      事项视图分为消费、填表、开票、其他。事项日期是办理日期，活动详情显示实际活动日期；请留意两者的区别。
    </p>
    <h3>颜色与标记</h3>
    <p>颜色区分艺人类别，日间和夜间使用同一组颜色。显示活动名称或六人／组及以上的活动使用实色边框；★只表示有点名。过去日期淡化显示。</p>
    <h3>状态与来源</h3>
    <p>
      取消和延期活动会淡化显示；延期记录注明原日期与新日期。内容待核实表示有人提出纠错，在管理员处理前保持提示。请结合活动来源核实最新安排。
    </p>
    <h3>复制图片 URL</h3>
    <p>
      打开来源图片，长按或右键选择“复制图片地址”，粘贴公开图片链接。贴文网页地址与图片地址不同。手机没有此选项时可以尝试浏览器打开图片；新增活动时也可暂时不填图片。
    </p>
    <h3>联系管理员</h3>
    <p>
      删除活动、批量添加或其他问题，请联系
      <a
        href="https://x.com/ChobCalendar"
        target="_blank"
        rel="noopener noreferrer"
        >@ChobCalendar</a
      >。
    </p>
  </article>
</template>

<style scoped>.guide-hub{font-size:13px;line-height:1.7}.guide-hub>h3{font-size:20px;margin-top:0}.guide-hub nav{display:flex;gap:12px;margin:20px 0}.guide-hub nav button{flex:1;padding:10px 14px;border:1px solid #8DA6C144;background:transparent;color:inherit;border-radius:8px;font:inherit;cursor:pointer}.guide-hub nav button.active{border-color:#6F9DD4;background:#6F9DD418}.guide-hub small{display:block;font-size:10px;opacity:.65}.guide-replay{background:#587DAA;color:#fff;border:0;border-radius:8px;padding:10px 14px;font:inherit;cursor:pointer}.guide-hub ol{padding-left:22px;margin-top:24px}.guide-hub li{padding:0 0 10px 4px}.guide-hub h4{font-size:14px;margin:14px 0 6px}.guide-hub li p{margin:0;opacity:.8}</style>

export const tours = {
  schedule: [
    {
      id: 'welcome',
      common: 'basics',
      target: '[data-tour="schedule-nav"]',
      title: {
        zh: '欢迎使用 Schedule',
        en: 'Welcome to Schedule',
        th: 'ยินดีต้อนรับสู่ Schedule',
      },
      body: {
        zh: '在这里查看艺人行程。点击 CHOB 回到首页，可切换中英泰语言与日夜外观。',
        en: 'Find artist events here. CHOB opens the homepage, where you can change language and appearance.',
        th: 'ดูตารางงานศิลปินที่นี่ กด CHOB เพื่อกลับหน้าแรกและเปลี่ยนภาษาหรือธีม',
      },
    },
    {
      id: 'calendar',
      common: 'calendar',
      target: '[data-tour="schedule-filters"]',
      title: {
        zh: '日历、搜索与筛选',
        en: 'Calendar, search and filters',
        th: 'ปฏิทิน ค้นหา และตัวกรอง',
      },
      body: {
        zh: '月份箭头和今天用于切换日期，月／周／事项切换显示方式。搜索及公司、艺人类别、活动类型可组合使用；全选时点击某项会先只选它。',
        en: 'Use month arrows and Today to navigate. Switch month/week/items. Combine search and filters; clicking one option from All first selects only that option.',
        th: 'ใช้ลูกศรเดือนและวันนี้เพื่อเปลี่ยนวัน สลับเดือน สัปดาห์ หรือรายการ ค้นหาและกรองร่วมกันได้ เมื่อเลือกทั้งหมดแล้วกดตัวเลือกหนึ่ง จะเลือกเฉพาะตัวนั้นก่อน',
      },
    },
    {
      id: 'chips',
      common: null,
      target: '[data-tour="schedule-content"]',
      title: {
        zh: 'Chip 颜色与点名星号',
        en: 'Chip colours and roll-call stars',
        th: 'สี Chip และดาวเช็กชื่อ',
      },
      body: {
        zh: 'Chip 颜色对应艺人类别，混合阵容有独立颜色。实色边框表示按活动名称展示或多人阵容；★只表示有点名，请特别留意。过去日期会淡化，点击 Chip 可查看详情。',
        en: 'Colours represent artist categories, with a separate mixed-lineup colour. Outlines indicate activity-title or large-lineup display. ★ means roll call only. Past dates fade; click a chip for details.',
        th: 'สีแยกประเภทศิลปินและมีสีสำหรับหลายประเภท เส้นขอบใช้กับชื่อกิจกรรมหรือศิลปินหลายคน ★ หมายถึงมีการเช็กชื่อเท่านั้น วันที่ผ่านไปจะจางลง กด Chip เพื่อดูรายละเอียด',
      },
    },
    {
      id: 'account',
      common: 'account',
      target: '[data-tour="personal-calendar"]',
      title: {
        zh: '登录、收藏与个人日历',
        en: 'Account and personal calendar',
        th: 'บัญชีและปฏิทินส่วนตัว',
      },
      body: {
        zh: '从个人菜单登录，在详情收藏活动或加入个人事项。个人日历汇总收藏活动、直播和整部剧更新，并保留原活动类别；登录后可同步个人记录。',
        en: 'Sign in through the personal menu. Save events or personal items in details. Your personal calendar brings events, livestreams and followed dramas together while keeping their original labels.',
        th: 'เข้าสู่ระบบผ่านเมนูส่วนตัว บันทึกกิจกรรมหรือรายการจากรายละเอียด ปฏิทินส่วนตัวรวมกิจกรรม ไลฟ์ และซีรีส์ที่ติดตาม โดยเก็บป้ายประเภทเดิม',
      },
    },
    {
      id: 'contribute',
      common: 'contribute',
      target: '[data-tour="schedule-contribute"]',
      title: {
        zh: '新增活动与纠错',
        en: 'Submit events and corrections',
        th: 'เพิ่มกิจกรรมและแจ้งแก้ไข',
      },
      body: {
        zh: '使用新增活动提交资料，在详情或页底提出纠错。提交后进入活动审核，不会绕过审核直接发布。未保存的内容请先存草稿。',
        en: 'Submit an event or suggest a correction from details or the page footer. Submissions enter event review rather than publishing immediately. Save unfinished work as a draft.',
        th: 'เพิ่มกิจกรรมหรือแจ้งแก้ไขจากรายละเอียดหรือท้ายหน้า ข้อมูลจะเข้าสู่การตรวจสอบกิจกรรมก่อนเผยแพร่ บันทึกร่างไว้หากยังกรอกไม่เสร็จ',
      },
    },
    {
      id: 'other',
      common: null,
      target: '[data-tour="drama-nav"]',
      title: {
        zh: '也来看看 Drama',
        en: 'Explore Drama',
        th: 'ลองใช้ Drama',
      },
      body: {
        zh: 'Drama 是独立的追剧月历和剧集库。相关 Press Tour 可关联 Schedule，同一活动不必重复录入。你可以从导航栏进入，再查看独立的 Drama 教程。',
        en: 'Drama has its own broadcast calendar and library. Related Press Tours can link to Schedule without duplicating the same event. Open Drama in the navigation for its own guide.',
        th: 'Drama มีปฏิทินออกอากาศและคลังซีรีส์แยกต่างหาก Press Tour เชื่อมกับ Schedule ได้โดยไม่ต้องสร้างกิจกรรมซ้ำ เปิด Drama จากเมนูเพื่อดูคู่มือเฉพาะ',
      },
    },
  ],
  drama: [
    {
      id: 'welcome',
      common: 'basics',
      target: '[data-tour="drama-heading"]',
      title: {
        zh: '欢迎使用 Drama',
        en: 'Welcome to Drama',
        th: 'ยินดีต้อนรับสู่ Drama',
      },
      body: {
        zh: '在这里慢慢追好故事。播出月历查看更新日期，剧集库查看已公布、制作中或正在播出的作品。首页 CHOB 可切换语言与日夜外观。',
        en: 'Follow good stories at your own pace. Use the broadcast calendar for updates and the library for announced, in-production or airing titles. CHOB offers language and appearance settings.',
        th: 'ติดตามเรื่องราวดี ๆ ได้ตามจังหวะของคุณ ปฏิทินแสดงวันอัปเดต คลังซีรีส์รวมเรื่องที่ประกาศ กำลังผลิต หรือออกอากาศ กด CHOB เพื่อเปลี่ยนภาษาหรือธีม',
      },
    },
    {
      id: 'calendar',
      common: 'calendar',
      target: '[data-tour="drama-calendar"]',
      title: {
        zh: '日、周、月与筛选',
        en: 'Views, search and filters',
        th: 'มุมมอง ค้นหา และตัวกรอง',
      },
      body: {
        zh: '切换日／周／月或回到今天；搜索剧名及类型，也可组合筛选出品公司、类别、播出状态与制作进度。月历点日期看全天列表，周视图可直接点 Chip。',
        en: 'Switch day/week/month or return to Today. Search titles and genres, then combine studio, genre and status filters. A date opens its daily list; weekly chips open details directly.',
        th: 'สลับวัน สัปดาห์ เดือน หรือกลับวันนี้ ค้นหาชื่อและประเภท พร้อมกรองบริษัท ประเภท และสถานะ กดวันที่เพื่อดูรายการทั้งวัน ส่วน Chip ในสัปดาห์เปิดรายละเอียดได้ทันที',
      },
    },
    {
      id: 'chips',
      common: null,
      target: '[data-tour="drama-calendar"]',
      title: {
        zh: '类别、集数与播出状态',
        en: 'Genres, episodes and status',
        th: 'ประเภท ตอน และสถานะ',
      },
      body: {
        zh: '蓝色 BL、贝壳白 BG、雾紫 GL、冷灰 Bromance、黑色群像。Chip 右侧显示 EP，首集与最终集用镂空实边。原日期划线表示改期，公告说明新安排；未定档作品只进入剧集库。',
        en: 'BL is blue, BG seashell, GL mist purple, Bromance cool grey and ensemble black. EP badges show episodes; premieres and finales have solid outlines. Crossed-out originals and notices explain changes. Unscheduled titles stay in the library.',
        th: 'BL สีน้ำเงิน BG สีเปลือกหอย GL สีม่วงหมอก Bromance สีเทาเย็น และเรื่องตัวละครหมู่สีดำ ป้าย EP ระบุตอน ตอนแรกและตอนจบใช้เส้นขอบ วันที่เดิมขีดฆ่าและประกาศบอกการเปลี่ยนแปลง เรื่องไม่มีกำหนดอยู่ในคลัง',
      },
    },
    {
      id: 'library',
      common: null,
      target: '[data-tour="drama-library"]',
      title: {
        zh: '剧集库',
        en: 'Drama library',
        th: 'คลังซีรีส์',
      },
      body: {
        zh: '正在播出统计按真实资料计算。可按播出日期、集数、英文或剧名排序；点击作品查看三语剧名、Cast、平台及官方来源，海报可放大和切换。',
        en: 'Airing statistics use actual records. Sort by premiere, episode count or title. Open a drama for its titles, cast, platforms and official source. Posters can be enlarged and browsed.',
        th: 'สถิติเรื่องที่ออกอากาศคำนวณจากข้อมูลจริง เรียงตามวันเริ่ม จำนวนตอน หรือชื่อได้ เปิดเรื่องเพื่อดูชื่อ นักแสดง แพลตฟอร์ม และแหล่งทางการ ขยายและเลื่อนรูปได้',
      },
    },
    {
      id: 'account',
      common: 'account',
      target: '[data-tour="personal-calendar"]',
      title: {
        zh: '收藏整部剧',
        en: 'Follow an entire drama',
        th: 'ติดตามทั้งเรื่อง',
      },
      body: {
        zh: '登录后在详情收藏整部剧，个人日历会根据有效播出计划显示更新日期，改期后跟随新安排。个人日历可单独筛选剧集更新、线下活动或直播。',
        en: 'Sign in and follow a drama from its details. Your personal calendar shows dates from its effective schedule, including changes, and filters drama updates, in-person events or livestreams.',
        th: 'เข้าสู่ระบบและติดตามจากหน้ารายละเอียด ปฏิทินส่วนตัวจะแสดงวันตามตารางที่ใช้งานรวมการเปลี่ยนแปลง และกรองซีรีส์ กิจกรรมออฟไลน์ หรือไลฟ์ได้',
      },
    },
    {
      id: 'contribute',
      common: 'contribute',
      target: '[data-tour="drama-add"]',
      title: {
        zh: '新增资料与纠错',
        en: 'Submit drama information',
        th: 'เพิ่มและแก้ไขข้อมูลซีรีส์',
      },
      body: {
        zh: '右下角新增入口提交剧集资料，详情内可提出纠错。剧集与活动使用独立审核渠道；通过审核也不会自动开启 Drama 的公开发布。',
        en: 'Use the add button or suggest a correction in details. Drama and event submissions use separate review channels; review approval does not automatically release Drama publicly.',
        th: 'ใช้ปุ่มเพิ่มหรือแจ้งแก้ไขในรายละเอียด การตรวจสอบซีรีส์แยกจากกิจกรรม การอนุมัติไม่ได้เปิดเผยแพร่ Drama โดยอัตโนมัติ',
      },
    },
    {
      id: 'other',
      common: null,
      target: '[data-tour="schedule-nav"]',
      title: {
        zh: '回到 Schedule',
        en: 'Explore Schedule',
        th: 'กลับไปที่ Schedule',
      },
      body: {
        zh: 'Schedule 展示艺人活动与参与事项。剧集详情中的 Press Tour／观影活动可返回对应 Schedule 行程。两套教程分别记录学习状态，也可随时从使用指南重新打开。',
        en: 'Schedule shows artist events and participation items. Linked Press Tours and screenings can take you back to Schedule. Each guide keeps its own status and can be replayed from the user guide.',
        th: 'Schedule แสดงกิจกรรมศิลปินและรายการเข้าร่วม Press Tour หรือกิจกรรมรับชมที่เชื่อมไว้พากลับไป Schedule ได้ คู่มือทั้งสองบันทึกสถานะแยกกันและเปิดดูใหม่ได้',
      },
    },
  ],
}
export const tourCopy = (value, locale) => value[locale] || value.zh

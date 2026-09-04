// 演示数据生成器：重置公共演示账本（main 两张表）为一组连贯的实习日薪场景数据
// 用法：node demo-data.js
const https = require("https");
const BUCKET = "UrzxrixVP5M6YxVgB8Sc34";

// 演示参数：实习日薪制，和收入数据口径一致
const DEMO_SETTINGS = {
  payMode: "daily", dailyPay: 150, attendDaysPerWeek: 5, internMonths: 12,
  workStartHour: "09:00", restDay: 6,
  netPay: 3250, payMonths: 12, workdaysPerWeek: 5,
  dailyHours: 8, overtimePerDay: 1, commuteOneWayMin: 40, workCostPerDay: 18,
  freeFundTarget: 100000, safetyMonths: 6
};

// [月, 日, 类型, 分类, 金额, 备注]
const RAW = [
  [7,15,"income","salary",3300,"7月实习工资（22天×150）"],
  [8,15,"income","salary",3300,"8月实习工资"],
  [7,26,"income","parttime",180,"帮同事代做周报模板"],
  [7,1,"expense","rent",1200,"房租"], [8,1,"expense","rent",1200,"房租"], [9,1,"expense","rent",1200,"房租"],
  [7,3,"expense","transit",100,"地铁月卡充值"], [8,3,"expense","transit",100,"地铁月卡充值"],
  [8,14,"expense","transit",23,"加班晚归打车"], [8,30,"expense","transit",19,"加班晚归打车"],
  [7,4,"expense","food",22,"公司附近快餐"], [7,9,"expense","food",18,"沙县"], [7,16,"expense","food",27,"和同事拼黄焖鸡"],
  [7,23,"expense","food",19,"食堂吃腻了"], [7,30,"expense","food",24,"隆江猪脚饭"],
  [8,6,"expense","food",21,"外卖满减凑了半天"], [8,12,"expense","food",29,"午饭+西瓜"],
  [8,20,"expense","food",17,"沙县"], [8,27,"expense","food",26,"发工资吃顿好的"],
  [9,1,"expense","food",23,"开工饭"], [9,3,"expense","food",15,"包子豆浆"],
  [7,12,"expense","fun",35,"电影《默杀》"], [8,9,"expense","fun",42,"剧本杀拼车"],
  [7,19,"expense","shop",89,"优衣库T恤"], [8,18,"expense","shop",45,"耳机保护套"],
  [9,2,"expense","shop",39,"笔记本和笔"],
  [8,26,"expense","med",36,"感冒药"],
  [7,8,"expense","other",15,"瑞幸"], [8,5,"expense","other",14,"库迪"],
];
const mkId = (m,d,c) => "d" + m + String(d).padStart(2,"0") + c;
const RECORDS = RAW.map(([m,d,type,cat,amount,note]) => {
  const h = type==="income" ? 10 : 12 + (d % 9);   // 工资上午10点；午饭13-21点散布
  return { id: mkId(m,d,cat), ts: new Date(2026, m-1, d, h, (d*7)%60).getTime(), type, cat, amount, note };
}).sort((a,b)=>a.ts-b.ts);

function put(key, value){
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(value);
    const req = https.request({ hostname:"kvdb.io", path:"/"+BUCKET+"/"+key, method:"PUT",
      headers:{ "Content-Type":"application/json", "Content-Length": Buffer.byteLength(body) } },
      res => { res.resume(); res.on("end", ()=>resolve(res.statusCode)); });
    req.on("error", reject); req.write(body); req.end();
  });
}
(async () => {
  const r1 = await put("records", RECORDS);
  const r2 = await put("settings", DEMO_SETTINGS);
  const inc = RECORDS.filter(r=>r.type==="income").reduce((a,r)=>a+r.amount,0);
  const exp = RECORDS.filter(r=>r.type==="expense").reduce((a,r)=>a+r.amount,0);
  console.log("PUT records:", r1, " settings:", r2);
  console.log("条数:", RECORDS.length, " 总收入:", inc, " 总支出:", exp, " 结余:", inc-exp, " 基金进度:", ((inc-exp)/DEMO_SETTINGS.freeFundTarget*100).toFixed(1)+"%");
})();

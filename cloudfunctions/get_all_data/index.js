const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const MAX_LIMIT = 100

exports.main = async (event, context) => {
  // 先取出集合记录总数
  const countResult = await db.collection('todos').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('todos').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  // const result = await Promise.all(tasks);
  // const arr = []
  // result.forEach(item => {
  //   arr.push({
  //     data: item.data,
  //     msg: item.errMsg
  //   })
  // });
  // return arr;
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      msg: acc.errMsg,
    }
  })
}

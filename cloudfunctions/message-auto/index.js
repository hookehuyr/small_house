// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const contentArr = ["输入数字可以获得帮助哦~", "1 怎么知道是否中奖？", "2 如何兑换奖励？", "3 实物如何兑奖？"]
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let openid = wxContext.OPENID
  // 查看是否发送过
  let res = await db.collection('message_auto')
    .where({
      openid: openid
    })
    .get()
  console.log("message_auto res: ", res)
  if (res.data && res.data.length > 0) {
    return
  }
  let messageResult = await cloud.openapi.customerServiceMessage.send({
    touser: openid,
    msgtype: 'text',
    text: {
      content: contentArr.join("\n"),
    },
  })
  console.log("message_auto send res: ", messageResult)
  if (messageResult.errCode == 0) {
    let messageAddRes = await db.collection('message_auto').add({
      data: {
        "openid": openid,
        "create_time": new Date()
      }
    })
    console.log('messageAddRes: ', messageAddRes)
  }
}

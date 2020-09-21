// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const contentArr = ["开奖后，会公告中奖用户和对应奖励，并发送中奖通知", "奖励会在您发送兑奖信息后24小时内兑换", "填写好收件人信息，48小时内发货（暂不支持港澳台、新疆、西藏等地区）"]
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('message event:', event)
  let content = event.Content;
  const wxContext = cloud.getWXContext();

  if (!content || !content.trim()) {
    console.log('message can not be empty!')
    return
  }

  if (!isNaN(content) && content % 1 == 0 && content > 0 && content <= contentArr.length) {
    let res = cloud.openapi.customerServiceMessage.send({
      touser: wxContext.OPENID,
      msgtype: 'text',
      text: {
        content: contentArr[content - 1],
      },
    })
    return
  }

  return {
    MsgType: 'transfer_customer_service',
    ToUserName: wxContext.OPENID,
    FromUserName: 'gh_af5994635ce0',
    CreateTime: parseInt(+new Date / 1000),
  }
}

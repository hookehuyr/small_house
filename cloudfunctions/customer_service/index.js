// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
/**
 * {
   "FromUserName": "ohl4L0Rnhq7vmmbT_DaNQa4ePaz0",
   "ToUserName": "wx3d289323f5900f8e",
   "Content": "测试",
   "CreateTime": 1555684067,
   "MsgId": "49d72d67b16d115e7935ac386f2f0fa41535298877_1555684067",
   "MsgType": "text"
 }
*/
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 关键字 默认回复
  let text = ''
  switch (event.Content) {
    case '白天':
      text = '黑夜'
      break;
  }

  if (text) {
    await cloud.openapi.customerServiceMessage.send({
      touser: wxContext.OPENID,
      msgtype: 'text',
      text: {
        content: text,
      },
    })
    return 'success'
  } else {
    return 'success'
    // return {
    //   MsgType: 'transfer_customer_service',
    //   ToUserName: 'op0Vf5V6BCfnZmKRGBO-FVf-8QGc',
    //   FromUserName: 'hooke1234',
    //   CreateTime: parseInt(+new Date / 1000),
    // }
  }
}
